import json, os
from celery import Celery
from tenacity import retry, stop_after_attempt, wait_exponential
import anthropic
from models import SessionLocal, Job, Finding, Report
from prompts import (CHUNK_SYSTEM, SYNTHESIS_SYSTEM,
                     chunk_user_prompt, synthesis_user_prompt)
from datetime import datetime

import ssl

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

SSL_OPTS = {"ssl_cert_reqs": ssl.CERT_NONE}

celery_app = Celery("research_gaps", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    broker_use_ssl=SSL_OPTS,
    redis_backend_use_ssl=SSL_OPTS,
)

claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
CHUNK_SIZE = 10   # papers per chunk


# ── Retry wrapper (handles rate limits gracefully) ─────────────────────────

@retry(stop=stop_after_attempt(4), wait=wait_exponential(min=5, max=60))
def call_claude_sync(system: str, user: str, use_search: bool = False) -> dict:
    kwargs = dict(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    if use_search:
        kwargs["tools"] = [{"type": "web_search_20250305", "name": "web_search"}]

    resp = claude.messages.create(**kwargs)
    text = "".join(b.text for b in resp.content if b.type == "text")
    return json.loads(text.replace("```json", "").replace("```", "").strip())


# ── Chunk analysis task ────────────────────────────────────────────────────

@celery_app.task(bind=True)
def analyze_chunk(self, job_id: str, chunk_index: int,
                  papers_text: str, filters: list[str]):
    db = SessionLocal()
    try:
        result = call_claude_sync(
            CHUNK_SYSTEM,
            chunk_user_prompt(papers_text, filters)
        )

        # Persist each finding
        for gap in result.get("gaps", []):
            db.add(Finding(job_id=job_id, kind="gap", chunk_index=chunk_index,
                           title=gap["title"], description=gap["description"],
                           detail=json.dumps(gap), severity=gap.get("severity")))
        for c in result.get("contradictions", []):
            db.add(Finding(job_id=job_id, kind="contradiction", chunk_index=chunk_index,
                           title=c["title"], description=c["description"],
                           detail=json.dumps(c)))
        for m in result.get("methodology", []):
            db.add(Finding(job_id=job_id, kind="methodology", chunk_index=chunk_index,
                           title=m["title"], description=m["description"],
                           detail=json.dumps(m)))
        for s in result.get("suggestions", []):
            db.add(Finding(job_id=job_id, kind="suggestion", chunk_index=chunk_index,
                           title=s["direction"][:80], description=s["rationale"],
                           detail=json.dumps(s)))

        job = db.query(Job).filter_by(id=job_id).first()
        job.chunks_done += 1
        db.commit()

        # When all chunks done, trigger synthesis
        if job.chunks_done >= job.chunks_total:
            synthesize_job.delay(job_id, filters)

    except Exception as e:
        db.query(Job).filter_by(id=job_id).first().status = "failed"
        db.query(Job).filter_by(id=job_id).first().error = str(e)
        db.commit()
    finally:
        db.close()


# ── Synthesis task — merges all chunk findings ────────────────────────────

@celery_app.task
def synthesize_job(job_id: str, filters: list[str]):
    db = SessionLocal()
    try:
        job = db.query(Job).filter_by(id=job_id).first()
        job.status = "synthesizing"
        db.commit()

        findings = db.query(Finding).filter_by(job_id=job_id).all()
        all_text = "\n\n".join(
            f"[{f.kind.upper()}] {f.title}: {f.description}"
            for f in findings
        )

        result = call_claude_sync(
            SYNTHESIS_SYSTEM,
            synthesis_user_prompt(all_text, job.total_papers, filters)
        )

        stats = result.get("stats", {})
        db.add(Report(
            job_id=job_id,
            summary=result.get("summary", ""),
            stats=json.dumps(stats),
        ))

        job.status = "done"
        job.finished_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        job = db.query(Job).filter_by(id=job_id).first()
        job.status = "failed"
        job.error = str(e)
        db.commit()
    finally:
        db.close()