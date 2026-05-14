import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '../api'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: '\u2302', label: 'Dashboard' },
      { to: '/ai-hub', icon: '\uD83E\uDD16', label: 'AI Command Center' },
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/trademarks', icon: '\u2122', label: 'Trademarks' },
      { to: '/infringements', icon: '\u26A0', label: 'Infringements' },
      { to: '/domains', icon: '\uD83C\uDF10', label: 'Domains' },
      { to: '/social', icon: '\uD83D\uDCAC', label: 'Social Media' },
    ]
  },
  {
    label: 'Detection',
    items: [
      { to: '/counterfeits', icon: '\uD83D\uDEE1', label: 'Counterfeits' },
      { to: '/logos', icon: '\uD83C\uDFA8', label: 'Logo Similarity' },
      { to: '/marketplace', icon: '\uD83D\uDED2', label: 'Marketplace' },
    ]
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/cease-desist', icon: '\uD83D\uDCDC', label: 'C&D Generator' },
      { to: '/trademark-search', icon: '\uD83D\uDD0D', label: 'Trademark Search' },
      { to: '/sentiment', icon: '\uD83D\uDCCA', label: 'Sentiment Analysis' },
      { to: '/competitors', icon: '\uD83C\uDFC6', label: 'Competitor Analysis' },
      { to: '/logo-analyzer', icon: '\uD83D\uDCF8', label: 'Logo Analyzer' },
      { to: '/domain-watcher', icon: '\uD83D\uDD76', label: 'Domain Watcher' },
      { to: '/brand-health', icon: '\uD83D\uDCC8', label: 'Brand Health' },
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/legal', icon: '\u2696', label: 'Legal Cases' },
      { to: '/reports', icon: '\uD83D\uDCC4', label: 'Reports' },
      { to: '/alerts', icon: '\uD83D\uDD14', label: 'Alerts' },
      { to: '/audit', icon: '\uD83D\uDCCB', label: 'Audit Trail' },
    ]
  },
]

export default function Layout({ children }) {
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">AI</div>
          <div className="sidebar-title">
            <span>Trademark</span> &amp; Brand<br/>Protection Monitor
          </div>
        </div>
        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>&#x2192;</span> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
