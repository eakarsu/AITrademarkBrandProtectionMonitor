import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { sourceUrl: '', type: '', severity: 'medium', status: 'pending', description: '', trademarkId: '' }

export default function InfringementDetection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiUrl, setAiUrl] = useState('')
  const [aiDesc, setAiDesc] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.get('/infringements')
      setItems(Array.isArray(data) ? data : data?.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!aiUrl) return
    setAiLoading(true)
    setAiResult(null)
    try {
      const res = await api.post('/infringements/analyze', { url: aiUrl, description: aiDesc })
      setAiResult(res)
      load()
    } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/infringements', form)
      else await api.put(`/infringements/${selected._id || selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this infringement?')) return
    try { await api.del(`/infringements/${selected._id || selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{'\u26A0\uFE0F'} Infringement Detection</h1>
          <p>AI-powered detection of potential trademark infringements</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header">
          <span>AI</span>
          <h3>Analyze URL for Infringement</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiUrl(item.sourceUrl || item.source_url || ''); setAiDesc(item.description || ''); }} defaultValue="">
            <option value="">Load from existing infringements...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.sourceUrl || item.source_url || 'Unknown'} ({item.type || 'unknown'})</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://novatek-solutions.com'); setAiDesc('Suspected typosquatting domain selling fake NovaTech software licenses'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://luxevaultt.com'); setAiDesc('Phishing site mimicking LuxeVault luxury brand with 95% visual similarity'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://tiktok.com/@fakesoundwave'); setAiDesc('TikTok account with 45K followers promoting knockoff SoundWave headphones'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Enter URL to analyze..." value={aiUrl} onChange={e => setAiUrl(e.target.value)} />
          <input className="form-input" placeholder="Description (optional)..." value={aiDesc} onChange={e => setAiDesc(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading || !aiUrl}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult} />}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /> Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Source URL</th><th>Type</th><th>Severity</th><th>Status</th><th>Detected At</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="5" className="table-empty">No infringements found.</td></tr>
              ) : items.map(item => (
                <tr key={item._id || item.id} onClick={() => openDetail(item)}>
                  <td style={{ color: 'var(--text-primary)' }}>{item.sourceUrl || item.source_url || '-'}</td>
                  <td>{item.type || '-'}</td>
                  <td><span className={`badge badge-${item.severity === 'high' || item.severity === 'critical' ? 'danger' : item.severity === 'medium' ? 'warning' : 'info'}`}>{item.severity || '-'}</span></td>
                  <td><span className={`badge badge-${item.status === 'resolved' ? 'success' : item.status === 'pending' ? 'warning' : 'info'}`}>{item.status || '-'}</span></td>
                  <td>{item.detectedAt || item.createdAt ? new Date(item.detectedAt || item.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Infringement' : showForm ? 'Edit Infringement' : 'Infringement Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <>
              <button className="btn btn-outline" onClick={() => { if (creating) setCreating(false); else setEditing(false) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </>
          ) : (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            </>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Source URL</label><input className="form-input" value={form.sourceUrl || ''} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Type</label><input className="form-input" placeholder="e.g., domain, content, product" value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })} /></div>
                <div className="form-group"><label>Severity</label>
                  <select className="form-select" value={form.severity || 'medium'} onChange={e => setForm({ ...form, severity: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-select" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option><option value="investigating">Investigating</option><option value="confirmed">Confirmed</option><option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field full-width"><div className="detail-label">Source URL</div><div className="detail-value">{selected.sourceUrl || selected.source_url || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Type</div><div className="detail-value">{selected.type || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Severity</div><div className="detail-value"><span className={`badge badge-${selected.severity === 'high' || selected.severity === 'critical' ? 'danger' : selected.severity === 'medium' ? 'warning' : 'info'}`}>{selected.severity}</span></div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'resolved' ? 'success' : selected.status === 'pending' ? 'warning' : 'info'}`}>{selected.status}</span></div></div>
                <div className="detail-field"><div className="detail-label">Detected At</div><div className="detail-value">{selected.detectedAt || selected.createdAt ? new Date(selected.detectedAt || selected.createdAt).toLocaleString() : '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Description</div><div className="detail-value">{selected.description || '-'}</div></div>
              </div>
              {(selected.aiAnalysis || selected.analysis || selected.ai_analysis) && (
                <div style={{ marginTop: 20 }}>
                  <div className="section-title">AI Analysis</div>
                  <AIOutputDisplay data={selected.aiAnalysis || selected.analysis || selected.ai_analysis} />
                </div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
