import { useEffect, useState } from 'react'
import { getReport, pdfUrl, docxUrl } from '../api'

const SECTIONS = [
  { key: 'gaps', label: 'Research gaps', color: '#3b82f6', bg: '#eff6ff', icon: '🔍' },
  { key: 'contradictions', label: 'Contradictions', color: '#ef4444', bg: '#fef2f2', icon: '⚡' },
  { key: 'methodology', label: 'Methodological weaknesses', color: '#f59e0b', bg: '#fffbeb', icon: '⚠️' },
  { key: 'suggestions', label: 'Novel directions', color: '#10b981', bg: '#f0fdf4', icon: '🚀' },
]

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

export default function ReportView({ jobId, onReset }) {
  const [report, setReport] = useState(null)
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('blindspot_bookmarks') || '[]') } catch { return [] }
  })
  const [noteMap, setNoteMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('blindspot_notes') || '{}') } catch { return {} }
  })
  const [activeNote, setActiveNote] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [copied, setCopied] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})

  useEffect(() => {
    getReport(jobId).then(r => setReport(r.data))
  }, [jobId])

  const toggleBookmark = (id) => {
    const updated = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id]
    setBookmarks(updated)
    localStorage.setItem('blindspot_bookmarks', JSON.stringify(updated))
  }

  const saveNote = (id, text) => {
    const updated = { ...noteMap, [id]: text }
    setNoteMap(updated)
    localStorage.setItem('blindspot_notes', JSON.stringify(updated))
  }

  const copyToClipboard = () => {
    const text = report.summary + '\n\n' +
      SECTIONS.flatMap(s => (report[s.key] || []).map(i => `[${s.label}] ${i.title || i.direction}: ${i.description || i.rationale}`)).join('\n\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const filterBySeverity = (items) => {
    if (severityFilter === 'all') return items
    if (severityFilter === 'bookmarked') return items.filter((_, i) => bookmarks.includes(`${jobId}-${i}`))
    return items.filter(item => item.severity === severityFilter)
  }

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading report...</div>
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
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#1e293b' }}>{s.value}</div>
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

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={pdfUrl(jobId)} target="_blank" style={{
          padding: '8px 16px', background: '#1e293b', color: 'white',
          borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none'
        }}>↓ PDF</a>
        <a href={docxUrl(jobId)} target="_blank" style={{
          padding: '8px 16px', background: 'white', color: '#1e293b',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, fontWeight: 600, textDecoration: 'none'
        }}>↓ Word</a>
        <button onClick={copyToClipboard} style={{
          padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151'
        }}>{copied ? '✓ Copied!' : '📋 Copy all'}</button>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['all', 'high', 'medium', 'low', 'bookmarked'].map(f => (
            <button key={f} onClick={() => setSeverityFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              border: '1px solid',
              borderColor: severityFilter === f ? '#3b82f6' : '#e2e8f0',
              background: severityFilter === f ? '#eff6ff' : 'white',
              color: severityFilter === f ? '#3b82f6' : '#64748b',
              fontWeight: severityFilter === f ? 700 : 400
            }}>
              {f === 'bookmarked' ? '🔖' : f}
            </button>
          ))}
        </div>

        <button onClick={onReset} style={{
          padding: '8px 16px', background: 'none',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, cursor: 'pointer', color: '#64748b'
        }}>New analysis</button>
      </div>

      {/* Findings */}
      {SECTIONS.map(sec => {
        const allItems = report[sec.key] || []
        const items = filterBySeverity(allItems)
        if (!allItems.length) return null
        return (
          <div key={sec.key} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{sec.icon}</span>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{sec.label}</h2>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 12,
                background: sec.bg, color: sec.color, fontWeight: 600
              }}>{items.length}{items.length !== allItems.length ? `/${allItems.length}` : ''}</span>
            </div>
            {items.length === 0 && (
              <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 4 }}>
                No items match the current filter.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => {
                const itemId = `${jobId}-${sec.key}-${i}`
                const isBookmarked = bookmarks.includes(itemId)
                const isExpanded = expandedItems[itemId]
                const hasNote = noteMap[itemId]
                return (
                  <div key={i} style={{
                    background: 'white', border: '1px solid #e2e8f0',
                    borderLeft: `3px solid ${sec.color}`,
                    borderRadius: '0 10px 10px 0', padding: '14px 16px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
                        {item.title || item.direction}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button title="Bookmark" onClick={() => toggleBookmark(itemId)} style={{
                          border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
                          opacity: isBookmarked ? 1 : 0.4, padding: 2
                        }}>🔖</button>
                        <button title="Add note" onClick={() => setActiveNote(activeNote === itemId ? null : itemId)} style={{
                          border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
                          opacity: hasNote ? 1 : 0.4, padding: 2
                        }}>📝</button>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                      {item.description || item.rationale}
                    </div>

                    {/* Extra fields */}
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
                    {item.implication && isExpanded && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                        Implication: {item.implication}
                      </div>
                    )}
                    {(item.implication || item.novelty) && (
                      <button onClick={() => setExpandedItems(e => ({ ...e, [itemId]: !isExpanded }))} style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#94a3b8', marginTop: 4, padding: 0
                      }}>
                        {isExpanded ? '▲ less' : '▼ more'}
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {item.severity && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11,
                          background: sec.bg, color: sec.color, fontWeight: 600
                        }}>{item.severity} priority</span>
                      )}
                      {item.novelty && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11,
                          background: '#f0fdf4', color: '#10b981', fontWeight: 600
                        }}>{item.novelty} novelty</span>
                      )}
                    </div>

                    {/* Inline note */}
                    {activeNote === itemId && (
                      <div style={{ marginTop: 10 }}>
                        <textarea
                          defaultValue={noteMap[itemId] || ''}
                          placeholder="Add your research note..."
                          onBlur={e => { saveNote(itemId, e.target.value); setActiveNote(null) }}
                          autoFocus
                          style={{
                            width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                            border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12,
                            fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical',
                            minHeight: 60, background: '#f0f9ff', color: '#0369a1'
                          }}
                        />
                      </div>
                    )}
                    {hasNote && activeNote !== itemId && (
                      <div style={{
                        marginTop: 8, padding: '6px 10px', background: '#f0f9ff',
                        borderRadius: 6, fontSize: 12, color: '#0369a1',
                        cursor: 'pointer'
                      }} onClick={() => setActiveNote(itemId)}>
                        📝 {noteMap[itemId]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
