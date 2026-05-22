import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function InfringementTrendChart() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [days, setDays] = useState(14)

  useEffect(() => {
    let cancelled = false
    api.get(`/custom-views/infringement-trend?days=${days}`)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setErr(e.message) })
    return () => { cancelled = true }
  }, [days])

  if (err) return <div style={{ color: '#c00' }}>Failed to load: {err}</div>
  if (!data) return <div>Loading infringement trend...</div>

  const w = 720, h = 240, pad = 40
  const series = data.series
  const maxY = Math.max(...series.map(s => Math.max(s.detected, s.resolved)), 1)
  const stepX = (w - pad * 2) / Math.max(series.length - 1, 1)
  const yFor = v => h - pad - (v / maxY) * (h - pad * 2)
  const pathFor = key => series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${yFor(s[key])}`).join(' ')

  return (
    <div className="viz-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Infringement Detection Trend</h3>
        <select value={days} onChange={e => setDays(parseInt(e.target.value, 10))}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 8 }}>
        <span><strong>Detected:</strong> {data.totals.detected}</span>
        <span><strong>Resolved:</strong> {data.totals.resolved}</span>
        <span><strong>Pending:</strong> {data.totals.pending}</span>
      </div>
      <svg width={w} height={h} style={{ maxWidth: '100%' }} data-testid="trend-svg">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ccc" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#ccc" />
        <path d={pathFor('detected')} fill="none" stroke="#e53e3e" strokeWidth="2" />
        <path d={pathFor('resolved')} fill="none" stroke="#38a169" strokeWidth="2" />
        {series.map((s, i) => (
          <circle key={i} cx={pad + i * stepX} cy={yFor(s.detected)} r="3" fill="#e53e3e" />
        ))}
      </svg>
      <div style={{ fontSize: 12, color: '#666' }}>
        <span style={{ color: '#e53e3e' }}>● Detected</span> &nbsp;
        <span style={{ color: '#38a169' }}>● Resolved</span>
      </div>
    </div>
  )
}
