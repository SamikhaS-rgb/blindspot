# worker.py — Celery-free async processing using asyncio
# No Redis, no separate worker process needed.

import json, os, asyncio
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from models import SessionLocal, Job, Finding, Report
from prompts import (CHUNK_SYSTEM, SYNTHESIS_SYSTEM,
                     chunk_user_prompt, synthesis_user_prompt)
from datetime import datetime

claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

CHUNK_SIZE = 3  # papers per chunk


# ── Claude call (sync, run in thread pool) ────────────────────────────────
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=20))
def call_claude_sync(system: str, user: str, use_search: bool = False) -> dict:
    kwargs = dict(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    if use_search:
        kwargs["model"] = "claude-sonnet-4-5-20250929"
        kwargs["max_tokens"] = 2000
        kwargs["tools"] = [{"type": "web_search_20250305", "name": "web_search"}]

    resp = claude.messages.create(**kwargs)
    text = "".join(b.text for b in resp.content if b.type == "text")
    return json.loads(text.replace("```json", "").replace("```", "").strip())


# ── Async wrapper so we don't block FastAPI's event loop ──────────────────
async def call_claude(system: str, user: str, use_search: bool = False) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: call_claude_sync(system, user, use_search)
    )


# ── Process a single chunk ────────────────────────────────────────────────
async def process_chunk(job_id: str, chunk_index: int,
                        papers_text: str, filters: list[str]) -> None:
    db = SessionLocal()
    try:
        job = db.query(Job).filter_by(id=job_id).first()
        if job and job.status == "cancelled":
            return

        use_search = papers_text.startswith("[TOPIC SEARCH:")
        result = await call_claude(
            CHUNK_SYSTEM,
            chunk_user_prompt(papers_text, filters),
            use_search=use_search
        )

        job = db.query(Job).filter_by(id=job_id).first()
        if job and job.status == "cancelled":
            return

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

        job.chunks_done += 1
        db.commit()

    except Exception as e:
        db.query(Job).filter_by(id=job_id).update(
            {"status": "failed", "error": str(e)[:500]}
        )
        db.commit()
    finally:
        db.close()


# ── Synthesis ─────────────────────────────────────────────────────────────
async def synthesize(job_id: str, filters: list[str]) -> None:
    db = SessionLocal()
    try:
        job = db.query(Job).filter_by(id=job_id).first()
        if job and job.status == "cancelled":
            return

        job.status = "synthesizing"
        db.commit()

        findings = db.query(Finding).filter_by(job_id=job_id).all()
        all_text = "\n\n".join(
            f"[{f.kind.upper()}] {f.title}: {f.description}"
            for f in findings
        )

        result = await call_claude(
            SYNTHESIS_SYSTEM,
            synthesis_user_prompt(all_text, job.total_papers, filters),
            use_search=False
        )

        db.add(Report(
            job_id=job_id,
            summary=result.get("summary", ""),
            stats=json.dumps(result.get("stats", {})),
        ))

        job.status = "done"
        job.finished_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        db.query(Job).filter_by(id=job_id).update(
            {"status": "failed", "error": str(e)[:500]}
        )
        db.commit()
    finally:
        db.close()


# ── Main entry point called by FastAPI BackgroundTasks ────────────────────
async def run_job(job_id: str, papers: list[str], filters: list[str]) -> None:
    """Process all chunks in parallel, then synthesize."""
    db = SessionLocal()
    try:
        chunks = [
            (i // CHUNK_SIZE, papers[i:i + CHUNK_SIZE])
            for i in range(0, len(papers), CHUNK_SIZE)
        ]

        job = db.query(Job).filter_by(id=job_id).first()
        job.chunks_total = len(chunks)
        job.total_papers = len(papers)
        job.status = "processing"
        db.commit()
    finally:
        db.close()

    # Run all chunks concurrently
    await asyncio.gather(*[
        process_chunk(job_id, idx, "\n\n---\n\n".join(chunk), filters)
        for idx, chunk in chunks
    ])

    # Only synthesize if all chunks succeeded (status still "processing")
    db = SessionLocal()
    try:
        job = db.query(Job).filter_by(id=job_id).first()
        if not job or job.status != "processing":
            return  # cancelled or a chunk failed — stop here
    finally:
        db.close()

    await synthesize(job_id, filters)
