import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { recipientName: '', recipientEmail: '', trademark: '', infringementType: '', status: 'draft', letterContent: '' }

export default function CeaseDesistGenerator() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiRecipient, setAiRecipient] = useState('')
  const [aiEmail, setAiEmail] = useState('')
  const [aiTrademark, setAiTrademark] = useState('')
  const [aiType, setAiType] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/cease-desist'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleGenerate() {
    if (!aiRecipient || !aiTrademark) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/cease-desist/generate', { recipientName: aiRecipient, recipientEmail: aiEmail, trademark: aiTrademark, infringementType: aiType }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/cease-desist', form)
      else await api.put(`/cease-desist/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/cease-desist/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDCDC'} C&D Letter Generator</h1><p>AI-generated cease and desist letters</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Generate Cease & Desist Letter</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiRecipient(item.recipient_name || ''); setAiEmail(item.recipient_email || ''); setAiTrademark(item.trademark || ''); setAiType(item.infringement_type || ''); }} defaultValue="">
            <option value="">Load from existing letters...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.recipient_name || 'Unknown'} - {item.trademark || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiRecipient('Domain Registrant - novatek-solutions.com'); setAiEmail('abuse@novatek-solutions.com'); setAiTrademark('NovaTech'); setAiType('domain_squatting'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiRecipient('ShenZhen_eBikes Store'); setAiEmail('seller@aliexpress.com'); setAiTrademark('VeloCity Bikes'); setAiType('counterfeiting'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiRecipient('AudioDeals_Store'); setAiEmail('seller@amazon.com'); setAiTrademark('SoundWave Audio'); setAiType('counterfeiting'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Recipient name..." value={aiRecipient} onChange={e => setAiRecipient(e.target.value)} />
          <input className="form-input" placeholder="Recipient email..." value={aiEmail} onChange={e => setAiEmail(e.target.value)} />
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Trademark being infringed..." value={aiTrademark} onChange={e => setAiTrademark(e.target.value)} />
          <select className="form-select" value={aiType} onChange={e => setAiType(e.target.value)}>
            <option value="">Select infringement type...</option>
            <option value="counterfeiting">Counterfeiting</option>
            <option value="domain_squatting">Domain Squatting</option>
            <option value="brand_impersonation">Brand Impersonation</option>
            <option value="unauthorized_use">Unauthorized Use</option>
            <option value="copyright_violation">Copyright Violation</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={aiLoading || !aiRecipient || !aiTrademark}>
          {aiLoading ? <><span className="spinner" /> Generating...</> : 'Generate Letter'}
        </button>
        {aiResult && (aiResult.letter_content ? (
          <div className="ai-output" style={{marginTop:20}}>
            <div className="letter-content">{aiResult.letter_content}</div>
          </div>
        ) : <AIOutputDisplay data={aiResult} />)}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Recipient</th><th>Trademark</th><th>Type</th><th>Status</th><th>AI Generated</th><th>Date</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No letters found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.recipient_name || '-'}</td>
                  <td>{item.trademark || '-'}</td>
                  <td>{item.infringement_type || '-'}</td>
                  <td><span className={`badge badge-${item.status === 'sent' ? 'success' : item.status === 'draft' ? 'warning' : 'info'}`}>{item.status}</span></td>
                  <td>{item.ai_generated ? 'Yes' : 'No'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Letter' : showForm ? 'Edit Letter' : 'Letter Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-row">
                <div className="form-group"><label>Recipient Name</label><input className="form-input" value={form.recipientName || form.recipient_name || ''} onChange={e => setForm({...form, recipientName: e.target.value})} /></div>
                <div className="form-group"><label>Recipient Email</label><input className="form-input" value={form.recipientEmail || form.recipient_email || ''} onChange={e => setForm({...form, recipientEmail: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Trademark</label><input className="form-input" value={form.trademark || ''} onChange={e => setForm({...form, trademark: e.target.value})} /></div>
                <div className="form-group"><label>Infringement Type</label><input className="form-input" value={form.infringementType || form.infringement_type || ''} onChange={e => setForm({...form, infringementType: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-select" value={form.status || 'draft'} onChange={e => setForm({...form, status: e.target.value})}><option value="draft">Draft</option><option value="sent">Sent</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select>
              </div>
              <div className="form-group"><label>Letter Content</label><textarea className="form-textarea" style={{minHeight:150}} value={form.letterContent || form.letter_content || ''} onChange={e => setForm({...form, letterContent: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Recipient</div><div className="detail-value">{selected.recipient_name}</div></div>
                <div className="detail-field"><div className="detail-label">Email</div><div className="detail-value">{selected.recipient_email || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Trademark</div><div className="detail-value">{selected.trademark}</div></div>
                <div className="detail-field"><div className="detail-label">Type</div><div className="detail-value">{selected.infringement_type || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'sent' ? 'success' : 'warning'}`}>{selected.status}</span></div></div>
                <div className="detail-field"><div className="detail-label">AI Generated</div><div className="detail-value">{selected.ai_generated ? 'Yes' : 'No'}</div></div>
              </div>
              {selected.letter_content && (
                <div style={{marginTop:20}}>
                  <div className="section-title">Letter Content</div>
                  <div className="letter-content">{selected.letter_content}</div>
                </div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
