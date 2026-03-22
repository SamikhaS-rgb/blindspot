import { useEffect, useState } from 'react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PastJobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = () => {
    axios.get(`${BASE}/jobs`)
      .then(r => setJobs(r.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchJobs() }, [])

  const statusColor = {
    processing: '#f59e0b', synthesizing: '#8b5cf6',
    done: '#10b981', failed: '#ef4444', queued: '#64748b', cancelled: '#94a3b8'
  }
  const statusIcon = {
    processing: '⚙️', synthesizing: '🧠', done: '✅',
    failed: '❌', queued: '⏳', cancelled: '🚫'
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading past jobs...</div>
  )

  if (!jobs.length) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
      No past jobs yet. Run your first analysis.
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Job history</h2>
        <button onClick={fetchJobs} style={{
          padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
          background: 'white', cursor: 'pointer', fontSize: 12, color: '#64748b'
        }}>↻ Refresh</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map(job => (
          <div key={job.job_id} style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.job_name || `Job ${job.job_id.slice(0, 8)}…`}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {job.papers} papers · {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {job.finished_at && (
                  <span style={{ marginLeft: 6 }}>
                    · {Math.round((new Date(job.finished_at) - new Date(job.created_at)) / 1000)}s
                  </span>
                )}
              </div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: (statusColor[job.status] || '#64748b') + '20',
              color: statusColor[job.status] || '#64748b', whiteSpace: 'nowrap'
            }}>
              {statusIcon[job.status]} {job.status}
            </span>
            {job.status === 'done' && (
              <button onClick={() => onSelectJob(job.job_id)} style={{
                padding: '7px 16px', background: '#3b82f6', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 13,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
                View →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
