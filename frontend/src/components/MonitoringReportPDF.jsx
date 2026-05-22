import React, { useState } from 'react'

export default function MonitoringReportPDF() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function download() {
    setBusy(true)
    setMsg(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/custom-views/monitoring-report.pdf', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'brand-monitoring-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMsg('Report downloaded.')
    } catch (e) {
      setMsg('Failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="viz-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Monitoring Report (PDF)</h3>
      <p style={{ color: '#555', fontSize: 13 }}>
        Generates an executive PDF summarizing recent infringement detections, enforcement actions, watchlist coverage, and high-risk class/region hotspots.
      </p>
      <button
        onClick={download}
        disabled={busy}
        data-testid="download-pdf-btn"
        style={{
          background: '#2b6cb0',
          color: '#fff',
          border: 0,
          padding: '8px 16px',
          borderRadius: 4,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Generating...' : 'Download PDF Report'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>{msg}</div>}
    </div>
  )
}
