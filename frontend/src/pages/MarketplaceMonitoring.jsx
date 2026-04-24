import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { marketplace: '', productTitle: '', seller: '', price: '', url: '', status: 'active', isCounterfeit: false, trademarkMatched: '' }

export default function MarketplaceMonitoring() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiProduct, setAiProduct] = useState('')
  const [aiSeller, setAiSeller] = useState('')
  const [aiMarketplace, setAiMarketplace] = useState('')
  const [aiPrice, setAiPrice] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/marketplace'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/marketplace', form)
      else await api.put(`/marketplace/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/marketplace/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDED2'} Marketplace Monitoring</h1><p>Monitor e-commerce listings for brand violations</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Analyze Marketplace Listing</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiProduct(item.product_title || ''); setAiSeller(item.seller || ''); setAiMarketplace(item.marketplace || ''); setAiPrice(item.price || ''); }} defaultValue="">
            <option value="">Load from existing listings...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.product_title || 'Unknown'} - {item.marketplace || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiProduct('NovaTech Pro Enterprise License - Lifetime Access'); setAiSeller('SoftwareDeals_2024'); setAiMarketplace('Amazon'); setAiPrice('29.99'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiProduct('VeloCity Electric Bike 500W Motor'); setAiSeller('ShenZhen_eBikes'); setAiMarketplace('AliExpress'); setAiPrice('199.99'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiProduct('SoundWave Pro X Wireless Headphones'); setAiSeller('AudioDeals_Store'); setAiMarketplace('eBay'); setAiPrice('24.99'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Product title..." value={aiProduct} onChange={e => setAiProduct(e.target.value)} />
          <input className="form-input" placeholder="Seller name..." value={aiSeller} onChange={e => setAiSeller(e.target.value)} />
          <select className="form-select" value={aiMarketplace} onChange={e => setAiMarketplace(e.target.value)}>
            <option value="">Select marketplace...</option>
            <option value="Amazon">Amazon</option><option value="eBay">eBay</option><option value="AliExpress">AliExpress</option><option value="Alibaba">Alibaba</option><option value="Wish">Wish</option>
          </select>
          <input className="form-input" placeholder="Price..." type="number" value={aiPrice} onChange={e => setAiPrice(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          if (!aiProduct) return; setAiLoading(true); setAiResult(null);
          try { const r = await api.post('/marketplace/analyze', { productTitle: aiProduct, seller: aiSeller, marketplace: aiMarketplace, price: aiPrice }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }); }
          setAiLoading(false);
        }} disabled={aiLoading || !aiProduct}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Listing'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Marketplace</th><th>Product</th><th>Seller</th><th>Price</th><th>Counterfeit</th><th>Trademark</th><th>Status</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No listings found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.marketplace || '-'}</td>
                  <td>{item.product_title || '-'}</td>
                  <td>{item.seller || '-'}</td>
                  <td>{item.price ? `$${item.price}` : '-'}</td>
                  <td><span className={`badge badge-${item.is_counterfeit ? 'danger' : 'success'}`}>{item.is_counterfeit ? 'Yes' : 'No'}</span></td>
                  <td>{item.trademark_matched || '-'}</td>
                  <td><span className={`badge badge-${item.status === 'removed' ? 'success' : item.status === 'active' ? 'warning' : 'info'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Listing' : showForm ? 'Edit Listing' : 'Listing Details'}
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
                <div className="form-group"><label>Marketplace</label>
                  <select className="form-select" value={form.marketplace || ''} onChange={e => setForm({...form, marketplace: e.target.value})}>
                    <option value="">Select...</option><option value="Amazon">Amazon</option><option value="eBay">eBay</option><option value="AliExpress">AliExpress</option><option value="Alibaba">Alibaba</option><option value="Wish">Wish</option><option value="Shopify">Shopify Store</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label>Seller</label><input className="form-input" value={form.seller || ''} onChange={e => setForm({...form, seller: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Product Title</label><input className="form-input" value={form.productTitle || form.product_title || ''} onChange={e => setForm({...form, productTitle: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Price</label><input className="form-input" type="number" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})} /></div>
                <div className="form-group"><label>Trademark Matched</label><input className="form-input" value={form.trademarkMatched || form.trademark_matched || ''} onChange={e => setForm({...form, trademarkMatched: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select className="form-select" value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Active</option><option value="removed">Removed</option><option value="reported">Reported</option><option value="monitoring">Monitoring</option></select>
                </div>
                <div className="form-group"><label>Is Counterfeit?</label>
                  <select className="form-select" value={form.isCounterfeit || form.is_counterfeit ? 'true' : 'false'} onChange={e => setForm({...form, isCounterfeit: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select>
                </div>
              </div>
              <div className="form-group"><label>URL</label><input className="form-input" value={form.url || ''} onChange={e => setForm({...form, url: e.target.value})} /></div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-label">Marketplace</div><div className="detail-value">{selected.marketplace}</div></div>
              <div className="detail-field"><div className="detail-label">Seller</div><div className="detail-value">{selected.seller || '-'}</div></div>
              <div className="detail-field full-width"><div className="detail-label">Product Title</div><div className="detail-value">{selected.product_title}</div></div>
              <div className="detail-field"><div className="detail-label">Price</div><div className="detail-value">{selected.price ? `$${selected.price}` : '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Counterfeit</div><div className="detail-value"><span className={`badge badge-${selected.is_counterfeit ? 'danger' : 'success'}`}>{selected.is_counterfeit ? 'Yes' : 'No'}</span></div></div>
              <div className="detail-field"><div className="detail-label">Trademark Matched</div><div className="detail-value">{selected.trademark_matched || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'removed' ? 'success' : 'warning'}`}>{selected.status}</span></div></div>
              <div className="detail-field full-width"><div className="detail-label">URL</div><div className="detail-value">{selected.url || '-'}</div></div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
