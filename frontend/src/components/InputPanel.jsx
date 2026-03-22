import { useState } from 'react'
import { submitText, submitTopic, submitPDFs } from '../api'

const FILTERS = [
  'research gaps',
  'contradictions',
  'methodological weaknesses',
  'novel research directions'
]

export default function InputPanel({ onJobCreated }) {
  const [tab, setTab] = useState('text')
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
  const [files, setFiles] = useState([])
  const [filters, setFilters] = useState(FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleFilter = (f) =>
    setFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )

  const handleSubmit = async () => {
    if (!filters.length) return setError('Select at least one analysis type')
    setError('')
    setLoading(true)
    try {
      let res
      if (tab === 'text') {
        const texts = text.split(/\n{2,}/).filter(Boolean)
        if (!texts.length) throw new Error('Please paste some text')
        res = await submitText(texts, filters)
      } else if (tab === 'topic') {
        if (!topic.trim()) throw new Error('Please enter a topic')
        res = await submitTopic(topic, filters)
      } else {
        if (!files.length) throw new Error('Please upload at least one PDF')
        res = await submitPDFs(files, filters)
      }
      onJobCreated(res.data.job_id)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (t) => ({
    padding: '8px 20px', border: 'none', cursor: 'pointer',
    borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'none', fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#3b82f6' : '#64748b', fontSize: 14
  })

  return (
    <div style={{
      maxWidth: 680, margin: '40px auto', padding: '0 24px'
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
        <button style={tabStyle('text')} onClick={() => setTab('text')}>Paste text</button>
        <button style={tabStyle('pdf')} onClick={() => setTab('pdf')}>Upload PDFs</button>
        <button style={tabStyle('topic')} onClick={() => setTab('topic')}>Search topic</button>
      </div>

      {/* Input */}
      {tab === 'text' && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste abstracts or full paper text here. Separate multiple papers with a blank line."
          style={{
            width: '100%', minHeight: 160, padding: '12px 14px',
            border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, lineHeight: 1.6, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />
      )}

      {tab === 'topic' && (
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. mRNA vaccines in elderly populations"
          style={{
            width: '100%', padding: '12px 14px',
            border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />
      )}

      {tab === 'pdf' && (
        <div>
          <label style={{
            display: 'block', border: '2px dashed #cbd5e1',
            borderRadius: 10, padding: '32px', textAlign: 'center',
            cursor: 'pointer', color: '#64748b', fontSize: 14
          }}>
            <input
              type="file" accept=".pdf" multiple hidden
              onChange={e => setFiles(Array.from(e.target.files))}
            />
            Drop PDFs here or click to browse
            <div style={{ fontSize: 12, marginTop: 4 }}>Up to 5 PDFs</div>
          </label>
          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', background: '#f8fafc',
                  borderRadius: 8, fontSize: 13, border: '1px solid #e2e8f0'
                }}>
                  <span>📄</span>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <button
                    onClick={() => setFiles(files.filter(x => x.name !== f.name))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => toggleFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12,
            cursor: 'pointer', border: '1px solid',
            borderColor: filters.includes(f) ? '#3b82f6' : '#e2e8f0',
            background: filters.includes(f) ? '#eff6ff' : 'white',
            color: filters.includes(f) ? '#3b82f6' : '#64748b',
            fontWeight: filters.includes(f) ? 600 : 400
          }}>
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8,
          color: '#dc2626', fontSize: 13
        }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: 16, padding: '11px 28px',
          background: loading ? '#94a3b8' : '#3b82f6',
          color: 'white', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Submitting...' : 'Analyze literature →'}
      </button>
    </div>
  )
}