import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { title: '', alertType: '', severity: 'medium', source: '', message: '' }

export default function AlertManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiType, setAiType] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/alerts'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openDetail(item) {
    setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item })
    if (!item.is_read) {
      api.put(`/alerts/${item.id}/read`).then(() => load()).catch(() => {})
    }
  }

  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/alerts', form)
      else await api.put(`/alerts/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/alerts/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const sv = s => s === 'critical' || s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'info'
  const unreadCount = items.filter(i => !i.is_read).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{'\uD83D\uDD14'} Alert Management</h1>
          <p>Manage and respond to brand protection alerts {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} unread</span>}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>AI Alert Triage</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiTitle(item.title || ''); setAiType(item.alert_type || ''); setAiMessage(item.message || ''); }} defaultValue="">
            <option value="">Load from existing alerts...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.title || 'Unknown'} - {item.severity || ''} ({item.alert_type || ''})</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Critical: LuxeVault phishing site detected'); setAiType('domain'); setAiMessage('luxevaultt.com registered with 95% similarity, serving phishing content targeting customers'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Counterfeit VeloCity e-bikes on AliExpress'); setAiType('counterfeit'); setAiMessage('156 units of fake VeloCity e-bikes sold with fire hazard batteries, urgent safety concern'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Fake SoundWave account on TikTok'); setAiType('social_media'); setAiMessage('TikTok account @fakesoundwave with 45K followers promoting knockoff headphones'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Alert title..." value={aiTitle} onChange={e => setAiTitle(e.target.value)} />
          <select className="form-select" value={aiType} onChange={e => setAiType(e.target.value)}>
            <option value="">Alert type...</option><option value="infringement">Infringement</option><option value="domain">Domain</option><option value="counterfeit">Counterfeit</option><option value="social_media">Social Media</option><option value="legal">Legal</option><option value="marketplace">Marketplace</option>
          </select>
        </div>
        <div className="ai-panel-inputs">
          <textarea className="form-textarea" placeholder="Alert message details..." value={aiMessage} onChange={e => setAiMessage(e.target.value)} style={{minHeight:60}} />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          if (!aiTitle) return; setAiLoading(true); setAiResult(null);
          try { const r = await api.post('/alerts/triage', { title: aiTitle, alertType: aiType, message: aiMessage }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }); }
          setAiLoading(false);
        }} disabled={aiLoading || !aiTitle}>
          {aiLoading ? <><span className="spinner" /> Triaging...</> : 'Triage Alert'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Severity</th><th>Source</th><th>Read</th><th>Triggered At</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No alerts found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)} style={{background: !item.is_read ? 'rgba(99,102,241,0.04)' : undefined}}>
                  <td style={{color:'var(--text-primary)',fontWeight: item.is_read ? 400 : 700}}>{item.title || '-'}</td>
                  <td>{item.alert_type || '-'}</td>
                  <td><span className={`badge badge-${sv(item.severity)}`}>{item.severity || '-'}</span></td>
                  <td>{item.source || '-'}</td>
                  <td>{item.is_read ? <span className="text-success">Read</span> : <span className="text-warning">Unread</span>}</td>
                  <td>{item.triggered_at ? new Date(item.triggered_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Alert' : showForm ? 'Edit Alert' : 'Alert Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Title</label><input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Alert Type</label>
                  <select className="form-select" value={form.alertType || form.alert_type || ''} onChange={e => setForm({...form, alertType: e.target.value})}>
                    <option value="">Select...</option><option value="infringement">Infringement</option><option value="domain">Domain</option><option value="counterfeit">Counterfeit</option><option value="social_media">Social Media</option><option value="legal">Legal</option><option value="marketplace">Marketplace</option>
                  </select>
                </div>
                <div className="form-group"><label>Severity</label>
                  <select className="form-select" value={form.severity || 'medium'} onChange={e => setForm({...form, severity: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                </div>
              </div>
              <div className="form-group"><label>Source</label><input className="form-input" value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} /></div>
              <div className="form-group"><label>Message</label><textarea className="form-textarea" value={form.message || ''} onChange={e => setForm({...form, message: e.target.value})} /></div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-label">Title</div><div className="detail-value">{selected.title}</div></div>
              <div className="detail-field"><div className="detail-label">Type</div><div className="detail-value">{selected.alert_type || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Severity</div><div className="detail-value"><span className={`badge badge-${sv(selected.severity)}`}>{selected.severity}</span></div></div>
              <div className="detail-field"><div className="detail-label">Source</div><div className="detail-value">{selected.source || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Read</div><div className="detail-value">{selected.is_read ? 'Yes' : 'No'}</div></div>
              <div className="detail-field"><div className="detail-label">Triggered</div><div className="detail-value">{selected.triggered_at ? new Date(selected.triggered_at).toLocaleString() : '-'}</div></div>
              <div className="detail-field full-width"><div className="detail-label">Message</div><div className="detail-value">{selected.message || '-'}</div></div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
