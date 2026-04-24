import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { productName: '', platform: '', seller: '', price: '', originalPrice: '', status: 'pending', productUrl: '', description: '' }

export default function CounterfeitDetection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiUrl, setAiUrl] = useState('')
  const [aiDetails, setAiDetails] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/counterfeits'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleDetect() {
    if (!aiUrl) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/counterfeits/detect', { productUrl: aiUrl, details: aiDetails }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/counterfeits', form)
      else await api.put(`/counterfeits/${selected._id || selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/counterfeits/${selected._id || selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDEE1\uFE0F'} Counterfeit Detection</h1><p>Identify counterfeit products being sold online</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Detect Counterfeit Product</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiUrl(item.productUrl || item.product_url || ''); setAiDetails(item.productName || item.product_name || ''); }} defaultValue="">
            <option value="">Load from existing counterfeits...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.productName || item.product_name || 'Unknown'} - {item.platform || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://amazon.com/dp/B0FAKE001'); setAiDetails('AquaPure water bottles sold by BestWaterDeals, 890 units at 40% below retail'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://aliexpress.com/item/VeloCity-eBike'); setAiDetails('VeloCity E-Bike knockoffs from ShenZhen, fire hazard battery concerns, 156 units sold'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiUrl('https://wish.com/product/frostbyte-controller'); setAiDetails('FrostByte gaming controller clones from GamerGear_CN, 5,600 units sold on Wish'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Product URL..." value={aiUrl} onChange={e => setAiUrl(e.target.value)} />
          <input className="form-input" placeholder="Product details (optional)..." value={aiDetails} onChange={e => setAiDetails(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleDetect} disabled={aiLoading || !aiUrl}>
          {aiLoading ? <><span className="spinner" /> Detecting...</> : 'Detect Counterfeit'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Product</th><th>Platform</th><th>Seller</th><th>Price</th><th>Original Price</th><th>Status</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No counterfeits found.</td></tr> : items.map(item => (
                <tr key={item._id || item.id} onClick={() => openDetail(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.productName || item.product_name || '-'}</td>
                  <td>{item.platform || '-'}</td>
                  <td>{item.seller || '-'}</td>
                  <td>{item.price ? `$${item.price}` : '-'}</td>
                  <td>{item.originalPrice ? `$${item.originalPrice}` : '-'}</td>
                  <td><span className={`badge badge-${item.status === 'confirmed' ? 'danger' : item.status === 'removed' ? 'success' : 'warning'}`}>{item.status || '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Counterfeit' : showForm ? 'Edit Counterfeit' : 'Counterfeit Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Product Name</label><input className="form-input" value={form.productName || ''} onChange={e => setForm({ ...form, productName: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Platform</label><input className="form-input" value={form.platform || ''} onChange={e => setForm({ ...form, platform: e.target.value })} /></div>
                <div className="form-group"><label>Seller</label><input className="form-input" value={form.seller || ''} onChange={e => setForm({ ...form, seller: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price</label><input className="form-input" type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label>Original Price</label><input className="form-input" type="number" value={form.originalPrice || ''} onChange={e => setForm({ ...form, originalPrice: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-select" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="removed">Removed</option><option value="investigating">Investigating</option></select>
              </div>
              <div className="form-group"><label>Product URL</label><input className="form-input" value={form.productUrl || ''} onChange={e => setForm({ ...form, productUrl: e.target.value })} /></div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Product Name</div><div className="detail-value">{selected.productName || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Platform</div><div className="detail-value">{selected.platform || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Seller</div><div className="detail-value">{selected.seller || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Price</div><div className="detail-value">{selected.price ? `$${selected.price}` : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Original Price</div><div className="detail-value">{selected.originalPrice ? `$${selected.originalPrice}` : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'confirmed' ? 'danger' : selected.status === 'removed' ? 'success' : 'warning'}`}>{selected.status}</span></div></div>
                <div className="detail-field full-width"><div className="detail-label">Product URL</div><div className="detail-value">{selected.productUrl || '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Description</div><div className="detail-value">{selected.description || '-'}</div></div>
              </div>
              {(selected.aiAnalysis || selected.analysis || selected.detectionResults) && (
                <div style={{ marginTop: 20 }}><div className="section-title">AI Analysis</div><AIOutputDisplay data={selected.aiAnalysis || selected.analysis || selected.detectionResults} /></div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
