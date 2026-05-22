import React, { useEffect, useState } from 'react'
import { api } from '../api'

function colorFor(intensity) {
  // 0 -> light blue, 100 -> deep red
  const t = Math.min(100, Math.max(0, intensity)) / 100
  const r = Math.round(70 + t * 180)
  const g = Math.round(160 - t * 130)
  const b = Math.round(220 - t * 180)
  return `rgb(${r},${g},${b})`
}

export default function ClassRegionHeatmap() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.get('/custom-views/class-region-heatmap')
      .then(setData)
      .catch(e => setErr(e.message))
  }, [])

  if (err) return <div style={{ color: '#c00' }}>Failed to load: {err}</div>
  if (!data) return <div>Loading heatmap...</div>

  return (
    <div className="viz-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Trademark Class × Region Risk Heatmap</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 6, textAlign: 'left' }}>Class \ Region</th>
              {data.regions.map(r => (
                <th key={r} style={{ padding: 6, textAlign: 'center' }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.classes.map(cls => (
              <tr key={cls}>
                <td style={{ padding: 6, fontWeight: 600 }}>{cls}</td>
                {data.regions.map(reg => {
                  const cell = data.cells.find(c => c.class === cls && c.region === reg)
                  return (
                    <td
                      key={reg}
                      style={{
                        padding: 0,
                        width: 50,
                        height: 36,
                        textAlign: 'center',
                        color: cell.intensity > 60 ? '#fff' : '#000',
                        background: colorFor(cell.intensity),
                        border: '1px solid #fff',
                      }}
                      title={`${cell.risk} risk - ${cell.count} incidents`}
                    >
                      {cell.count}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#555' }}>
        <strong>Top Hotspots:</strong>{' '}
        {data.hotspots.map(h => `${h.class.split(' - ')[0]} × ${h.region}`).join(', ')}
      </div>
    </div>
  )
}
