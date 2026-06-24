import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Layout({ children }) {
  const [stats, setStats] = useState(null)
  const location = useLocation()

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
  }, [location.pathname]) // refresh badge on nav

  const navLink = (to, icon, label, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>{label}
    </NavLink>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🏥</div>
            <div>
              <div className="logo-text">MedCare</div>
              <div className="logo-sub">Discharge Care Plans</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navLink('/', '📊', 'Dashboard', true)}
          {navLink('/cases/new', '➕', 'New Case')}
          {navLink('/healthscribe', '🎙️', 'HealthScribe')}

          <NavLink to="/review" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">⚠️</span>
            Review Queue
            {stats?.review_required > 0 && (
              <span className="nav-badge">{stats.review_required}</span>
            )}
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: 16 }}>Resources</div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="nav-item">
            <span className="nav-icon">📚</span> API Docs
          </a>
          <a href="http://localhost:8000/api/kb/diseases" target="_blank" rel="noopener noreferrer" className="nav-item">
            <span className="nav-icon">🧬</span> Disease KG
          </a>
        </nav>

        <div className="sidebar-footer">
          {stats && (
            <div style={{ marginBottom: 10 }}>
              <div className="label-info" style={{ marginBottom: 6 }}>
                <span>📋</span> {stats.total_cases} cases · {stats.total_patients} patients
              </div>
              <div className="label-info">
                <span>🚩</span> {stats.flags_pending} flags pending
              </div>
            </div>
          )}
          <div className="sidebar-version">MedCare Prototype v1.0</div>
          <div className="sidebar-version" style={{ marginTop: 3, color: 'var(--text-muted)' }}>
            Dummy Knowledge Base
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}
