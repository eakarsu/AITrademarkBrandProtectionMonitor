import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { caseNumber: '', title: '', defendant: '', caseType: '', status: 'open', jurisdiction: '', filingDate: '', description: '', outcome: '', damages: '' }

export default function LegalCaseManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiDefendant, setAiDefendant] = useState('')
  const [aiCaseType, setAiCaseType] = useState('')
  const [aiDesc, setAiDesc] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/legal-cases'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/legal-cases', form)
      else await api.put(`/legal-cases/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/legal-cases/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating
  const cs = s => s === 'won' || s === 'settled' ? 'success' : s === 'lost' ? 'danger' : s === 'open' ? 'warning' : 'info'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\u2696\uFE0F'} Legal Case Management</h1><p>Manage trademark legal proceedings</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>AI Legal Strategy Advisor</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiTitle(item.title || ''); setAiDefendant(item.defendant || ''); setAiCaseType(item.case_type || ''); setAiDesc(item.description || ''); }} defaultValue="">
            <option value="">Load from existing cases...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.title || item.case_number || 'Unknown'} - {item.status || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('NovaTech vs NovaTeq Systems'); setAiDefendant('NovaTeq Systems LLC'); setAiCaseType('infringement'); setAiDesc('Defendant using confusingly similar name and branding in software analytics market'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('VeloCity vs ShenZhen eBikes'); setAiDefendant('ShenZhen eBikes Trading Co.'); setAiCaseType('counterfeiting'); setAiDesc('Mass counterfeiting of VeloCity e-bikes with fire hazard batteries sold on AliExpress'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('LuxeVault vs Domain Squatter'); setAiDefendant('Unknown Registrant'); setAiCaseType('cybersquatting'); setAiDesc('luxevaultt.com phishing site with 95% similarity stealing customer credentials'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Case title..." value={aiTitle} onChange={e => setAiTitle(e.target.value)} />
          <input className="form-input" placeholder="Defendant..." value={aiDefendant} onChange={e => setAiDefendant(e.target.value)} />
          <select className="form-select" value={aiCaseType} onChange={e => setAiCaseType(e.target.value)}>
            <option value="">Case type...</option><option value="infringement">Infringement</option><option value="counterfeiting">Counterfeiting</option><option value="dilution">Dilution</option><option value="cybersquatting">Cybersquatting</option><option value="unfair_competition">Unfair Competition</option>
          </select>
        </div>
        <div className="ai-panel-inputs">
          <textarea className="form-textarea" placeholder="Case description..." value={aiDesc} onChange={e => setAiDesc(e.target.value)} style={{minHeight:60}} />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          if (!aiTitle) return; setAiLoading(true); setAiResult(null);
          try { const r = await api.post('/legal-cases/strategy', { title: aiTitle, defendant: aiDefendant, caseType: aiCaseType, description: aiDesc }); setAiResult(r); } catch (e) { setAiResult({ error: e.message }); }
          setAiLoading(false);
        }} disabled={aiLoading || !aiTitle}>
          {aiLoading ? <><span className="spinner" /> Analyzing...</> : 'Get Legal Strategy'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.ai_analysis || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Case #</th><th>Title</th><th>Defendant</th><th>Type</th><th>Status</th><th>Jurisdiction</th><th>Damages</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No cases found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.case_number || '-'}</td>
                  <td>{item.title || '-'}</td>
                  <td>{item.defendant || '-'}</td>
                  <td>{item.case_type || '-'}</td>
                  <td><span className={`badge badge-${cs(item.status)}`}>{item.status}</span></td>
                  <td>{item.jurisdiction || '-'}</td>
                  <td>{item.damages ? `$${Number(item.damages).toLocaleString()}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Case' : showForm ? 'Edit Case' : 'Case Details'}
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
                <div className="form-group"><label>Case Number</label><input className="form-input" value={form.caseNumber || form.case_number || ''} onChange={e => setForm({...form, caseNumber: e.target.value})} /></div>
                <div className="form-group"><label>Title</label><input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Defendant</label><input className="form-input" value={form.defendant || ''} onChange={e => setForm({...form, defendant: e.target.value})} /></div>
                <div className="form-group"><label>Case Type</label>
                  <select className="form-select" value={form.caseType || form.case_type || ''} onChange={e => setForm({...form, caseType: e.target.value})}>
                    <option value="">Select...</option><option value="infringement">Infringement</option><option value="counterfeiting">Counterfeiting</option><option value="dilution">Dilution</option><option value="cybersquatting">Cybersquatting</option><option value="unfair_competition">Unfair Competition</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select className="form-select" value={form.status || 'open'} onChange={e => setForm({...form, status: e.target.value})}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="settled">Settled</option><option value="won">Won</option><option value="lost">Lost</option><option value="dismissed">Dismissed</option></select>
                </div>
                <div className="form-group"><label>Jurisdiction</label><input className="form-input" value={form.jurisdiction || ''} onChange={e => setForm({...form, jurisdiction: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Filing Date</label><input className="form-input" type="date" value={form.filingDate || form.filing_date ? (form.filingDate || form.filing_date).substring(0,10) : ''} onChange={e => setForm({...form, filingDate: e.target.value})} /></div>
                <div className="form-group"><label>Damages ($)</label><input className="form-input" type="number" value={form.damages || ''} onChange={e => setForm({...form, damages: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-group"><label>Outcome</label><textarea className="form-textarea" value={form.outcome || ''} onChange={e => setForm({...form, outcome: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Case Number</div><div className="detail-value">{selected.case_number}</div></div>
                <div className="detail-field"><div className="detail-label">Title</div><div className="detail-value">{selected.title}</div></div>
                <div className="detail-field"><div className="detail-label">Defendant</div><div className="detail-value">{selected.defendant || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Case Type</div><div className="detail-value">{selected.case_type || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${cs(selected.status)}`}>{selected.status}</span></div></div>
                <div className="detail-field"><div className="detail-label">Jurisdiction</div><div className="detail-value">{selected.jurisdiction || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Filing Date</div><div className="detail-value">{selected.filing_date ? new Date(selected.filing_date).toLocaleDateString() : '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Damages</div><div className="detail-value">{selected.damages ? `$${Number(selected.damages).toLocaleString()}` : '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Description</div><div className="detail-value">{selected.description || '-'}</div></div>
                <div className="detail-field full-width"><div className="detail-label">Outcome</div><div className="detail-value">{selected.outcome || '-'}</div></div>
              </div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
