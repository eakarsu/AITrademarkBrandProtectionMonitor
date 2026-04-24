import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { originalBrand: '', comparedBrand: '', similarityScore: '', colorSimilarity: '', shapeSimilarity: '', riskLevel: 'low', visualElements: '' }

export default function LogoSimilarity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiBrand1, setAiBrand1] = useState('')
  const [aiBrand2, setAiBrand2] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/logos'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!aiBrand1 || !aiBrand2) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/logos/analyze', { originalBrand: aiBrand1, comparedBrand: aiBrand2 }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/logos', form)
      else await api.put(`/logos/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/logos/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const rl = v => v === 'high' || v === 'critical' ? 'danger' : v === 'medium' ? 'warning' : 'success'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83C\uDFA8'} Logo Similarity</h1><p>AI-powered logo similarity detection and analysis</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Analyze Logo Similarity</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiBrand1(item.original_brand || ''); setAiBrand2(item.compared_brand || ''); }} defaultValue="">
            <option value="">Load from existing analyses...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.original_brand || '?'} vs {item.compared_brand || '?'} ({item.similarity_score != null ? item.similarity_score + '%' : ''})</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand1('NovaTech'); setAiBrand2('NovaTeq Systems'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand1('GreenLeaf Organics'); setAiBrand2('OrganicHarvest Foods'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand1('PeakPerformance'); setAiBrand2('ApexFit Apparel'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Your brand name..." value={aiBrand1} onChange={e => setAiBrand1(e.target.value)} />
          <input className="form-input" placeholder="Brand to compare..." value={aiBrand2} onChange={e => setAiBrand2(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading || !aiBrand1 || !aiBrand2}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Similarity'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Original Brand</th><th>Compared Brand</th><th>Similarity</th><th>Color Match</th><th>Shape Match</th><th>Risk Level</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No analyses found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.original_brand || '-'}</td>
                  <td>{item.compared_brand || '-'}</td>
                  <td>{item.similarity_score != null ? `${item.similarity_score}%` : '-'}</td>
                  <td>{item.color_similarity != null ? `${item.color_similarity}%` : '-'}</td>
                  <td>{item.shape_similarity != null ? `${item.shape_similarity}%` : '-'}</td>
                  <td><span className={`badge badge-${rl(item.risk_level)}`}>{item.risk_level || '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Analysis' : showForm ? 'Edit Analysis' : 'Logo Analysis Details'}
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
                <div className="form-group"><label>Original Brand</label><input className="form-input" value={form.originalBrand || form.original_brand || ''} onChange={e => setForm({...form, originalBrand: e.target.value})} /></div>
                <div className="form-group"><label>Compared Brand</label><input className="form-input" value={form.comparedBrand || form.compared_brand || ''} onChange={e => setForm({...form, comparedBrand: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Similarity Score %</label><input className="form-input" type="number" value={form.similarityScore || form.similarity_score || ''} onChange={e => setForm({...form, similarityScore: e.target.value})} /></div>
                <div className="form-group"><label>Risk Level</label>
                  <select className="form-select" value={form.riskLevel || form.risk_level || 'low'} onChange={e => setForm({...form, riskLevel: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Color Similarity %</label><input className="form-input" type="number" value={form.colorSimilarity || form.color_similarity || ''} onChange={e => setForm({...form, colorSimilarity: e.target.value})} /></div>
                <div className="form-group"><label>Shape Similarity %</label><input className="form-input" type="number" value={form.shapeSimilarity || form.shape_similarity || ''} onChange={e => setForm({...form, shapeSimilarity: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Visual Elements</label><textarea className="form-textarea" value={form.visualElements || form.visual_elements || ''} onChange={e => setForm({...form, visualElements: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Original Brand</div><div className="detail-value">{selected.original_brand}</div></div>
                <div className="detail-field"><div className="detail-label">Compared Brand</div><div className="detail-value">{selected.compared_brand}</div></div>
                <div className="detail-field"><div className="detail-label">Similarity Score</div><div className="detail-value">{selected.similarity_score != null ? `${selected.similarity_score}%` : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Risk Level</div><div className="detail-value"><span className={`badge badge-${rl(selected.risk_level)}`}>{selected.risk_level}</span></div></div>
                <div className="detail-field"><div className="detail-label">Color Similarity</div><div className="detail-value">{selected.color_similarity != null ? `${selected.color_similarity}%` : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Shape Similarity</div><div className="detail-value">{selected.shape_similarity != null ? `${selected.shape_similarity}%` : '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Visual Elements</div><div className="detail-value">{selected.visual_elements || '-'}</div></div>
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
