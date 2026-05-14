import React, { useState } from 'react'
import { api } from '../api'

export default function BrandHealthReport() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.post('/ai/brand-sentiment-report', {})
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sentimentColor = (score) => {
    if (score >= 0.7) return '#22c55e'
    if (score >= 0.4) return '#f59e0b'
    return '#ef4444'
  }

  const trendIcon = (trend) => {
    if (trend === 'improving') return '↑'
    if (trend === 'declining') return '↓'
    return '→'
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Brand Health Report</h2>
          <p className="page-header-sub">AI-powered comprehensive brand sentiment dashboard</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', color: '#fff', fontWeight: 600 }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: 64, color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div>AI is analyzing all sentiment data...</div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Score card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>OVERALL SENTIMENT</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: sentimentColor(result.overall_sentiment || 0) }}>
                {Math.round((result.overall_sentiment || 0) * 100)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>TREND</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: result.trend === 'improving' ? '#22c55e' : result.trend === 'declining' ? '#ef4444' : '#f59e0b' }}>
                {trendIcon(result.trend)}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{result.trend || 'stable'}</div>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #222' }}>
              <h3 style={{ marginBottom: 12 }}>Executive Summary</h3>
              <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>{result.summary}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {result.top_threats?.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
                <h3 style={{ marginBottom: 12, color: '#f87171' }}>Top Threats</h3>
                {result.top_threats.map((t, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(239,68,68,0.1)', fontSize: 13, color: '#fca5a5', display: 'flex', gap: 8 }}>
                    <span>⚠</span><span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(34,197,94,0.2)' }}>
                <h3 style={{ marginBottom: 12, color: '#86efac' }}>Recommendations</h3>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(34,197,94,0.1)', fontSize: 13, color: '#bbf7d0', display: 'flex', gap: 8 }}>
                    <span>✓</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.platform_breakdown?.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginTop: 16, border: '1px solid #222' }}>
              <h3 style={{ marginBottom: 16 }}>Platform Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {result.platform_breakdown.map((p, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{p.platform}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 10, fontSize: 11,
                      background: p.sentiment === 'positive' ? 'rgba(34,197,94,0.1)' : p.sentiment === 'negative' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                      color: p.sentiment === 'positive' ? '#22c55e' : p.sentiment === 'negative' ? '#ef4444' : '#888',
                    }}>{p.sentiment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
