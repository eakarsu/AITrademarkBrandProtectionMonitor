import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { brandName: '', source: '', period: '', positiveScore: '', negativeScore: '', neutralScore: '', summary: '' }

export default function SentimentAnalysis() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiBrand, setAiBrand] = useState('')
  const [aiSource, setAiSource] = useState('')
  const [aiPeriod, setAiPeriod] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/sentiment'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!aiBrand) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/sentiment/analyze', { brandName: aiBrand, source: aiSource, period: aiPeriod }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/sentiment', form)
      else await api.put(`/sentiment/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/sentiment/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  function ScoreBar({ label, score, color }) {
    const n = parseFloat(score)
    if (isNaN(n)) return null
    return (
      <div style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
          <span style={{color:'var(--text-secondary)'}}>{label}</span>
          <span style={{fontWeight:700,color}}>{n}%</span>
        </div>
        <div style={{height:8,background:'var(--bg-hover)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${Math.min(n,100)}%`,background:color,borderRadius:4,transition:'width 0.6s'}} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDCCA'} Sentiment Analysis</h1><p>AI-powered brand sentiment analysis</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Analyze Brand Sentiment</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiBrand(item.brand_name || ''); setAiSource(item.source || ''); setAiPeriod(item.period || ''); }} defaultValue="">
            <option value="">Load from existing analyses...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.brand_name || 'Unknown'} - {item.source || 'All'} ({item.positive_score != null ? item.positive_score + '% positive' : ''})</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('NovaTech'); setAiSource('Twitter'); setAiPeriod('Last 30 days'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('FrostByte Gaming'); setAiSource('Reddit'); setAiPeriod('Last 7 days'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('Botanica Wellness'); setAiSource(''); setAiPeriod('Last 90 days'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Brand name..." value={aiBrand} onChange={e => setAiBrand(e.target.value)} />
          <select className="form-select" value={aiSource} onChange={e => setAiSource(e.target.value)}>
            <option value="">All Sources</option>
            <option value="Twitter">Twitter/X</option>
            <option value="Reddit">Reddit</option>
            <option value="News">News</option>
            <option value="Reviews">Reviews</option>
          </select>
          <select className="form-select" value={aiPeriod} onChange={e => setAiPeriod(e.target.value)}>
            <option value="">Select period...</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 90 days">Last 90 days</option>
            <option value="Last year">Last year</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading || !aiBrand}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Sentiment'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Brand</th><th>Source</th><th>Period</th><th>Positive</th><th>Negative</th><th>Neutral</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No analyses found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.brand_name || '-'}</td>
                  <td>{item.source || '-'}</td>
                  <td>{item.period || '-'}</td>
                  <td><span className="text-success">{item.positive_score != null ? `${item.positive_score}%` : '-'}</span></td>
                  <td><span className="text-danger">{item.negative_score != null ? `${item.negative_score}%` : '-'}</span></td>
                  <td><span className="text-info">{item.neutral_score != null ? `${item.neutral_score}%` : '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Analysis' : showForm ? 'Edit Analysis' : 'Sentiment Details'}
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
                <div className="form-group"><label>Brand Name</label><input className="form-input" value={form.brandName || form.brand_name || ''} onChange={e => setForm({...form, brandName: e.target.value})} /></div>
                <div className="form-group"><label>Source</label><input className="form-input" value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Period</label><input className="form-input" value={form.period || ''} onChange={e => setForm({...form, period: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Positive %</label><input className="form-input" type="number" value={form.positiveScore || form.positive_score || ''} onChange={e => setForm({...form, positiveScore: e.target.value})} /></div>
                <div className="form-group"><label>Negative %</label><input className="form-input" type="number" value={form.negativeScore || form.negative_score || ''} onChange={e => setForm({...form, negativeScore: e.target.value})} /></div>
                <div className="form-group"><label>Neutral %</label><input className="form-input" type="number" value={form.neutralScore || form.neutral_score || ''} onChange={e => setForm({...form, neutralScore: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Summary</label><textarea className="form-textarea" value={form.summary || ''} onChange={e => setForm({...form, summary: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Brand</div><div className="detail-value">{selected.brand_name}</div></div>
                <div className="detail-field"><div className="detail-label">Source</div><div className="detail-value">{selected.source || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Period</div><div className="detail-value">{selected.period || '-'}</div></div>
              </div>
              <div style={{marginTop:20,padding:16,background:'var(--bg-main)',borderRadius:12,border:'1px solid var(--border)'}}>
                <ScoreBar label="Positive" score={selected.positive_score} color="var(--success)" />
                <ScoreBar label="Negative" score={selected.negative_score} color="var(--danger)" />
                <ScoreBar label="Neutral" score={selected.neutral_score} color="var(--info)" />
              </div>
              {selected.summary && <div style={{marginTop:16}}><div className="detail-label">Summary</div><div className="detail-value">{selected.summary}</div></div>}
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
