import React, { useState, useEffect } from 'react'
import { api } from '../api'
import DetailModal from '../components/DetailModal'
import AIOutputDisplay from '../components/AIOutputDisplay'

const emptyForm = { title: '', reportType: '', period: '', status: 'draft', content: '' }

export default function ReportGeneration() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiType, setAiType] = useState('')
  const [aiPeriod, setAiPeriod] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const d = await api.get('/reports'); setItems(Array.isArray(d) ? d : d?.data || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleGenerate() {
    if (!aiTitle) return
    setAiLoading(true); setAiResult(null)
    try { const r = await api.post('/reports/generate', { title: aiTitle, reportType: aiType, period: aiPeriod }); setAiResult(r); load() } catch (e) { setAiResult({ error: e.message }) }
    setAiLoading(false)
  }

  function openDetail(item) { setSelected(item); setEditing(false); setForm({ ...emptyForm, ...item }) }
  function openCreate() { setForm({ ...emptyForm }); setCreating(true); setSelected(null); setEditing(false) }

  async function handleSave() {
    setSaving(true)
    try {
      if (creating) await api.post('/reports', form)
      else await api.put(`/reports/${selected.id}`, form)
      setSelected(null); setCreating(false); setEditing(false); load()
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try { await api.del(`/reports/${selected.id}`); setSelected(null); load() } catch (e) { alert(e.message) }
  }

  const showForm = editing || creating

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>{'\uD83D\uDCC4'} Report Generation</h1><p>AI-generated comprehensive brand protection reports</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-header"><span>AI</span><h3>Generate Report</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select className="form-select" style={{ flex: 1, minWidth: 200 }} onChange={e => { const idx = e.target.value; if (idx === '') return; const item = items[idx]; setAiTitle(item.title || ''); setAiType(item.report_type || ''); setAiPeriod(item.period || ''); }} defaultValue="">
            <option value="">Load from existing reports...</option>
            {items.map((item, i) => <option key={i} value={i}>{item.title || 'Unknown'} - {item.report_type || ''}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Q1 2024 Brand Protection Summary'); setAiType('quarterly_review'); setAiPeriod('Q1 2024'); }}>Sample 1</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Critical Counterfeit Incident Report'); setAiType('incident_report'); setAiPeriod('Q2 2024'); }}>Sample 2</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAiTitle('Annual Brand Risk Assessment 2024'); setAiType('risk_assessment'); setAiPeriod('2024 Annual'); }}>Sample 3</button>
        </div>
        <div className="ai-panel-inputs">
          <input className="form-input" placeholder="Report title..." value={aiTitle} onChange={e => setAiTitle(e.target.value)} />
          <select className="form-select" value={aiType} onChange={e => setAiType(e.target.value)}>
            <option value="">Select report type...</option>
            <option value="quarterly_review">Quarterly Review</option>
            <option value="annual_report">Annual Report</option>
            <option value="incident_report">Incident Report</option>
            <option value="risk_assessment">Risk Assessment</option>
            <option value="executive_summary">Executive Summary</option>
          </select>
          <select className="form-select" value={aiPeriod} onChange={e => setAiPeriod(e.target.value)}>
            <option value="">Select period...</option>
            <option value="Q1 2024">Q1 2024</option>
            <option value="Q2 2024">Q2 2024</option>
            <option value="Q3 2024">Q3 2024</option>
            <option value="Q4 2024">Q4 2024</option>
            <option value="2024 Annual">2024 Annual</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={aiLoading || !aiTitle}>
          {aiLoading ? <><span className="spinner" /> Generating...</> : 'Generate Report'}
        </button>
        {aiResult && <AIOutputDisplay data={aiResult.content || aiResult} />}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /> Loading...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Period</th><th>Status</th><th>AI Generated</th><th>Date</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No reports found.</td></tr> : items.map(item => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{item.title || '-'}</td>
                  <td>{item.report_type || '-'}</td>
                  <td>{item.period || '-'}</td>
                  <td><span className={`badge badge-${item.status === 'completed' ? 'success' : item.status === 'draft' ? 'warning' : 'info'}`}>{item.status}</span></td>
                  <td>{item.ai_generated ? 'Yes' : 'No'}</td>
                  <td>{item.generated_at ? new Date(item.generated_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selected || creating) && (
        <DetailModal
          title={creating ? 'Add Report' : showForm ? 'Edit Report' : 'Report Details'}
          onClose={() => { setSelected(null); setCreating(false); setEditing(false) }}
          footer={showForm ? (
            <><button className="btn btn-outline" onClick={() => creating ? setCreating(false) : setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
          ) : (
            <><button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button><button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button></>
          )}
        >
          {showForm ? (
            <div>
              <div className="form-group"><label>Title</label><input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Report Type</label><input className="form-input" value={form.reportType || form.report_type || ''} onChange={e => setForm({...form, reportType: e.target.value})} /></div>
                <div className="form-group"><label>Period</label><input className="form-input" value={form.period || ''} onChange={e => setForm({...form, period: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-select" value={form.status || 'draft'} onChange={e => setForm({...form, status: e.target.value})}><option value="draft">Draft</option><option value="completed">Completed</option><option value="archived">Archived</option></select>
              </div>
              <div className="form-group"><label>Content</label><textarea className="form-textarea" style={{minHeight:150}} value={form.content || ''} onChange={e => setForm({...form, content: e.target.value})} /></div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-field"><div className="detail-label">Title</div><div className="detail-value">{selected.title}</div></div>
                <div className="detail-field"><div className="detail-label">Type</div><div className="detail-value">{selected.report_type || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Period</div><div className="detail-value">{selected.period || '-'}</div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`badge badge-${selected.status === 'completed' ? 'success' : 'warning'}`}>{selected.status}</span></div></div>
              </div>
              {selected.content && (
                <div style={{marginTop:20}}>
                  <div className="section-title">Report Content</div>
                  <AIOutputDisplay data={selected.content} />
                </div>
              )}
            </div>
          )}
        </DetailModal>
      )}
    </div>
  )
}
