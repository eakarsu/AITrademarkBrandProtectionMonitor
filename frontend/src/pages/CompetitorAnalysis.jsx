import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { name: '', website: '', industry: '', threatLevel: 'low', trademarkOverlap: '', marketPosition: '' }

export default function CompetitorAnalysis() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiName, setAiName] = useState('')
  const [aiWebsite, setAiWebsite] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/competitors'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!aiName) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/competitors/analyze', { name: aiName, website: aiWebsite }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/competitors', form)
      else await api.put(`/competitors/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/competitors/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const tl = v => v === 'high' || v === 'critical' ? 'danger' : v === 'medium' ? 'warning' : 'success'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83C\uDFC6'} Competitor Analysis</h1><p>AI-powered competitor brand monitoring</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Analyze Competitor</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiName(item.name || ''); setAiWebsite(item.website || ''); }} defaultValue="">
            <option value="">Load from existing competitors...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.name || 'Unknown'} ({item.threat_level || 'unknown'} threat)</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('DataSphere Analytics'); setAiWebsite('https://datasphere.io'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('CanvasFlow Studio'); setAiWebsite('https://canvasflow.design'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiName('HealthBridge Digital'); setAiWebsite('https://healthbridge.com'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Competitor name..." value={aiName} onChange={e => setAiName(e.target.value)} />
          <input className="form-input" placeholder="Website (optional)..." value={aiWebsite} onChange={e => setAiWebsite(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading || !aiName}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Competitor'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Website</th><th>Industry</th><th>Threat Level</th><th>Market Position</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="5" className="table-empty">No competitors found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.name || '-'}</td>
                  <td>{item.website || '-'}</td>
                  <td>{item.industry || '-'}</td>
                  <td><span className={`badge badge-${tl(item.threat_level)}`}>{item.threat_level || '-'}</span></td>
                  <td>{item.market_position || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Competitor' : showForm ? 'Edit Competitor' : 'Competitor Details'}
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
                <div className="form-group"><label>Name</label><input className="form-input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label>Website</label><input className="form-input" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Industry</label><input className="form-input" value={form.industry || ''} onChange={e => setForm({...form, industry: e.target.value})} /></div>
                <div className="form-group"><label>Market Position</label><input className="form-input" value={form.marketPosition || form.market_position || ''} onChange={e => setForm({...form, marketPosition: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Threat Level</label>
                <select className="form-select" value={form.threatLevel || form.threat_level || 'low'} onChange={e => setForm({...form, threatLevel: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
              </div>
              <div className="form-group"><label>Trademark Overlap</label><textarea className="form-textarea" value={form.trademarkOverlap || form.trademark_overlap || ''} onChange={e => setForm({...form, trademarkOverlap: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Name</div><div className="detail-value">{selected.name}</div></div>
                <div className="detail-field"><div className="detail-label">Website</div><div className="detail-value">{selected.website || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Industry</div><div className="detail-value">{selected.industry || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Threat Level</div><div className="detail-value"><span className={`badge badge-${tl(selected.threat_level)}`}>{selected.threat_level || '-'}</span></div></div>
                <div className="detail-field"><div className="detail-label">Market Position</div><div className="detail-value">{selected.market_position || '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Trademark Overlap</div><div className="detail-value">{selected.trademark_overlap || '-'}</div></div>
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
