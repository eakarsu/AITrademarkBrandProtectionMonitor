import React, { useEffect, useState } from 'react'
import { api } from '../api'

const CHANNELS = ['amazon', 'ebay', 'instagram', 'tiktok', 'domain', 'twitter', 'web']
const SEVERITIES = ['low', 'medium', 'high']
const ACTIONS = ['alert', 'manual-review', 'auto-takedown', 'auto-cease-desist']

export default function WatchlistRulesEditor() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, enabled: 0, channels: [] })
  const [form, setForm] = useState({ keyword: '', channel: 'amazon', severity: 'medium', action: 'alert', enabled: true })
  const [editingId, setEditingId] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const d = await api.get('/custom-views/watchlist')
      setItems(d.items || [])
      setMeta({ total: d.total, enabled: d.enabled, channels: d.channels })
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => { load() }, [])

  function reset() {
    setForm({ keyword: '', channel: 'amazon', severity: 'medium', action: 'alert', enabled: true })
    setEditingId(null)
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.keyword.trim()) return
    setBusy(true)
    try {
      if (editingId) {
        await api.put(`/custom-views/watchlist/${editingId}`, form)
      } else {
        await api.post('/custom-views/watchlist', form)
      }
      reset()
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this rule?')) return
    await api.del(`/custom-views/watchlist/${id}`)
    await load()
  }

  function edit(item) {
    setEditingId(item.id)
    setForm({ keyword: item.keyword, channel: item.channel, severity: item.severity, action: item.action, enabled: item.enabled })
  }

  async function toggle(item) {
    await api.put(`/custom-views/watchlist/${item.id}`, { enabled: !item.enabled })
    await load()
  }

  return (
    <div className="viz-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Watchlist & Enforcement Rules</h3>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>
        {meta.total} rules · {meta.enabled} enabled · channels: {meta.channels.join(', ')}
      </div>
      {err && <div style={{ color: '#c00', fontSize: 12 }}>{err}</div>}

      <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          data-testid="rule-keyword"
          placeholder="Keyword (brand / variant)"
          value={form.keyword}
          onChange={e => setForm({ ...form, keyword: e.target.value })}
          style={{ padding: 6, flex: '1 1 180px' }}
        />
        <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
          {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> enabled
        </label>
        <button type="submit" disabled={busy} data-testid="rule-submit" style={{ background: '#2f855a', color: '#fff', border: 0, padding: '6px 12px', borderRadius: 4 }}>
          {editingId ? 'Update' : 'Add Rule'}
        </button>
        {editingId && <button type="button" onClick={reset}>Cancel</button>}
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f7fafc' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>Keyword</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Channel</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Severity</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Status</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Operations</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} style={{ borderTop: '1px solid #edf2f7' }}>
              <td style={{ padding: 6, fontWeight: 600 }}>{it.keyword}</td>
              <td style={{ padding: 6 }}>{it.channel}</td>
              <td style={{ padding: 6 }}>{it.severity}</td>
              <td style={{ padding: 6 }}>{it.action}</td>
              <td style={{ padding: 6 }}>
                <button onClick={() => toggle(it)} style={{ background: it.enabled ? '#38a169' : '#a0aec0', color: '#fff', border: 0, padding: '2px 8px', borderRadius: 3, fontSize: 11 }}>
                  {it.enabled ? 'ON' : 'OFF'}
                </button>
              </td>
              <td style={{ padding: 6, textAlign: 'right' }}>
                <button onClick={() => edit(it)} style={{ marginRight: 6 }}>Edit</button>
                <button onClick={() => remove(it.id)} style={{ color: '#c00' }}>Delete</button>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr><td colSpan={6} style={{ padding: 10, color: '#888' }}>No rules yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
