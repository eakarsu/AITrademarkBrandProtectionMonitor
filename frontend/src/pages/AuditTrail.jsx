import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

export default function AuditTrail() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [aiPeriod, setAiPeriod] = useState('')
  const [aiFocus, setAiFocus] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/audit-logs'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  const actionColor = a => {
    if (!a) return 'neutral'
    const l = a.toLowerCase()
    if (l.includes('create') || l.includes('add')) return 'success'
    if (l.includes('delete') || l.includes('remove')) return 'danger'
    if (l.includes('update') || l.includes('edit')) return 'warning'
    if (l.includes('login') || l.includes('view')) return 'info'
    return 'neutral'
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDCCB'} Audit Trail</h1><p>Complete activity and audit logging</p></div>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>AI Audit Pattern Analysis</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiPeriod('Last 24 hours'); setAiFocus('Security'); }}>Security - 24h</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiPeriod('Last 7 days'); setAiFocus('Anomalies'); }}>Anomalies - 7d</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiPeriod('Last 30 days'); setAiFocus('Compliance'); }}>Compliance - 30d</button>
        </div>
        <div className="ai-panel-inputs">
          <select className="form-select" value={aiPeriod} onChange={e => setAiPeriod(e.target.value)}>
            <option value="">Select period...</option><option value="Last 24 hours">Last 24 hours</option><option value="Last 7 days">Last 7 days</option><option value="Last 30 days">Last 30 days</option><option value="All time">All time</option>
          </select>
          <select className="form-select" value={aiFocus} onChange={e => setAiFocus(e.target.value)}>
            <option value="">Focus area...</option><option value="Security">Security</option><option value="Compliance">Compliance</option><option value="User Behavior">User Behavior</option><option value="Anomalies">Anomalies</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={async () => {
          setAiLoading(true); setAiResult(null);
          try { const r = await api.post('/audit-logs/analyze', { period: aiPeriod, focusArea: aiFocus }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }); }
          setAiLoading(false);
        }} disabled={aiLoading}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Audit Patterns'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>User</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>Details</th><th>IP Address</th><th>Date</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No audit logs found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.user_email || '-'}</td>
                  <td><span className={`badge badge-${actionColor(item.action)}`}>{item.action || '-'}</span></td>
                  <td>{item.entity_type || '-'}</td>
                  <td>{item.entity_id || '-'}</td>
                  <td>{(item.details || '').substring(0, 50)}{(item.details || '').length > 50 ? '...' : ''}</td>
                  <td>{item.ip_address || '-'}</td>
                  <td>{item.performed_at ? new Date(item.performed_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          title="Audit Log Details"
          onClose={() => setSelected(null)}
        >
          <div className="detail-grid">
            <div className="detail-field"><div className="detail-label">User Email</div><div className="detail-value">{selected.user_email || '-'}</div></div>
            <div className="detail-field"><div className="detail-label">Action</div><div className="detail-value"><span className={`badge badge-${actionColor(selected.action)}`}>{selected.action}</span></div></div>
            <div className="detail-field"><div className="detail-label">Entity Type</div><div className="detail-value">{selected.entity_type || '-'}</div></div>
            <div className="detail-field"><div className="detail-label">Entity ID</div><div className="detail-value">{selected.entity_id || '-'}</div></div>
            <div className="detail-field"><div className="detail-label">IP Address</div><div className="detail-value">{selected.ip_address || '-'}</div></div>
            <div className="detail-field"><div className="detail-label">Performed At</div><div className="detail-value">{selected.performed_at ? new Date(selected.performed_at).toLocaleString() : '-'}</div></div>
            <div className="detail-field full-width"><div className="detail-label">Details</div><div className="detail-value">{selected.details || '-'}</div></div>
          </div>
        </DetailModal>
      )}
    </div>
  )
}
