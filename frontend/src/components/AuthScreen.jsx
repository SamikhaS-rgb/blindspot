import { useState } from 'react'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) return setError('Email and password are required.')
    if (mode === 'signup' && !name.trim()) return setError('Please enter your name.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // simulate network

    const key = `blindspot_user_${email}`
    if (mode === 'signup') {
      if (localStorage.getItem(key)) {
        setError('An account with this email already exists.')
        setLoading(false)
        return
      }
      const user = { name, email, createdAt: new Date().toISOString() }
      localStorage.setItem(key, JSON.stringify({ ...user, password }))
      localStorage.setItem('blindspot_session', JSON.stringify(user))
      onAuth(user)
    } else {
      const stored = localStorage.getItem(key)
      if (!stored) { setError('No account found. Sign up first.'); setLoading(false); return }
      const parsed = JSON.parse(stored)
      if (parsed.password !== password) { setError('Incorrect password.'); setLoading(false); return }
      const user = { name: parsed.name, email: parsed.email, createdAt: parsed.createdAt }
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

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: 24, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)'
      }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginBottom: 12
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🔍</div>
          <span style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Blindspot</span>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Research Gap Discovery Agent
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 18,
        padding: '36px 36px', width: '100%', maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 10,
          padding: 4, marginBottom: 28
        }}>
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
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                Full name
              </label>
              <input
                style={inputStyle} placeholder="Ada Lovelace"
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              style={inputStyle} type="email" placeholder="you@university.edu"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              style={inputStyle} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

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

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20, marginBottom: 0 }}>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} style={{
            background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, padding: 0
          }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

      <p style={{ color: '#334155', fontSize: 12, marginTop: 24, position: 'relative' }}>
        Stored locally · No server required for auth
      </p>
    </div>
  )
}
