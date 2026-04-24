import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { domain: '', similarityScore: '', registrar: '', threatLevel: 'low', status: 'active', registrationDate: '', expiryDate: '', ipAddress: '' }

export default function DomainMonitoring() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [scanDomain, setScanDomain] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/domains'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleScan() {
    if (!scanDomain) return
    setScanLoading(true); setScanResult(null)
    try { const r = await api.post('/domains/scan', { domain: scanDomain }); setScanResult(r); load() } catch (e) { setScanResult({ error: e.message }) }
    setScanLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/domains', form)
      else await api.put(`/domains/${selected._id || selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/domains/${selected._id || selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const tl = v => v === 'high' || v === 'critical' ? 'danger' : v === 'medium' ? 'warning' : 'success'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{'\uD83C\uDF10'} Domain Monitoring</h1>
          <p>Detect typosquatting and suspicious domain registrations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Scan Domain for Typosquatting</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setScanDomain(item.domain || ''); }} defaultValue="">
            <option value="">Load from existing domains...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.domain || 'Unknown'} ({item.threatLevel || item.threat_level || 'unknown'} threat)</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setScanDomain('novatech.com'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setScanDomain('luxevault.com'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setScanDomain('medicare-plus.com'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Enter domain name to scan..." value={scanDomain} onChange={e => setScanDomain(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleScan} disabled={scanLoading || !scanDomain}>
          {scanLoading ? <><span className="spinner" /> Scanning...</> : 'Scan Domain'}
        </button>
        {scanResult && <AIOutputDisplay data={scanResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Domain</th><th>Similarity</th><th>Registrar</th><th>Threat Level</th><th>Status</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="5" className="table-empty">No domains found.</td></tr> : items.map(item => (
                <tr key={item._id || item.id} onClick={() => openDetail(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.domain || '-'}</td>
                  <td>{item.similarityScore != null ? `${item.similarityScore}%` : '-'}</td>
                  <td>{item.registrar || '-'}</td>
                  <td><span className={`badge badge-${tl(item.threatLevel || item.threat_level)}`}>{item.threatLevel || item.threat_level || '-'}</span></td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'success' : item.status === 'taken_down' ? 'danger' : 'warning'}`}>{item.status || '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Domain' : showForm ? 'Edit Domain' : 'Domain Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Domain</label><input className="form-input" value={form.domain || ''} onChange={e => setForm({ ...form, domain: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Similarity Score (%)</label><input className="form-input" type="number" value={form.similarityScore || ''} onChange={e => setForm({ ...form, similarityScore: e.target.value })} /></div>
                <div className="form-group"><label>Registrar</label><input className="form-input" value={form.registrar || ''} onChange={e => setForm({ ...form, registrar: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Threat Level</label>
                  <select className="form-select" value={form.threatLevel || 'low'} onChange={e => setForm({ ...form, threatLevel: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select className="form-select" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="monitoring">Monitoring</option><option value="taken_down">Taken Down</option></select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>IP Address</label><input className="form-input" value={form.ipAddress || ''} onChange={e => setForm({ ...form, ipAddress: e.target.value })} /></div>
                <div className="form-group"><label>Registration Date</label><input className="form-input" type="date" value={form.registrationDate ? form.registrationDate.substring(0, 10) : ''} onChange={e => setForm({ ...form, registrationDate: e.target.value })} /></div>
              </div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Domain</div><div className="detail-value">{selected.domain}</div></div>
                <div className="detail-field"><div className="detail-label">Similarity Score</div><div className="detail-value">{selected.similarityScore != null ? `${selected.similarityScore}%` : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Registrar</div><div className="detail-value">{selected.registrar || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Threat Level</div><div className="detail-value"><span className={`badge badge-${tl(selected.threatLevel)}`}>{selected.threatLevel || '-'}</span></div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value">{selected.status || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">IP Address</div><div className="detail-value">{selected.ipAddress || '-'}</div></div>
              </div>
              {(selected.aiAnalysis || selected.analysis || selected.scanResults) && (
                <div style={{ marginTop: 20 }}><div className="section-title">AI Analysis</div><AIOutputDisplay data={selected.aiAnalysis || selected.analysis || selected.scanResults} /></div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
