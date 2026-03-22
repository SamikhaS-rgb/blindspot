import { useEffect, useState } from 'react'
import { getJob } from '../api'

export default function JobStatus({ jobId, onDone }) {
  const [job, setJob] = useState(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await getJob(jobId)
      setJob(res.data)
      if (res.data.status === 'done') {
        clearInterval(interval)
        onDone(jobId)
      }
      if (res.data.status === 'failed') clearInterval(interval)
    }, 2000)
    return () => clearInterval(interval)
  }, [jobId])

  if (!job) return null

  const pct = job.progress_pct || 0
  const statusColor = {
    processing: '#f59e0b', synthesizing: '#8b5cf6',
    done: '#10b981', failed: '#ef4444', queued: '#64748b'
  }

  return (
    <div style={{
      maxWidth: 680, margin: '32px auto', padding: '0 24px'
    }}>
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 14, padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Analyzing papers</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Job {jobId.slice(0, 8)}... · {job.papers} papers · {job.chunks_total} chunks
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: statusColor[job.status] + '20',
            color: statusColor[job.status]
          }}>
            {job.status}
          </span>
        </div>

        <div style={{
          background: '#f1f5f9', borderRadius: 8, height: 8, overflow: 'hidden'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            transition: 'width 0.5s ease', borderRadius: 8
          }} />
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, textAlign: 'right' }}>
          {pct}% · {job.chunks_done}/{job.chunks_total} chunks complete
        </div>

        {job.status === 'failed' && (
          <div style={{
            marginTop: 12, padding: '10px 14px', background: '#fef2f2',
            borderRadius: 8, color: '#dc2626', fontSize: 13
          }}>{job.error}</div>
        )}
      </div>
    </div>
  )
}