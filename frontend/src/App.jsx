import { useState } from 'react'
import Hero from './components/Hero'
import InputPanel from './components/InputPanel'
import JobStatus from './components/JobStatus'
import ReportView from './components/ReportView'
import PastJobs from './components/PastJobs'

export default function App() {
  const [jobId, setJobId] = useState(null)
  const [done, setDone] = useState(false)
  const [view, setView] = useState('home') // 'home' | 'past'

  const reset = () => { setJobId(null); setDone(false); setView('home') }

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', background: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>
          Blindspot
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { reset(); setView('home') }} style={{
            padding: '7px 16px', border: '1px solid #e2e8f0',
            borderRadius: 8, background: view === 'home' ? '#f1f5f9' : 'white',
            cursor: 'pointer', fontSize: 13, color: '#374151'
          }}>
            New analysis
          </button>
          <button onClick={() => setView('past')} style={{
            padding: '7px 16px', border: '1px solid #e2e8f0',
            borderRadius: 8, background: view === 'past' ? '#f1f5f9' : 'white',
            cursor: 'pointer', fontSize: 13, color: '#374151'
          }}>
            Past jobs
          </button>
        </div>
      </nav>

      {/* Views */}
      {view === 'past' && (
        <PastJobs onSelectJob={(id) => {
          setJobId(id); setDone(true); setView('home')
        }} />
      )}

      {view === 'home' && (
        <>
          <Hero />
          {!jobId && <InputPanel onJobCreated={(id) => setJobId(id)} />}
          {jobId && !done && (
            <JobStatus jobId={jobId} onDone={() => setDone(true)} />
          )}
          {jobId && done && (
            <ReportView jobId={jobId} onReset={reset} />
          )}
        </>
      )}
    </div>
  )
}