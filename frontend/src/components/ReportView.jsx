import { useEffect, useState } from 'react'
import { getReport, pdfUrl, docxUrl } from '../api'

const SECTIONS = [
  { key: 'gaps', label: 'Research gaps', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'contradictions', label: 'Contradictions', color: '#ef4444', bg: '#fef2f2' },
  { key: 'methodology', label: 'Methodological weaknesses', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'suggestions', label: 'Novel directions', color: '#10b981', bg: '#f0fdf4' },
]

export default function ReportView({ jobId, onReset }) {
  const [report, setReport] = useState(null)

  useEffect(() => {
    getReport(jobId).then(r => setReport(r.data))
  }, [jobId])

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
      Loading report...
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 60px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, margin: '32px 0' }}>
        {[
          { label: 'Papers', value: report.stats.papers_analyzed },
          { label: 'Gaps', value: report.stats.gaps_found, color: '#3b82f6' },
          { label: 'Contradictions', value: report.stats.contradictions_found, color: '#ef4444' },
          { label: 'Directions', value: report.stats.suggestions, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#1e293b' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '20px', marginBottom: 24,
        fontSize: 15, lineHeight: 1.7, color: '#374151'
      }}>
        {report.summary}
      </div>

      {/* Downloads */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <a href={pdfUrl(jobId)} target="_blank" style={{
          padding: '8px 18px', background: '#1e293b', color: 'white',
          borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none'
        }}>Download PDF</a>
        <a href={docxUrl(jobId)} target="_blank" style={{
          padding: '8px 18px', background: 'white', color: '#1e293b',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, fontWeight: 600, textDecoration: 'none'
        }}>Download Word</a>
        <button onClick={onReset} style={{
          marginLeft: 'auto', padding: '8px 18px', background: 'none',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, cursor: 'pointer', color: '#64748b'
        }}>New analysis</button>
      </div>

      {/* Findings */}
      {SECTIONS.map(sec => {
        const items = report[sec.key]
        if (!items?.length) return null
        return (
          <div key={sec.key} style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{sec.label}</h2>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 12,
                background: sec.bg, color: sec.color, fontWeight: 600
              }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  background: 'white', border: '1px solid #e2e8f0',
                  borderLeft: `3px solid ${sec.color}`,
                  borderRadius: '0 10px 10px 0', padding: '14px 16px'
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {item.title || item.direction}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                    {item.description || item.rationale}
                  </div>
                  {item.populations && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      Understudied: {item.populations}
                    </div>
                  )}
                  {item.better_approach && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      Better approach: {item.better_approach}
                    </div>
                  )}
                  {item.severity && (
                    <span style={{
                      display: 'inline-block', marginTop: 8,
                      padding: '2px 8px', borderRadius: 20, fontSize: 11,
                      background: sec.bg, color: sec.color, fontWeight: 600
                    }}>{item.severity} priority</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}