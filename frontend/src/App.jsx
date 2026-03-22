import { useState, useEffect, useCallback } from 'react'
import AuthScreen from './components/AuthScreen'
import Hero from './components/Hero'
import InputPanel from './components/InputPanel'
import JobStatus from './components/JobStatus'
import ReportView from './components/ReportView'
import PastJobs from './components/PastJobs'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('blindspot_session') || 'null') } catch { return null }
  })
  const [jobId, setJobId] = useState(null)
  const [done, setDone] = useState(false)
  const [view, setView] = useState('home') // 'home' | 'past'

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); reset() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') { e.preventDefault(); setView('past') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const reset = useCallback(() => { setJobId(null); setDone(false); setView('home') }, [])

  const handleLogout = () => {
    localStorage.removeItem('blindspot_session')
    setUser(null)
  }

  if (!user) return <AuthScreen onAuth={setUser} />

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 32px', background: 'white',
        borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
          }}>🔍</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', letterSpacing: '-0.3px' }}>
            Blindspot
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { reset(); setView('home') }} style={{
            padding: '7px 14px', border: '1px solid #e2e8f0',
            borderRadius: 8, background: view === 'home' ? '#f1f5f9' : 'white',
            cursor: 'pointer', fontSize: 13, color: '#374151'
          }} title="⌘N">
            New analysis
          </button>
          <button onClick={() => setView('past')} style={{
            padding: '7px 14px', border: '1px solid #e2e8f0',
            borderRadius: 8, background: view === 'past' ? '#f1f5f9' : 'white',
            cursor: 'pointer', fontSize: 13, color: '#374151'
          }} title="⌘H">
            Past jobs
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8,
            paddingLeft: 12, borderLeft: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{user.name}</span>
            <button onClick={handleLogout} style={{
              padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
              background: 'none', cursor: 'pointer', fontSize: 11, color: '#94a3b8'
            }}>Log out</button>
          </div>
        </div>
      </nav>

      {/* Views */}
      {view === 'past' && (
        <PastJobs onSelectJob={(id) => { setJobId(id); setDone(true); setView('home') }} />
      )}

      {view === 'home' && (
        <>
          <Hero />
          {!jobId && <InputPanel onJobCreated={(id) => setJobId(id)} />}
          {jobId && !done && (
            <JobStatus
              jobId={jobId}
              onDone={() => setDone(true)}
              onCancel={reset}
            />
          )}
          {jobId && done && (
            <ReportView jobId={jobId} onReset={reset} />
          )}
        </>
      )}

      {/* Keyboard shortcut hint */}
      {!jobId && view === 'home' && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20,
          background: '#1e293b', color: '#94a3b8',
          padding: '8px 14px', borderRadius: 8, fontSize: 11,
          display: 'flex', gap: 12
        }}>
          <span><kbd style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: 'white', fontSize: 10 }}>⌘N</kbd> New</span>
          <span><kbd style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: 'white', fontSize: 10 }}>⌘H</kbd> History</span>
        </div>
      )}
    </div>
  )
}
