import React from 'react'

function getRiskClass(level) {
  if (!level) return 'risk-medium'
  const l = String(level).toLowerCase()
  if (l === 'critical' || l === 'very high') return 'risk-critical'
  if (l === 'high') return 'risk-high'
  if (l === 'medium' || l === 'moderate') return 'risk-medium'
  return 'risk-low'
}

function getScoreColor(score) {
  const n = parseFloat(score)
  if (isNaN(n)) return 'var(--primary)'
  if (n >= 80) return 'var(--danger)'
  if (n >= 60) return 'var(--warning)'
  if (n >= 40) return 'var(--info)'
  return 'var(--success)'
}

function parseAIText(text) {
  if (!text) return null
  const lines = String(text).split('\n')
  const sections = []
  let currentSection = { title: null, items: [] }

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (/^#{1,3}\s/.test(trimmed) || /^[A-Z][A-Z\s&]{3,}:?\s*$/.test(trimmed)) {
      if (currentSection.items.length > 0 || currentSection.title) {
        sections.push({ ...currentSection })
      }
      currentSection = { title: trimmed.replace(/^#+\s*/, '').replace(/:$/, ''), items: [] }
    } else if (/^[-*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      currentSection.items.push({ type: 'bullet', text: trimmed.replace(/^[-*\d.)]+\s*/, '') })
    } else if (/^>/.test(trimmed)) {
      currentSection.items.push({ type: 'highlight', text: trimmed.replace(/^>\s*/, '') })
    } else if (trimmed.includes(':') && trimmed.split(':')[0].length < 40) {
      const [key, ...rest] = trimmed.split(':')
      currentSection.items.push({ type: 'kv', key: key.trim(), value: rest.join(':').trim() })
    } else {
      currentSection.items.push({ type: 'text', text: trimmed })
    }
  })

  if (currentSection.items.length > 0 || currentSection.title) {
    sections.push(currentSection)
  }

  return sections
}

function renderObject(obj, depth = 0) {
  if (obj === null || obj === undefined) return <span className="text-muted">N/A</span>
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return <span>{String(obj)}</span>
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return <span className="text-muted">None</span>
    if (typeof obj[0] === 'string' || typeof obj[0] === 'number') {
      return (
        <ul className="ai-list">
          {obj.map((item, i) => <li key={i}>{String(item)}</li>)}
        </ul>
      )
    }
    return obj.map((item, i) => (
      <div key={i} style={{ marginBottom: 8 }}>{renderObject(item, depth + 1)}</div>
    ))
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (depth === 0 && entries.length > 2) {
      return (
        <div className="ai-kv-grid">
          {entries.map(([k, v]) => {
            const isComplex = typeof v === 'object' && v !== null
            if (isComplex) return null
            return (
              <div className="ai-kv-item" key={k}>
                <div className="ai-kv-label">{formatKey(k)}</div>
                <div className="ai-kv-value">{renderValue(k, v)}</div>
              </div>
            )
          })}
          {entries.filter(([, v]) => typeof v === 'object' && v !== null).map(([k, v]) => (
            <div key={k} style={{ gridColumn: '1 / -1' }}>
              <div className="ai-section">
                <div className="ai-section-title">{formatKey(k)}</div>
                {renderObject(v, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      )
    }
    return (
      <div>
        {entries.map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{formatKey(k)}: </span>
            {typeof v === 'object' ? renderObject(v, depth + 1) : <span>{renderValue(k, v)}</span>}
          </div>
        ))}
      </div>
    )
  }
  return <span>{String(obj)}</span>
}

function formatKey(key) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

function renderValue(key, val) {
  const k = String(key).toLowerCase()
  const v = String(val)
  if (k.includes('score') || k.includes('similarity') || k.includes('confidence')) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      return (
        <span>
          <strong>{v}{!v.includes('%') && n <= 100 ? '%' : ''}</strong>
          <div className="ai-score-bar">
            <div className="ai-score-fill" style={{ width: `${Math.min(n, 100)}%`, background: getScoreColor(n) }} />
          </div>
        </span>
      )
    }
  }
  if (k.includes('risk') || k.includes('threat') || k.includes('severity')) {
    const cls = getRiskClass(v)
    return <span className={`risk-indicator ${cls}`}><span className="risk-dot" />{v}</span>
  }
  return v
}

export default function AIOutputDisplay({ data }) {
  if (!data) return null

  if (typeof data === 'string') {
    const sections = parseAIText(data)
    if (!sections || sections.length === 0) {
      return <div className="ai-output"><div className="ai-text">{data}</div></div>
    }
    return (
      <div className="ai-output">
        {sections.map((section, i) => (
          <div className="ai-section" key={i}>
            {section.title && <div className="ai-section-title">{section.title}</div>}
            {section.items.map((item, j) => {
              if (item.type === 'bullet') return <ul className="ai-list" key={j}><li>{item.text}</li></ul>
              if (item.type === 'highlight') return <div className="ai-highlight" key={j}>{item.text}</div>
              if (item.type === 'kv') return (
                <div key={j} style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{item.key}: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              )
              return <div className="ai-text" key={j}>{item.text}</div>
            })}
          </div>
        ))}
      </div>
    )
  }

  if (typeof data === 'object') {
    return (
      <div className="ai-output">
        {renderObject(data)}
      </div>
    )
  }

  return <div className="ai-output"><div className="ai-text">{String(data)}</div></div>
}
