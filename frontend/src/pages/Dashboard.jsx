import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const features = [
  { path: '/trademarks', icon: '\u2122\uFE0F', title: 'Trademark Monitoring', desc: 'Track and manage your registered trademarks across jurisdictions', endpoint: '/trademarks' },
  { path: '/infringements', icon: '\u26A0\uFE0F', title: 'Infringement Detection', desc: 'AI-powered detection of potential trademark infringements', endpoint: '/infringements' },
  { path: '/domains', icon: '\uD83C\uDF10', title: 'Domain Monitoring', desc: 'Detect typosquatting and suspicious domain registrations', endpoint: '/domains' },
  { path: '/social', icon: '\uD83D\uDCAC', title: 'Social Media Monitoring', desc: 'Monitor brand mentions across social platforms', endpoint: '/social-mentions' },
  { path: '/counterfeits', icon: '\uD83D\uDEE1\uFE0F', title: 'Counterfeit Detection', desc: 'Identify counterfeit products being sold online', endpoint: '/counterfeits' },
  { path: '/cease-desist', icon: '\uD83D\uDCDC', title: 'C&D Generator', desc: 'AI-generated cease and desist letters', endpoint: '/cease-desist' },
  { path: '/trademark-search', icon: '\uD83D\uDD0D', title: 'Trademark Search', desc: 'Search trademark databases for conflicts', endpoint: '/trademark-searches' },
  { path: '/sentiment', icon: '\uD83D\uDCCA', title: 'Sentiment Analysis', desc: 'Analyze brand sentiment across sources', endpoint: '/sentiment' },
  { path: '/competitors', icon: '\uD83C\uDFC6', title: 'Competitor Analysis', desc: 'Monitor competitor brand activities', endpoint: '/competitors' },
  { path: '/logos', icon: '\uD83C\uDFA8', title: 'Logo Similarity', desc: 'Detect visually similar logos', endpoint: '/logos' },
  { path: '/marketplace', icon: '\uD83D\uDED2', title: 'Marketplace Monitoring', desc: 'Monitor e-commerce listings for violations', endpoint: '/marketplace' },
  { path: '/legal', icon: '\u2696\uFE0F', title: 'Legal Cases', desc: 'Manage trademark legal proceedings', endpoint: '/legal-cases' },
  { path: '/reports', icon: '\uD83D\uDCC4', title: 'Report Generation', desc: 'Generate comprehensive brand protection reports', endpoint: '/reports' },
  { path: '/alerts', icon: '\uD83D\uDD14', title: 'Alert Management', desc: 'Manage and respond to brand alerts', endpoint: '/alerts' },
  { path: '/audit', icon: '\uD83D\uDCCB', title: 'Audit Trail', desc: 'Complete activity and audit logging', endpoint: '/audit-logs' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const [alerts, setAlerts] = useState([])
  const [infringements, setInfringements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const endpoints = ['/trademarks', '/infringements', '/alerts', '/legal-cases', '/domains', '/counterfeits']
        const results = await Promise.allSettled(endpoints.map(ep => api.get(ep)))
        const c = {}
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const data = Array.isArray(r.value) ? r.value : (r.value?.data || [])
            c[endpoints[i]] = data.length
            if (endpoints[i] === '/alerts') setAlerts(data.slice(0, 5))
            if (endpoints[i] === '/infringements') setInfringements(data.slice(0, 5))
          }
        })
        setCounts(c)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const stats = [
    { label: 'Trademarks', value: counts['/trademarks'] || 0, icon: '\u2122\uFE0F', path: '/trademarks' },
    { label: 'Infringements', value: counts['/infringements'] || 0, icon: '\u26A0\uFE0F', path: '/infringements' },
    { label: 'Active Alerts', value: counts['/alerts'] || 0, icon: '\uD83D\uDD14', path: '/alerts' },
    { label: 'Legal Cases', value: counts['/legal-cases'] || 0, icon: '\u2696\uFE0F', path: '/legal' },
    { label: 'Domains Tracked', value: counts['/domains'] || 0, icon: '\uD83C\uDF10', path: '/domains' },
    { label: 'Counterfeits', value: counts['/counterfeits'] || 0, icon: '\uD83D\uDEE1\uFE0F', path: '/counterfeits' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>AI-powered brand protection overview</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /> Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map(s => (
              <div className="stat-card" key={s.label} onClick={() => navigate(s.path)}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="quick-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/infringements')}>Analyze Infringement</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/domains')}>Scan Domain</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/cease-desist')}>Generate C&D Letter</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/trademark-search')}>Search Trademarks</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/sentiment')}>Analyze Sentiment</button>
          </div>

          <div className="dashboard-row">
            <div className="card">
              <div className="section-title">{'\uD83D\uDD14'} Recent Alerts</div>
              {alerts.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13 }}>No recent alerts</p>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>Title</th><th>Type</th><th>Severity</th></tr></thead>
                    <tbody>
                      {alerts.map(a => (
                        <tr key={a._id || a.id} onClick={() => navigate('/alerts')}>
                          <td style={{ color: 'var(--text-primary)' }}>{a.title || 'Alert'}</td>
                          <td>{a.type || '-'}</td>
                          <td><span className={`badge badge-${a.severity === 'high' || a.severity === 'critical' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'}`}>{a.severity || 'info'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card">
              <div className="section-title">{'\u26A0\uFE0F'} Recent Infringements</div>
              {infringements.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13 }}>No recent infringements</p>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>Source</th><th>Type</th><th>Severity</th></tr></thead>
                    <tbody>
                      {infringements.map(inf => (
                        <tr key={inf._id || inf.id} onClick={() => navigate('/infringements')}>
                          <td style={{ color: 'var(--text-primary)' }}>{inf.sourceUrl || inf.source_url || '-'}</td>
                          <td>{inf.type || '-'}</td>
                          <td><span className={`badge badge-${inf.severity === 'high' || inf.severity === 'critical' ? 'danger' : inf.severity === 'medium' ? 'warning' : 'info'}`}>{inf.severity || '-'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-title">All Features</div>
            <div className="features-grid">
              {features.map(f => (
                <div className="feature-card" key={f.path} onClick={() => navigate(f.path)}>
                  <div className="feature-card-header">
                    <div className="feature-card-icon">{f.icon}</div>
                    <div className="feature-card-title">{f.title}</div>
                  </div>
                  <div className="feature-card-desc">{f.desc}</div>
                  <div className="feature-card-count">
                    {counts[f.endpoint] !== undefined ? `${counts[f.endpoint]} records` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
