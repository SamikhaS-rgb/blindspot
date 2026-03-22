export default function Hero() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '64px 24px 40px',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#f0f9ff', border: '1px solid #bae6fd',
        borderRadius: 20, padding: '4px 14px',
        fontSize: 13, color: '#0369a1', marginBottom: 20
      }}>
        Research Gap Discovery Agent
      </div>
      <h1 style={{
        fontSize: 42, fontWeight: 700, margin: '0 0 16px',
        background: 'linear-gradient(135deg, #1e293b, #3b82f6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        Find what research<br />is missing
      </h1>
      <p style={{
        fontSize: 18, color: '#64748b', maxWidth: 520,
        margin: '0 auto', lineHeight: 1.6
      }}>
        Blindspot reads hundreds of papers and surfaces contradictions,
        understudied variables, and novel research directions — not summaries.
      </p>
    </div>
  )
}