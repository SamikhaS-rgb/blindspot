import json, os, uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import fitz

from models import get_db, Job, Finding, Report
from worker import celery_app, analyze_chunk, CHUNK_SIZE
from exporters import build_pdf, build_docx

app = FastAPI(title="Blindspot — Research Gap Finder")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

DEFAULT_FILTERS = ["research gaps", "contradictions",
                   "methodological weaknesses", "novel research directions"]


def extract_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "\n\n".join(p.get_text() for p in doc)


def chunk_papers(papers: list[str], size: int = CHUNK_SIZE):
    for i in range(0, len(papers), size):
        yield i // size, papers[i:i+size]


def enqueue_job(job_id: str, papers: list[str],
                filters: list[str], db: Session):
    chunks = list(chunk_papers(papers))
    job = db.query(Job).filter_by(id=job_id).first()
    job.chunks_total = len(chunks)
    job.total_papers = len(papers)
    job.status = "processing"
    db.commit()

    for idx, chunk in chunks:
        analyze_chunk.delay(job_id, idx, "\n\n---\n\n".join(chunk), filters)


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


class TextJobRequest(BaseModel):
    texts: list[str]
    filters: list[str] = DEFAULT_FILTERS
    job_name: str = ""


class TopicJobRequest(BaseModel):
    topic: str
    filters: list[str] = DEFAULT_FILTERS
    job_name: str = ""


@app.post("/jobs/text", status_code=202)
def create_text_job(req: TextJobRequest, db: Session = Depends(get_db)):
    if not req.texts:
        raise HTTPException(400, "texts list is empty")
    job = Job(id=str(uuid.uuid4()), job_name=req.job_name)
    db.add(job)
    db.commit()
    enqueue_job(job.id, req.texts, req.filters, db)
    return {"job_id": job.id, "papers": len(req.texts),
            "chunks": job.chunks_total, "status": "processing"}


@app.post("/jobs/pdf", status_code=202)
async def create_pdf_job(
    files: list[UploadFile] = File(...),
    filters: str = ",".join(DEFAULT_FILTERS),
    job_name: str = "",
    db: Session = Depends(get_db),
):
    filter_list = [f.strip() for f in filters.split(",")]
    papers = []
    for f in files:
        raw = await f.read()
        papers.append(f"[{f.filename}]\n{extract_text(raw)}")

    job = Job(id=str(uuid.uuid4()), job_name=job_name)
    db.add(job)
    db.commit()
    enqueue_job(job.id, papers, filter_list, db)
    return {"job_id": job.id, "papers": len(papers),
            "chunks": job.chunks_total, "status": "processing"}


@app.post("/jobs/topic", status_code=202)
def create_topic_job(req: TopicJobRequest, db: Session = Depends(get_db)):
    job = Job(id=str(uuid.uuid4()), topic=req.topic,
              chunks_total=1, total_papers=0, status="processing",
              job_name=req.job_name or req.topic[:60])
    db.add(job)
    db.commit()
    analyze_chunk.delay(job.id, 0,
                        f"[TOPIC SEARCH: {req.topic}]", req.filters)
    return {"job_id": job.id, "status": "processing"}


@app.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    progress = (job.chunks_done / job.chunks_total * 100) if job.chunks_total else 0
    return {
        "job_id": job.id, "status": job.status,
        "job_name": job.job_name or "",
        "progress_pct": round(progress, 1),
        "chunks_done": job.chunks_done, "chunks_total": job.chunks_total,
        "papers": job.total_papers, "error": job.error,
        "created_at": job.created_at, "finished_at": job.finished_at,
    }


@app.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancel a running or queued job."""
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status in ("done", "failed", "cancelled"):
        raise HTTPException(400, f"Job is already {job.status}")
    
    # Revoke all pending celery tasks for this job
    celery_app.control.revoke(job_id, terminate=True, signal='SIGTERM')
    
    job.status = "cancelled"
    db.commit()
    return {"job_id": job_id, "status": "cancelled"}


@app.get("/jobs/{job_id}/report")
def get_report(job_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(job_id=job_id).first()
    if not report:
        raise HTTPException(404, "Report not ready yet")
    findings = db.query(Finding).filter_by(job_id=job_id).all()
    return {
        "summary": report.summary,
        "stats": json.loads(report.stats),
        "gaps":          [json.loads(f.detail) for f in findings if f.kind == "gap"],
        "contradictions": [json.loads(f.detail) for f in findings if f.kind == "contradiction"],
        "methodology":   [json.loads(f.detail) for f in findings if f.kind == "methodology"],
        "suggestions":   [json.loads(f.detail) for f in findings if f.kind == "suggestion"],
    }


@app.get("/jobs/{job_id}/report/pdf")
def download_pdf(job_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(job_id=job_id).first()
    if not report:
        raise HTTPException(404, "Report not ready yet")
    path = f"/tmp/{job_id}.pdf"
    build_pdf(job_id, path)
    return FileResponse(path, filename=f"gap_report_{job_id[:8]}.pdf",
                        media_type="application/pdf")


@app.get("/jobs/{job_id}/report/docx")
def download_docx(job_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(job_id=job_id).first()
    if not report:
        raise HTTPException(404, "Report not ready yet")
    path = f"/tmp/{job_id}.docx"
    build_docx(job_id, path)
    return FileResponse(path, filename=f"gap_report_{job_id[:8]}.docx",
                        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@app.get("/findings")
def query_findings(kind: str = None, severity: str = None,
                   db: Session = Depends(get_db)):
    q = db.query(Finding)
    if kind:     q = q.filter_by(kind=kind)
    if severity: q = q.filter_by(severity=severity)
    return [{"id": f.id, "job_id": f.job_id, "kind": f.kind,
             "title": f.title, "description": f.description,
             "severity": f.severity} for f in q.all()]


@app.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(50).all()
    return [
        {
            "job_id": j.id, "status": j.status,
            "job_name": j.job_name or "",
            "papers": j.total_papers,
            "created_at": j.created_at,
            "finished_at": j.finished_at
        }
        for j in jobs
    ]
