from sqlalchemy import create_engine, Column, String, Text, Integer, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./research_gaps.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Job(Base):
    __tablename__ = "jobs"
    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status       = Column(String, default="queued")   # queued|processing|done|failed
    topic        = Column(String, nullable=True)
    total_papers = Column(Integer, default=0)
    chunks_done  = Column(Integer, default=0)
    chunks_total = Column(Integer, default=0)
    error        = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    finished_at  = Column(DateTime, nullable=True)


class Finding(Base):
    __tablename__ = "findings"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id      = Column(String, index=True)
    kind        = Column(String)   # gap|contradiction|methodology|suggestion
    title       = Column(String)
    description = Column(Text)
    detail      = Column(Text)     # JSON blob of extra fields
    severity    = Column(String, nullable=True)
    chunk_index = Column(Integer)


class Report(Base):
    __tablename__ = "reports"
    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id     = Column(String, unique=True, index=True)
    summary    = Column(Text)
    stats      = Column(Text)   # JSON
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(engine)