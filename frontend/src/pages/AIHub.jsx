import React, { useState } from 'react'
import { api } from '../api'
import AIOutputDisplay from '../components/AIOutputDisplay'

const aiTools = [
  { id: 'chat', icon: '\uD83E\uDD16', title: 'AI Brand Assistant', desc: 'Ask any brand protection question', endpoint: '/ai/chat', fields: [{ key: 'message', label: 'Your question', type: 'textarea', placeholder: 'Ask about trademark law, brand protection strategies, enforcement options...' }] },
  { id: 'health', icon: '\uD83D\uDC9A', title: 'Brand Health Check', desc: 'Comprehensive brand health assessment', endpoint: '/ai/brand-health', fields: [{ key: 'brandName', label: 'Brand Name', placeholder: 'Enter brand name...' }, { key: 'industry', label: 'Industry', placeholder: 'e.g., Technology, Fashion, Food...' }] },
  { id: 'risk', icon: '\u26A0\uFE0F', title: 'AI Risk Scanner', desc: 'Scan all threat vectors for a brand', endpoint: '/ai/risk-scan', fields: [{ key: 'brandName', label: 'Brand Name', placeholder: 'Enter brand name...' }, { key: 'scanType', label: 'Scan Type', type: 'select', options: ['comprehensive', 'domain', 'social_media', 'counterfeit', 'legal'] }] },
  { id: 'enforce', icon: '\uD83D\uDEE1\uFE0F', title: 'Enforcement Advisor', desc: 'Get enforcement strategy for violations', endpoint: '/ai/enforcement', fields: [{ key: 'violationType', label: 'Violation Type', type: 'select', options: ['counterfeiting', 'domain_squatting', 'brand_impersonation', 'unauthorized_use', 'copyright_violation'] }, { key: 'platform', label: 'Platform', placeholder: 'e.g., Amazon, Facebook, website...' }, { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the violation...' }] },
  { id: 'infringement', icon: '\uD83D\uDD0D', title: 'Infringement Analyzer', desc: 'Analyze URL for infringement', endpoint: '/infringements/analyze', fields: [{ key: 'url', label: 'URL to Analyze', placeholder: 'https://...' }, { key: 'description', label: 'Description', placeholder: 'Optional context...' }] },
  { id: 'domain', icon: '\uD83C\uDF10', title: 'Domain Scanner', desc: 'Scan for typosquatting domains', endpoint: '/domains/scan', fields: [{ key: 'domain', label: 'Domain Name', placeholder: 'yourbrand.com' }] },
  { id: 'counterfeit', icon: '\uD83D\uDEAB', title: 'Counterfeit Detector', desc: 'Analyze product for counterfeit risk', endpoint: '/counterfeits/detect', fields: [{ key: 'productUrl', label: 'Product URL', placeholder: 'https://...' }, { key: 'details', label: 'Details', placeholder: 'Product details...' }] },
  { id: 'ceasedesist', icon: '\uD83D\uDCDC', title: 'C&D Letter Generator', desc: 'Generate cease & desist letters', endpoint: '/cease-desist/generate', fields: [{ key: 'recipientName', label: 'Recipient', placeholder: 'Recipient name...' }, { key: 'trademark', label: 'Trademark', placeholder: 'Trademark being infringed...' }, { key: 'infringementType', label: 'Type', type: 'select', options: ['counterfeiting', 'domain_squatting', 'brand_impersonation', 'unauthorized_use'] }] },
  { id: 'search', icon: '\u2122\uFE0F', title: 'Trademark Search', desc: 'Search for trademark conflicts', endpoint: '/trademark-searches/search', fields: [{ key: 'searchTerm', label: 'Search Term', placeholder: 'Trademark to search...' }, { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: ['Global', 'US', 'EU', 'UK', 'CN', 'JP'] }] },
  { id: 'sentiment', icon: '\uD83D\uDCCA', title: 'Sentiment Analyzer', desc: 'Analyze brand sentiment', endpoint: '/sentiment/analyze', fields: [{ key: 'brandName', label: 'Brand', placeholder: 'Brand name...' }, { key: 'source', label: 'Source', type: 'select', options: ['All platforms', 'Twitter', 'Reddit', 'News', 'Reviews'] }] },
  { id: 'competitor', icon: '\uD83C\uDFC6', title: 'Competitor Analyzer', desc: 'Analyze competitor brand strategy', endpoint: '/competitors/analyze', fields: [{ key: 'name', label: 'Competitor', placeholder: 'Competitor name...' }, { key: 'website', label: 'Website', placeholder: 'https://...' }] },
  { id: 'logo', icon: '\uD83C\uDFA8', title: 'Logo Similarity', desc: 'Compare logos for similarity', endpoint: '/logos/analyze', fields: [{ key: 'originalBrand', label: 'Your Brand', placeholder: 'Your brand...' }, { key: 'comparedBrand', label: 'Compare To', placeholder: 'Brand to compare...' }] },
  { id: 'report', icon: '\uD83D\uDCC4', title: 'Report Generator', desc: 'Generate brand protection reports', endpoint: '/reports/generate', fields: [{ key: 'title', label: 'Report Title', placeholder: 'Report title...' }, { key: 'reportType', label: 'Type', type: 'select', options: ['quarterly_review', 'annual_report', 'incident_report', 'risk_assessment', 'executive_summary'] }, { key: 'period', label: 'Period', placeholder: 'e.g., Q1 2024' }] },
  { id: 'legal', icon: '\u2696\uFE0F', title: 'Legal Strategy', desc: 'Get AI legal strategy advice', endpoint: '/legal-cases/strategy', fields: [{ key: 'title', label: 'Case Title', placeholder: 'Case title...' }, { key: 'defendant', label: 'Defendant', placeholder: 'Defendant...' }, { key: 'caseType', label: 'Type', type: 'select', options: ['infringement', 'counterfeiting', 'dilution', 'cybersquatting'] }] },
  { id: 'triage', icon: '\uD83D\uDD14', title: 'Alert Triage', desc: 'AI-powered alert prioritization', endpoint: '/alerts/triage', fields: [{ key: 'title', label: 'Alert', placeholder: 'Alert title...' }, { key: 'alertType', label: 'Type', type: 'select', options: ['infringement', 'domain', 'counterfeit', 'social_media', 'legal', 'marketplace'] }, { key: 'message', label: 'Details', type: 'textarea', placeholder: 'Alert details...' }] },
  { id: 'assess', icon: '\uD83D\uDCDD', title: 'Trademark Assessment', desc: 'Assess trademark strength & risk', endpoint: '/trademarks/assess', fields: [{ key: 'name', label: 'Trademark', placeholder: 'Trademark name...' }, { key: 'jurisdiction', label: 'Jurisdiction', placeholder: 'e.g., US, EU, Global...' }, { key: 'niceClass', label: 'Nice Class', placeholder: 'e.g., Class 9, Class 25...' }] },
  { id: 'social', icon: '\uD83D\uDCAC', title: 'Social Threat Analysis', desc: 'Analyze social media threats', endpoint: '/social-mentions/analyze', fields: [{ key: 'brandName', label: 'Brand', placeholder: 'Brand name...' }, { key: 'platform', label: 'Platform', type: 'select', options: ['Twitter/X', 'Facebook', 'Instagram', 'TikTok', 'Reddit', 'YouTube'] }, { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Paste content to analyze...' }] },
  { id: 'marketplace', icon: '\uD83D\uDED2', title: 'Marketplace Analyzer', desc: 'Analyze marketplace listings', endpoint: '/marketplace/analyze', fields: [{ key: 'productTitle', label: 'Product', placeholder: 'Product title...' }, { key: 'seller', label: 'Seller', placeholder: 'Seller name...' }, { key: 'marketplace', label: 'Marketplace', type: 'select', options: ['Amazon', 'eBay', 'AliExpress', 'Alibaba', 'Wish'] }] },
  { id: 'audit', icon: '\uD83D\uDCCB', title: 'Audit Analyzer', desc: 'Analyze audit trail patterns', endpoint: '/audit-logs/analyze', fields: [{ key: 'period', label: 'Period', type: 'select', options: ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'All time'] }, { key: 'focusArea', label: 'Focus', type: 'select', options: ['Security', 'Compliance', 'User Behavior', 'Anomalies'] }] },
]

const sampleData = {
  chat: [
    { label: 'Trademark Law', message: 'What are the key differences between trademark infringement and trademark dilution? How should a brand owner decide which claim to pursue?' },
    { label: 'Brand Protection', message: 'What are the most effective strategies for protecting a brand against counterfeiting on e-commerce platforms like Amazon and AliExpress?' },
    { label: 'Domain Disputes', message: 'How does the UDRP process work for recovering cybersquatted domain names? What evidence is needed to win a case?' },
  ],
  health: [
    { label: 'NovaTech', brandName: 'NovaTech', industry: 'Technology' },
    { label: 'AquaPure', brandName: 'AquaPure', industry: 'Beverages' },
    { label: 'LuxeVault', brandName: 'LuxeVault', industry: 'Luxury Goods' },
  ],
  risk: [
    { label: 'NovaTech Full', brandName: 'NovaTech', scanType: 'comprehensive' },
    { label: 'LuxeVault Domains', brandName: 'LuxeVault', scanType: 'domain' },
    { label: 'VeloCity Counterfeit', brandName: 'VeloCity Bikes', scanType: 'counterfeit' },
  ],
  enforce: [
    { label: 'Amazon Counterfeit', violationType: 'counterfeiting', platform: 'Amazon', description: 'Seller BestWaterDeals selling counterfeit AquaPure water bottles, 890 units sold at 40% below retail price' },
    { label: 'Domain Squatting', violationType: 'domain_squatting', platform: 'GoDaddy', description: 'luxevaultt.com registered as phishing site with 95% visual similarity to legitimate LuxeVault.com' },
    { label: 'TikTok Impersonation', violationType: 'brand_impersonation', platform: 'TikTok', description: 'Account @fakesoundwave with 45K followers promoting knockoff SoundWave headphones' },
  ],
  infringement: [
    { label: 'NovaTek Domain', url: 'https://novatek-solutions.com', description: 'Typosquatting domain selling fake NovaTech software licenses' },
    { label: 'LuxeVault Phishing', url: 'https://luxevaultt.com', description: 'Phishing site with 95% similarity stealing customer credentials' },
    { label: 'Fake TikTok', url: 'https://tiktok.com/@fakesoundwave', description: '45K follower account promoting knockoff products' },
  ],
  domain: [
    { label: 'NovaTech', domain: 'novatech.com' },
    { label: 'LuxeVault', domain: 'luxevault.com' },
    { label: 'MediCare Plus', domain: 'medicare-plus.com' },
  ],
  counterfeit: [
    { label: 'AquaPure Amazon', productUrl: 'https://amazon.com/dp/B0FAKE001', details: 'AquaPure water bottles by BestWaterDeals, 890 units at 40% below retail' },
    { label: 'VeloCity AliExpress', productUrl: 'https://aliexpress.com/item/VeloCity-eBike', details: 'VeloCity E-Bike knockoffs, fire hazard battery, 156 units sold' },
    { label: 'SoundWave Amazon', productUrl: 'https://amazon.com/dp/B0FAKE002', details: 'Fake SoundWave Pro headphones by AudioDeals_Store, 2,100+ units' },
  ],
  ceasedesist: [
    { label: 'NovaTek Domain', recipientName: 'Domain Registrant - novatek-solutions.com', trademark: 'NovaTech', infringementType: 'domain_squatting' },
    { label: 'VeloCity Counterfeit', recipientName: 'ShenZhen_eBikes Trading', trademark: 'VeloCity Bikes', infringementType: 'counterfeiting' },
    { label: 'SoundWave Amazon', recipientName: 'AudioDeals_Store', trademark: 'SoundWave Audio', infringementType: 'counterfeiting' },
  ],
  search: [
    { label: 'NovaTech US', searchTerm: 'NovaTech', jurisdiction: 'US' },
    { label: 'GreenLeaf EU', searchTerm: 'GreenLeaf', jurisdiction: 'EU' },
    { label: 'SolarFlare Global', searchTerm: 'SolarFlare', jurisdiction: 'Global' },
  ],
  sentiment: [
    { label: 'NovaTech Twitter', brandName: 'NovaTech', source: 'Twitter' },
    { label: 'FrostByte Reddit', brandName: 'FrostByte Gaming', source: 'Reddit' },
    { label: 'Botanica All', brandName: 'Botanica Wellness', source: 'All platforms' },
  ],
  competitor: [
    { label: 'DataSphere', name: 'DataSphere Analytics', website: 'https://datasphere.io' },
    { label: 'CanvasFlow', name: 'CanvasFlow Studio', website: 'https://canvasflow.design' },
    { label: 'HealthBridge', name: 'HealthBridge Digital', website: 'https://healthbridge.com' },
  ],
  logo: [
    { label: 'NovaTech vs NovaTeq', originalBrand: 'NovaTech', comparedBrand: 'NovaTeq Systems' },
    { label: 'GreenLeaf vs Organic', originalBrand: 'GreenLeaf Organics', comparedBrand: 'OrganicHarvest Foods' },
    { label: 'Peak vs Apex', originalBrand: 'PeakPerformance', comparedBrand: 'ApexFit Apparel' },
  ],
  report: [
    { label: 'Q1 Review', title: 'Q1 2024 Brand Protection Summary', reportType: 'quarterly_review', period: 'Q1 2024' },
    { label: 'Incident Report', title: 'Critical Counterfeit Incident Report', reportType: 'incident_report', period: 'Q2 2024' },
    { label: 'Annual Risk', title: 'Annual Brand Risk Assessment 2024', reportType: 'risk_assessment', period: '2024 Annual' },
  ],
  legal: [
    { label: 'NovaTech Case', title: 'NovaTech vs NovaTeq Systems', defendant: 'NovaTeq Systems LLC', caseType: 'infringement' },
    { label: 'VeloCity Case', title: 'VeloCity vs ShenZhen eBikes', defendant: 'ShenZhen eBikes Trading Co.', caseType: 'counterfeiting' },
    { label: 'LuxeVault Case', title: 'LuxeVault vs Domain Squatter', defendant: 'Unknown Registrant', caseType: 'cybersquatting' },
  ],
  triage: [
    { label: 'Phishing Alert', title: 'Critical: LuxeVault phishing site detected', alertType: 'domain', message: 'luxevaultt.com registered with 95% similarity, serving phishing content' },
    { label: 'Counterfeit Alert', title: 'VeloCity e-bike counterfeits on AliExpress', alertType: 'counterfeit', message: '156 units of fake e-bikes with fire hazard batteries sold' },
    { label: 'Social Alert', title: 'Fake SoundWave TikTok account', alertType: 'social_media', message: 'Account with 45K followers promoting knockoff headphones' },
  ],
  assess: [
    { label: 'NovaTech', name: 'NovaTech', jurisdiction: 'US', niceClass: 'Class 9' },
    { label: 'GreenLeaf', name: 'GreenLeaf Organics', jurisdiction: 'EU', niceClass: 'Class 29' },
    { label: 'MediCare Plus', name: 'MediCare Plus', jurisdiction: 'US', niceClass: 'Class 44' },
  ],
  social: [
    { label: 'NovaTech Twitter', brandName: 'NovaTech', platform: 'Twitter/X', content: 'Found fake @NovaTech account promoting scam software deals with 15K followers' },
    { label: 'LuxeVault TikTok', brandName: 'LuxeVault', platform: 'TikTok', content: 'Multiple accounts selling replica LuxeVault jewelry claiming authentic' },
    { label: 'AquaPure Instagram', brandName: 'AquaPure', platform: 'Instagram', content: 'Influencer promoting counterfeit AquaPure bottles at half price' },
  ],
  marketplace: [
    { label: 'NovaTech Amazon', productTitle: 'NovaTech Pro Enterprise License', seller: 'SoftwareDeals_2024', marketplace: 'Amazon' },
    { label: 'VeloCity AliExpress', productTitle: 'VeloCity Electric Bike 500W', seller: 'ShenZhen_eBikes', marketplace: 'AliExpress' },
    { label: 'SoundWave eBay', productTitle: 'SoundWave Pro X Headphones', seller: 'AudioDeals_Store', marketplace: 'eBay' },
  ],
  audit: [
    { label: 'Security 24h', period: 'Last 24 hours', focusArea: 'Security' },
    { label: 'Anomalies 7d', period: 'Last 7 days', focusArea: 'Anomalies' },
    { label: 'Compliance 30d', period: 'Last 30 days', focusArea: 'Compliance' },
  ],
}

export default function AIHub() {
  const [activeTool, setActiveTool] = useState(null)
  const [formData, setFormData] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function selectTool(tool) {
    setActiveTool(tool)
    setFormData({})
    setResult(null)
  }

  async function handleSubmit() {
    if (!activeTool) return
    setLoading(true); setResult(null)
    try {
      const r = await api.post(activeTool.endpoint, formData)
      setResult(r.response || r.ai_analysis || r.letter_content || r.content || r)
    } catch (e) { setResult({ error: e.message }) }
    setLoading(false)
  }

  const hasRequiredFields = activeTool && activeTool.fields.some(f => formData[f.key])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{'\uD83E\uDD16'} AI Command Center</h1>
          <p>All AI-powered brand protection tools in one place</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeTool ? '320px 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: activeTool ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {aiTools.map(tool => (
              <div
                key={tool.id}
                className={`card card-clickable`}
                style={{
                  padding: activeTool ? '12px 16px' : '20px',
                  cursor: 'pointer',
                  borderColor: activeTool?.id === tool.id ? 'var(--primary)' : undefined,
                  background: activeTool?.id === tool.id ? 'rgba(99,102,241,0.08)' : undefined,
                }}
                onClick={() => selectTool(tool)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: activeTool ? 18 : 24 }}>{tool.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: activeTool ? 13 : 15 }}>{tool.title}</div>
                    {!activeTool && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{tool.desc}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeTool && (
          <div>
            <div className="ai-panel" style={{ marginBottom: 0 }}>
              <div className="ai-panel-header">
                <span>AI</span>
                <h3>{activeTool.icon} {activeTool.title}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{activeTool.desc}</p>
              {sampleData[activeTool.id] && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {sampleData[activeTool.id].map((sample, si) => (
                    <button key={si} type="button" className="btn btn-outline btn-sm" onClick={() => {
                      const newData = {}; activeTool.fields.forEach(f => { if (sample[f.key] !== undefined) newData[f.key] = sample[f.key]; }); setFormData(newData);
                    }}>{sample.label}</button>
                  ))}
                </div>
              )}
              <div className="ai-panel-inputs" style={{ flexDirection: 'column' }}>
                {activeTool.fields.map(field => (
                  <div key={field.key} style={{ width: '100%' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        placeholder={field.placeholder || ''}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        style={{ minHeight: 80 }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="form-select"
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {field.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        placeholder={field.placeholder || ''}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !hasRequiredFields}>
                  {loading ? <><span className="spinner" /> Processing...</> : `Run ${activeTool.title}`}
                </button>
                <button className="btn btn-outline" onClick={() => { setActiveTool(null); setResult(null); setFormData({}) }}>
                  Back to All Tools
                </button>
              </div>
              {result && (
                <div style={{ marginTop: 20 }}>
                  <AIOutputDisplay data={result} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
