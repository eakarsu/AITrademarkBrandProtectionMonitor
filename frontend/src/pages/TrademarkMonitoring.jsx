import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { name: '', registrationNumber: '', status: 'active', jurisdiction: '', niceClass: '', owner: '', filingDate: '', expiryDate: '', description: '' }

export default function TrademarkMonitoring() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiName, setAiName] = useState('')
  const [aiJurisdiction, setAiJurisdiction] = useState('')
  const [aiClass, setAiClass] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.get('/trademarks')
      setItems(Array.isArray(data) ? data : data?.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openDetail(item) {
    setSelected(item)
    setEditing(false)
    setForm({ ...emptyForm, ...item })
  }

  function openCreate() {
    setForm({ ...emptyForm })
    setCreating(true)
    setEditing(false)
    setSelected(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) {
        await api.post('/trademarks', form)
      } else {
        await api.put(`/trademarks/${selected._id || selected.id}`, form)
      }
      setSelected(null)
      setCreating(false)
      setEditing(false)
      load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this trademark?')) return
    try {
      await api.del(`/trademarks/${selected._id || selected.id}`)
      setSelected(null)
      load()
    } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{'\u2122\uFE0F'} Trademark Monitoring</h1>
          <p>Track and manage your registered trademarks</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>AI Trademark Risk Assessment</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiName(item.name || ''); setAiJurisdiction(item.jurisdiction || ''); setAiClass(item.niceClass || item.nice_class || ''); }} defaultValue="">
            <option value="">Load from existing trademarks...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.name || 'Unknown'} - {item.jurisdiction || 'N/A'} ({item.status || ''})</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('NovaTech'); setAiJurisdiction('US'); setAiClass('Class 9'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('GreenLeaf Organics'); setAiJurisdiction('EU'); setAiClass('Class 29'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('MediCare Plus'); setAiJurisdiction('US'); setAiClass('Class 44'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Trademark name..." value={aiName} onChange={e => setAiName(e.target.value)} />
          <input className="form-input" placeholder="Jurisdiction..." value={aiJurisdiction} onChange={e => setAiJurisdiction(e.target.value)} />
          <input className="form-input" placeholder="Nice Class..." value={aiClass} onChange={e => setAiClass(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          if (!aiName) return; setAiLoading(true); setAiResult(null);
          try { const r = await api.post('/trademarks/assess', { name: aiName, jurisdiction: aiJurisdiction, niceClass: aiClass }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }); }
          setAiLoading(false);
        }} disabled={aiLoading || !aiName}>
          {aiLoading ? <><span className="spinner" /> Assessing...</> : 'Assess Trademark'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /> Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Name</th><th>Reg Number</th><th>Status</th><th>Jurisdiction</th><th>Class</th><th>Owner</th><th>Expiry Date</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="7" className="table-empty">No trademarks found. Click "Add New" to create one.</td></tr>
              ) : items.map(item => (
                <tr key={item._id || item.id} onClick={() => openDetail(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                  <td>{item.registrationNumber || '-'}</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'success' : item.status === 'pending' ? 'warning' : 'neutral'}`}>{item.status || '-'}</span></td>
                  <td>{item.jurisdiction || '-'}</td>
                  <td>{item.niceClass || item.nice_class || '-'}</td>
                  <td>{item.owner || '-'}</td>
                  <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Trademark' : showForm ? 'Edit Trademark' : (selected?.name || 'Trademark Details')}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <>
              <button className="btn btn-outline" onClick={() => { if (creating) { setCreating(false) } else { setEditing(false) } }}>Cancel</button>
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
              <div className="form-row">
                <div className="form-group"><label>Name</label><input className="form-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label>Registration Number</label><input className="form-input" value={form.registrationNumber || ''} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select className="form-select" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option><option value="pending">Pending</option><option value="expired">Expired</option><option value="opposed">Opposed</option>
                  </select>
                </div>
                <div className="form-group"><label>Jurisdiction</label><input className="form-input" value={form.jurisdiction || ''} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Nice Class</label><input className="form-input" value={form.niceClass || ''} onChange={e => setForm({ ...form, niceClass: e.target.value })} /></div>
                <div className="form-group"><label>Owner</label><input className="form-input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Filing Date</label><input className="form-input" type="date" value={form.filingDate ? form.filingDate.substring(0, 10) : ''} onChange={e => setForm({ ...form, filingDate: e.target.value })} /></div>
                <div className="form-group"><label>Expiry Date</label><input className="form-input" type="date" value={form.expiryDate ? form.expiryDate.substring(0, 10) : ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-label">Name</div><div className="detail-value">{selected.name}</div></div>
              <div className="detail-field"><div className="detail-label">Registration Number</div><div className="detail-value">{selected.registrationNumber || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'active' ? 'success' : selected.status === 'pending' ? 'warning' : 'neutral'}`}>{selected.status}</span></div></div>
              <div className="detail-field"><div className="detail-label">Jurisdiction</div><div className="detail-value">{selected.jurisdiction || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Nice Class</div><div className="detail-value">{selected.niceClass || selected.nice_class || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Owner</div><div className="detail-value">{selected.owner || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Filing Date</div><div className="detail-value">{selected.filingDate ? new Date(selected.filingDate).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Expiry Date</div><div className="detail-value">{selected.expiryDate ? new Date(selected.expiryDate).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field full-width"><div className="detail-label">Description</div><div className="detail-value">{selected.description || '-'}</div></div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
