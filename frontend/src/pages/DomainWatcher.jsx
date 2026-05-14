import React, { useState } from 'react'
import { api } from '../api'

export default function DomainWatcher() {
  const [trademarkName, setTrademarkName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!trademarkName.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.post('/ai/domain-check', { trademark_name: trademarkName })
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Domain Squatting Watcher</h2>
        <p className="page-header-sub">AI generates high-risk typosquat and cybersquatting domain variants for your trademark</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#888' }}>Trademark / Brand Name</label>
            <input
              type="text"
              value={trademarkName}
              onChange={e => setTrademarkName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="e.g., Nike, Apple, YourBrand"
              style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>
          <button
            onClick={analyze}
            disabled={!trademarkName.trim() || loading}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 600, fontSize: 14, minWidth: 140 }}
          >
            {loading ? 'Scanning...' : 'Scan Domains'}
          </button>
        </div>
        {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{error}</div>}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔎</div>
          <div>AI is generating at-risk domain variants...</div>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 style={{ marginBottom: 16, color: '#ef4444' }}>
              ⚠️ High-Risk Domains ({result.high_risk_domains?.length || 0})
            </h3>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {(result.high_risk_domains || []).map((domain, i) => (
                <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(239,68,68,0.1)', fontFamily: 'monospace', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fca5a5' }}>{domain}</span>
                  <span style={{ fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 8 }}>AT RISK</span>
                </div>
              ))}
              {(!result.high_risk_domains || result.high_risk_domains.length === 0) && (
                <div style={{ color: '#888', fontSize: 13 }}>No high-risk domains identified.</div>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, border: '1px solid #222' }}>
            <h3 style={{ marginBottom: 16 }}>Registration Recommendations</h3>
            <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
              {(result.registration_recommendations || []).map((r, i) => (
                <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #222', fontSize: 13, color: '#ccc', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {result.typosquat_patterns?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>TYPOSQUAT PATTERNS DETECTED</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.typosquat_patterns.map((p, i) => (
                    <span key={i} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 10px', borderRadius: 10, fontSize: 11 }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
