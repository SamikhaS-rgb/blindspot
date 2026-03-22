import { useEffect, useState, useRef } from 'react'
import { getJob, cancelJob } from '../api'

export default function JobStatus({ jobId, onDone, onCancel }) {
  const [job, setJob] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await getJob(jobId)
        setJob(res.data)
        if (res.data.status === 'done') { clearInterval(interval); onDone(jobId) }
        if (res.data.status === 'failed' || res.data.status === 'cancelled') clearInterval(interval)
      } catch { /* network hiccup */ }
    }, 1500)
    return () => clearInterval(interval)
  }, [jobId])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this job? Any progress will be lost.')) return
    setCancelling(true)
    try {
      await cancelJob(jobId)
      onCancel?.()
    } catch {
      setCancelling(false)
    }
  }

  const formatTime = (s) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`

  if (!job) return (
    <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 24px' }}>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
        Connecting to job...
      </div>
    </div>
  )

  const pct = job.progress_pct || 0
  const statusColor = {
    processing: '#f59e0b', synthesizing: '#8b5cf6',
    done: '#10b981', failed: '#ef4444', queued: '#64748b', cancelled: '#94a3b8'
  }
  const statusLabel = {
    processing: '⚙️ Analyzing chunks',
    synthesizing: '🧠 Synthesizing findings',
    queued: '⏳ Queued',
    done: '✅ Complete',
    failed: '❌ Failed',
    cancelled: '🚫 Cancelled'
  }

  const isBusy = job.status === 'processing' || job.status === 'synthesizing' || job.status === 'queued'

  return (
    <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 24px' }}>
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 14, padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              {job.job_name || `Job ${jobId.slice(0, 8)}…`}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              {job.papers} papers · {job.chunks_total} chunks · {formatTime(elapsed)} elapsed
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: (statusColor[job.status] || '#64748b') + '20',
            color: statusColor[job.status] || '#64748b',
            whiteSpace: 'nowrap'
          }}>
            {statusLabel[job.status] || job.status}
          </span>
        </div>

        <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: job.status === 'synthesizing'
              ? 'linear-gradient(90deg, #8b5cf6, #d946ef)'
              : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            transition: 'width 0.6s ease', borderRadius: 8
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          <span>{pct}% complete</span>
          <span>{job.chunks_done}/{job.chunks_total} chunks</span>
        </div>

        {isBusy && elapsed > 15 && elapsed < 40 && (
          <div style={{
            padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 8, fontSize: 12, color: '#0369a1', marginBottom: 14
          }}>
            💡 <strong>Tip:</strong> For faster results, paste just abstracts instead of full PDFs, or use the "Search topic" tab for instant analysis.
          </div>
        )}

        {job.status === 'failed' && (
          <div style={{
            padding: '10px 14px', background: '#fef2f2', borderRadius: 8,
            color: '#dc2626', fontSize: 13, marginBottom: 14
          }}>{job.error || 'An error occurred.'}</div>
        )}

        {isBusy && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding: '8px 18px', border: '1px solid #fecaca', borderRadius: 8,
              background: 'white', color: '#ef4444', fontSize: 13, fontWeight: 600,
              cursor: cancelling ? 'wait' : 'pointer'
            }}
          >
            {cancelling ? 'Cancelling…' : '✕ Cancel job'}
          </button>
        )}

        {job.status === 'cancelled' && (
          <button onClick={onCancel} style={{
            padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8,
            background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>← Start new analysis</button>
        )}
      </div>
    </div>
  )
}
