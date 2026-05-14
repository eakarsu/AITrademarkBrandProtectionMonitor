import React, { useState, useRef } from 'react'
import { clearToken } from '../api'

const BASE = '/api'
function getHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } }

export default function LogoAnalyzer() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
    setResult(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const res = await fetch(`${BASE}/logos/upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })
      if (res.status === 401) { clearToken(); window.location.href = '/login'; return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

  return (
    <div>
      <div className="page-header">
        <h2>Logo Analyzer</h2>
        <p className="page-header-sub">AI Vision — Upload a logo for trademark risk assessment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#6366f1' : '#333'}`,
              borderRadius: 12, padding: 48, textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Drop logo image here</div>
            <div style={{ color: '#888', fontSize: 13 }}>or click to browse — PNG, JPG, SVG up to 5MB</div>
          </div>

          {preview && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <img src={preview} alt="Logo preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #333' }} />
              <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>{file?.name}</div>
            </div>
          )}

          <button
            onClick={analyze}
            disabled={!file || loading}
            style={{
              width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 8, border: 'none', cursor: file && !loading ? 'pointer' : 'not-allowed',
              background: file && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#333',
              color: '#fff', fontSize: 15, fontWeight: 600,
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Logo with AI Vision'}
          </button>

          {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{error}</div>}
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: 64, color: '#555' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div>Upload a logo to get AI vision trademark analysis</div>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: 64, color: '#888' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <div>AI Vision is analyzing your logo...</div>
            </div>
          )}
          {result && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>AI Analysis Results</h3>
                {result.risk_level && (
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${riskColor[result.risk_level]}22`, color: riskColor[result.risk_level] }}>
                    {result.risk_level?.toUpperCase()} RISK
                  </span>
                )}
              </div>

              {result.similarity_assessment && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>SIMILARITY ASSESSMENT</div>
                  <div style={{ fontSize: 14, color: '#ddd' }}>{result.similarity_assessment}</div>
                </div>
              )}

              {result.design_elements?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>DESIGN ELEMENTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.design_elements.map((el, i) => (
                      <span key={i} style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{el}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.colors?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>COLOR PALETTE</div>
                  <div>{result.colors.join(', ')}</div>
                </div>
              )}

              {result.distinguishing_features?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>DISTINGUISHING FEATURES</div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {result.distinguishing_features.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#ccc', marginBottom: 3 }}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.trademark_strength && (
                <div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TRADEMARK STRENGTH</div>
                  <span style={{ fontWeight: 700, color: result.trademark_strength === 'strong' ? '#22c55e' : result.trademark_strength === 'weak' ? '#ef4444' : '#f59e0b' }}>
                    {result.trademark_strength?.toUpperCase()}
                  </span>
                </div>
              )}

              {result.response && !result.risk_level && (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#ccc' }}>{result.response}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
