import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { searchTerm: '', jurisdiction: '', status: 'completed', resultsCount: '' }

export default function TrademarkSearch() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiTerm, setAiTerm] = useState('')
  const [aiJurisdiction, setAiJurisdiction] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/trademark-searches'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleSearch() {
    if (!aiTerm) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/trademark-searches/search', { searchTerm: aiTerm, jurisdiction: aiJurisdiction }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/trademark-searches', form)
      else await api.put(`/trademark-searches/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/trademark-searches/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDD0D'} Trademark Search</h1><p>AI-powered trademark conflict search and analysis</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Search Trademarks</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiTerm(item.search_term || ''); setAiJurisdiction(item.jurisdiction || ''); }} defaultValue="">
            <option value="">Load from existing searches...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.search_term || 'Unknown'} - {item.jurisdiction || 'Global'}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTerm('NovaTech'); setAiJurisdiction('US'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTerm('GreenLeaf'); setAiJurisdiction('EU'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTerm('SolarFlare'); setAiJurisdiction('Global'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Enter trademark to search..." value={aiTerm} onChange={e => setAiTerm(e.target.value)} />
          <select className="form-select" value={aiJurisdiction} onChange={e => setAiJurisdiction(e.target.value)}>
            <option value="">All Jurisdictions</option>
            <option value="US">United States</option>
            <option value="EU">European Union</option>
            <option value="UK">United Kingdom</option>
            <option value="CN">China</option>
            <option value="JP">Japan</option>
            <option value="Global">Global</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSearch} disabled={aiLoading || !aiTerm}>
          {aiLoading ? <><span className="spinner" /> Searching...</> : 'Search Trademarks'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Search Term</th><th>Jurisdiction</th><th>Results</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="5" className="table-empty">No searches found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.search_term || '-'}</td>
                  <td>{item.jurisdiction || 'Global'}</td>
                  <td>{item.results_count != null ? item.results_count : '-'}</td>
                  <td><span className={`badge badge-${item.status === 'completed' ? 'success' : 'warning'}`}>{item.status || '-'}</span></td>
                  <td>{item.searched_at ? new Date(item.searched_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Search' : showForm ? 'Edit Search' : 'Search Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Search Term</label><input className="form-input" value={form.searchTerm || form.search_term || ''} onChange={e => setForm({...form, searchTerm: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Jurisdiction</label><input className="form-input" value={form.jurisdiction || ''} onChange={e => setForm({...form, jurisdiction: e.target.value})} /></div>
                <div className="form-group"><label>Results Count</label><input className="form-input" type="number" value={form.resultsCount || form.results_count || ''} onChange={e => setForm({...form, resultsCount: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-select" value={form.status || 'completed'} onChange={e => setForm({...form, status: e.target.value})}><option value="pending">Pending</option><option value="completed">Completed</option><option value="conflict_found">Conflict Found</option></select>
              </div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Search Term</div><div className="detail-value">{selected.search_term}</div></div>
                <div className="detail-field"><div className="detail-label">Jurisdiction</div><div className="detail-value">{selected.jurisdiction || 'Global'}</div></div>
                <div className="detail-field"><div className="detail-label">Results Count</div><div className="detail-value">{selected.results_count != null ? selected.results_count : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'completed' ? 'success' : 'warning'}`}>{selected.status}</span></div></div>
              </div>
              {selected.ai_analysis && (
                <div style={{marginTop:20}}><div className="section-title">AI Analysis</div><AIOutputDisplay data={selected.ai_analysis} /></div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
