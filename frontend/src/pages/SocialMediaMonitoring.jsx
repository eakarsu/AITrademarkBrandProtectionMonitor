import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { platform: '', author: '', content: '', sentiment: 'neutral', reach: '', engagement: '', url: '', brandMentioned: '' }

export default function SocialMediaMonitoring() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiBrand, setAiBrand] = useState('')
  const [aiPlatform, setAiPlatform] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/social-mentions'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!aiBrand) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/social-mentions/analyze', { brandName: aiBrand, platform: aiPlatform, content: aiContent }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/social-mentions', form)
      else await api.put(`/social-mentions/${selected._id || selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/social-mentions/${selected._id || selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const sentBadge = s => s === 'positive' ? 'success' : s === 'negative' ? 'danger' : 'neutral'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDCAC'} Social Media Monitoring</h1><p>Monitor brand mentions across social platforms</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Analyze Social Media Threat</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiBrand(item.trademark_mentioned || item.brandMentioned || ''); setAiPlatform(item.platform || ''); setAiContent(item.content || ''); }} defaultValue="">
            <option value="">Load from existing mentions...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.trademark_mentioned || item.brandMentioned || 'Unknown'} - {item.platform || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('NovaTech'); setAiPlatform('Twitter/X'); setAiContent('Found fake @NovaTech account promoting scam software deals with 15K followers'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('LuxeVault'); setAiPlatform('TikTok'); setAiContent('Multiple TikTok accounts selling replica LuxeVault jewelry boxes claiming to be authentic'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiBrand('AquaPure'); setAiPlatform('Instagram'); setAiContent('Instagram influencer promoting counterfeit AquaPure water bottles at half price'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Brand name..." value={aiBrand} onChange={e => setAiBrand(e.target.value)} />
          <select className="form-select" value={aiPlatform} onChange={e => setAiPlatform(e.target.value)}>
            <option value="">Select platform...</option>
            <option value="Twitter/X">Twitter/X</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="Reddit">Reddit</option>
            <option value="YouTube">YouTube</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>
        </div>
        <div className="ai-panel-inputs">
          <textarea className="form-textarea" placeholder="Paste the social media content to analyze..." value={aiContent} onChange={e => setAiContent(e.target.value)} style={{minHeight:60}} />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading || !aiBrand}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Threat'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Platform</th><th>Author</th><th>Content</th><th>Sentiment</th><th>Reach</th><th>Engagement</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No social mentions found.</td></tr> : items.map(item => (
                <tr key={item._id || item.id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.platform || '-'}</td>
                  <td>{item.author || '-'}</td>
                  <td>{(item.content || '').substring(0, 60)}{(item.content || '').length > 60 ? '...' : ''}</td>
                  <td><span className={`badge badge-${sentBadge(item.sentiment)}`}>{item.sentiment || '-'}</span></td>
                  <td>{item.reach != null ? Number(item.reach).toLocaleString() : '-'}</td>
                  <td>{item.engagement != null ? Number(item.engagement).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Social Mention' : showForm ? 'Edit Social Mention' : 'Social Mention Details'}
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
                <div className="form-group"><label>Platform</label><input className="form-input" placeholder="Twitter, Facebook, etc." value={form.platform || ''} onChange={e => setForm({ ...form, platform: e.target.value })} /></div>
                <div className="form-group"><label>Author</label><input className="form-input" value={form.author || ''} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Content</label><textarea className="form-textarea" value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Sentiment</label>
                  <select className="form-select" value={form.sentiment || 'neutral'} onChange={e => setForm({ ...form, sentiment: e.target.value })}><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option></select>
                </div>
                <div className="form-group"><label>Brand Mentioned</label><input className="form-input" value={form.brandMentioned || form.trademark_mentioned || ''} onChange={e => setForm({ ...form, brandMentioned: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Reach</label><input className="form-input" type="number" value={form.reach || ''} onChange={e => setForm({ ...form, reach: e.target.value })} /></div>
                <div className="form-group"><label>Engagement</label><input className="form-input" type="number" value={form.engagement || ''} onChange={e => setForm({ ...form, engagement: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>URL</label><input className="form-input" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-label">Platform</div><div className="detail-value">{selected.platform || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Author</div><div className="detail-value">{selected.author || '-'}</div></div>
              <div className="detail-field full-width"><div className="detail-label">Content</div><div className="detail-value">{selected.content || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Sentiment</div><div className="detail-value"><span className={`badge badge-${sentBadge(selected.sentiment)}`}>{selected.sentiment}</span></div></div>
              <div className="detail-field"><div className="detail-label">Brand Mentioned</div><div className="detail-value">{selected.trademark_mentioned || selected.brandMentioned || '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Reach</div><div className="detail-value">{selected.reach != null ? Number(selected.reach).toLocaleString() : '-'}</div></div>
              <div className="detail-field"><div className="detail-label">Engagement</div><div className="detail-value">{selected.engagement != null ? Number(selected.engagement).toLocaleString() : '-'}</div></div>
              <div className="detail-field full-width"><div className="detail-label">URL</div><div className="detail-value">{selected.url || '-'}</div></div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
