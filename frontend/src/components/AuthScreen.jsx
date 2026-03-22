import { useState } from 'react'

const UNIVERSITIES = [
  'MIT', 'Stanford University', 'Harvard University', 'UC Berkeley', 'Caltech',
  'Oxford University', 'Cambridge University', 'ETH Zurich', 'Princeton University',
  'Yale University', 'Columbia University', 'UCLA', 'University of Chicago',
  'Duke University', 'Cornell University', 'Johns Hopkins University',
  'University of Michigan', 'NYU', 'Carnegie Mellon University', 'Other'
]

const RESEARCH_LEVELS = [
  { value: 'undergrad', label: 'Undergraduate Student' },
  { value: 'masters', label: "Master's Student" },
  { value: 'phd', label: 'PhD Student' },
  { value: 'postdoc', label: 'Postdoctoral Researcher' },
  { value: 'faculty', label: 'Faculty / Professor' },
  { value: 'industry', label: 'Industry Researcher' },
  { value: 'independent', label: 'Independent Researcher' },
]

const RESEARCH_FIELDS = [
  'Computer Science / AI', 'Biology / Life Sciences', 'Physics', 'Chemistry',
  'Medicine / Health Sciences', 'Psychology / Neuroscience', 'Economics',
  'Engineering', 'Social Sciences', 'Mathematics', 'Environmental Science', 'Other'
]

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#e2e8f0' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' }
  if (score === 2) return { score: 2, label: 'Fair', color: '#f97316' }
  if (score === 3) return { score: 3, label: 'Good', color: '#eab308' }
  if (score === 4) return { score: 4, label: 'Strong', color: '#22c55e' }
  return { score: 5, label: 'Very Strong', color: '#10b981' }
}

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [university, setUniversity] = useState('')
  const [researchLevel, setResearchLevel] = useState('')
  const [researchField, setResearchField] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) return setError('Email and password are required.')
    if (mode === 'signup') {
      if (!name.trim()) return setError('Please enter your name.')
      if (!researchLevel) return setError('Please select your research level.')
      if (password.length < 6) return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const key = `blindspot_user_${email}`
    if (mode === 'signup') {
      if (localStorage.getItem(key)) {
        setError('An account with this email already exists.')
        setLoading(false)
        return
      }
      const user = { name, email, university, researchLevel, researchField, createdAt: new Date().toISOString() }
      localStorage.setItem(key, JSON.stringify({ ...user, password }))
      localStorage.setItem('blindspot_session', JSON.stringify(user))
      onAuth(user)
    } else {
      const stored = localStorage.getItem(key)
      if (!stored) { setError('No account found. Sign up first.'); setLoading(false); return }
      const parsed = JSON.parse(stored)
      if (parsed.password !== password) { setError('Incorrect password.'); setLoading(false); return }
      const user = { name: parsed.name, email: parsed.email, university: parsed.university, researchLevel: parsed.researchLevel, createdAt: parsed.createdAt }
      localStorage.setItem('blindspot_session', JSON.stringify(user))
      onAuth(user)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14,
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
    background: 'white', color: '#1e293b'
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    paddingRight: 36
  }

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: 24, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)'
      }} />

      <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>🔍</div>
          <span style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Blindspot</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
          Research Gap Discovery Agent
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 18,
        padding: '32px 36px', width: '100%', maxWidth: 440,
        boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#1e293b' : '#64748b',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                style={inputStyle} placeholder="Ada Lovelace"
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle} type="email" placeholder="you@university.edu"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 44 }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  color: '#64748b', lineHeight: 1, display: 'flex', alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= passwordStrength.score ? passwordStrength.color : '#e2e8f0',
                      transition: 'background 0.2s'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 600 }}>
                  {passwordStrength.label}
                </span>
                {mode === 'signup' && passwordStrength.score < 3 && (
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
                    — try adding uppercase, numbers, or symbols
                  </span>
                )}
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label style={labelStyle}>Research level <span style={{ color: '#ef4444' }}>*</span></label>
                <select style={selectStyle} value={researchLevel} onChange={e => setResearchLevel(e.target.value)}>
                  <option value="">Select your level…</option>
                  {RESEARCH_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Research field{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <select style={selectStyle} value={researchField} onChange={e => setResearchField(e.target.value)}>
                  <option value="">Select your field…</option>
                  {RESEARCH_FIELDS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  University / Institution{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <select style={selectStyle} value={university} onChange={e => setUniversity(e.target.value)}>
                  <option value="">Select institution…</option>
                  {UNIVERSITIES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, color: '#dc2626', fontSize: 13
            }}>{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px', border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', fontWeight: 700, fontSize: 15, marginTop: 4,
              transition: 'opacity 0.15s', boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.35)'
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in →' : 'Create account →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 20, marginBottom: 0 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} style={{
            background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, padding: 0
          }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, position: 'relative' }}>
        Stored locally · No server required for auth
      </p>
    </div>
  )
}
