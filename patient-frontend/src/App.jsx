import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom'
import { api } from './api/client.js'
import {
  getLevel,
  generateDailyTasks,
  completeTaskInState,
  logVitalsInState,
  getMotivationalMessage,
  getTodayCompliance,
  getWeeklyHistory,
  BADGES,
  TASK_CATEGORIES
} from './patient/gamification.js'

// ── Patient Selection Component (Home Route "/") ────────────────────────────
function PatientSelector() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getPatients()
      .then(setPatients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner"></span>
        <p>Loading recovery companions...</p>
      </div>
    )
  }

  return (
    <div className="select-patient-container">
      <div className="select-title">🌱 MedCare Companion</div>
      <div className="select-sub">Select your patient profile to access your personalized recovery portal</div>
      
      {error && <div style={{ color: 'var(--red)', marginBottom: 16 }}>⚠️ {error}</div>}
      
      <div className="patient-picker-list">
        {patients.map(p => (
          <Link key={p.id} to={`/patient/${p.id}`} className="patient-picker-btn">
            <div>
              <div style={{ textAlign: 'left', fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2, textAlign: 'left' }}>
                {p.age}y · {p.sex} · ID: {p.id}
              </div>
            </div>
            <span className="picker-arrow">Enter Portal →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Patient Dashboard Component (Route "/patient/:patientId") ───────────────
function PatientDashboard() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('checklist') // checklist, diet, exercise, meds, redflags
  
  // Data loading states
  const [plan, setPlan] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Vitals form input states
  const [bp, setBp] = useState('')
  const [glucose, setGlucose] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [vitalsMsg, setVitalsMsg] = useState('')

  // Load patient plan + gamification state on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getPlan(patientId).catch(err => {
        // If 404 care plan not found, still return null plan so we show the "pending" state
        if (err.message.includes('404')) return null;
        throw err;
      }),
      api.getGamification(patientId)
    ])
      .then(([planData, gameData]) => {
        setPlan(planData)
        setGameState(gameData)
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [patientId])

  // Sync state to backend
  const syncState = async (updatedState) => {
    setSyncing(true)
    try {
      const saved = await api.saveGamification(patientId, updatedState)
      setGameState(saved)
    } catch (e) {
      console.warn("Failed to sync state to server", e)
    } finally {
      setSyncing(false)
    }
  }

  // Handle task complete/incomplete toggling
  const handleTaskToggle = async (taskId, xpReward, totalTasksCount) => {
    if (!gameState) return
    const nextState = completeTaskInState(gameState, taskId, xpReward, totalTasksCount)
    setGameState(nextState) // instant UI update
    await syncState(nextState)
  }

  // Handle vitals submit
  const handleVitalsSubmit = async (e) => {
    e.preventDefault()
    if (!bp && !glucose && !weight) return

    setVitalsMsg('Logging vitals...')
    const nextState = logVitalsInState(gameState, { bp, glucose, weight, notes })
    
    setGameState(nextState)
    await syncState(nextState)

    // Clear form
    setBp('')
    setGlucose('')
    setWeight('')
    setNotes('')
    setVitalsMsg('✅ Vitals logged and synced successfully!')
    setTimeout(() => setVitalsMsg(''), 4000)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner"></span>
        <p>Syncing health records...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-content" style={{ textAlign: 'center', marginTop: 100 }}>
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', borderColor: 'var(--red)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <h3>Failed to Load Portal</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>{error}</p>
          <button className="btn" onClick={() => navigate('/')}>Return to Selection</button>
        </div>
      </div>
    )
  }

  // If care plan does not exist or is not approved yet
  if (!plan) {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-icon">🏥</span>
            <div>
              <div className="logo-title">MedCare</div>
              <div className="logo-sub">Recovery Portal</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>← Exit Portal</button>
        </aside>
        <main className="main-content">
          <div className="card no-plan-alert" style={{ textAlign: 'center', marginTop: 60 }}>
            <div className="no-plan-icon">⏳</div>
            <h2>Discharge Plan Pending Review</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px', lineHeight: 1.6, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Your clinical team is currently building and reviewing your customized home recovery dashboard. Please check back shortly!
            </p>
            <button className="btn" onClick={() => window.location.reload()}>🔄 Check Plan Status</button>
          </div>
        </main>
      </div>
    )
  }

  const pData = plan.plan_data
  const tasks = generateDailyTasks(pData)
  const todayDone = gameState ? (gameState.task_log[new Date().toISOString().split('T')[0]] || {}) : {}
  const doneCount = Object.values(todayDone).filter(Boolean).length
  const pctDone = getTodayCompliance(gameState, tasks.length)
  const lvlInfo = getLevel(gameState ? gameState.xp : 0)
  const weeklyHistory = getWeeklyHistory(gameState, tasks.length)
  const motivation = getMotivationalMessage(pctDone, gameState ? gameState.streak : 0)

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🌱</span>
          <div>
            <div className="logo-title">MedCare</div>
            <div className="logo-sub">Patient Companion</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Recovery Home</div>
          <button className={`nav-item ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
            <span className="nav-icon">📊</span> Recovery Hub
          </button>

          <div className="nav-section-label">Your Care Plan</div>
          <button className={`nav-item ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => setActiveTab('diet')}>
            <span className="nav-icon">🥗</span> Diet Plan
          </button>
          <button className={`nav-item ${activeTab === 'exercise' ? 'active' : ''}`} onClick={() => setActiveTab('exercise')}>
            <span className="nav-icon">🏃</span> Exercise Guide
          </button>
          <button className={`nav-item ${activeTab === 'meds' ? 'active' : ''}`} onClick={() => setActiveTab('meds')}>
            <span className="nav-icon">💊</span> Medications
          </button>
          <button className={`nav-item ${activeTab === 'redflags' ? 'active' : ''}`} onClick={() => setActiveTab('redflags')}>
            <span className="nav-icon">🚨</span> Emergency Guide
          </button>
        </nav>

        {/* Selected Patient details inside sidebar */}
        <div className="patient-profile-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <div className="profile-name">{plan.patient_name}</div>
            <div className="profile-meta">{plan.patient_age}y · {plan.patient_sex}</div>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', fontSize: '0.68rem', cursor: 'pointer', textAlign: 'left', marginTop: 4 }}
            >
              Switch Profile
            </button>
          </div>
        </div>
      </aside>

      {/* Main Companion Dashboard */}
      <main className="main-content">
        {/* Header */}
        <div className="header">
          <div>
            <h1 className="header-title">Welcome Back, {plan.patient_name}!</h1>
            <div className="header-sub">Diagnoses: {pData.primary_diagnoses?.join(' · ')}</div>
          </div>
          <div>
            {syncing ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>☁️ Auto-syncing...</span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--green)' }}>✓ All data synced</span>
            )}
          </div>
        </div>

        {/* Tab 1: Recovery Dashboard */}
        {activeTab === 'checklist' && (
          <>
            {/* Gamification Banner */}
            <div className="hero-banner">
              <div className="hero-level-sec">
                <div className="level-badge-large">{lvlInfo.icon}</div>
                <div>
                  <div className="level-title">Level {lvlInfo.level}</div>
                  <div className="level-name">{lvlInfo.name}</div>
                </div>
              </div>

              <div className="hero-progress-sec">
                <div className="progress-header">
                  <span className="xp-label">XP Progress</span>
                  <span className="xp-value">{gameState?.xp} / {lvlInfo.next ? lvlInfo.next.minXP : gameState?.xp} XP</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${lvlInfo.progress}%` }}></div>
                </div>
                <div className="progress-footer">
                  {lvlInfo.next ? `${lvlInfo.xpToNext} XP needed to reach next level` : 'Maximum level unlocked!'}
                </div>
              </div>

              <div className="hero-stats-sec">
                <div className="hero-stat-box">
                  <div className="hero-stat-value streak-color">🔥 {gameState?.streak}</div>
                  <div className="hero-stat-label">Daily Streak</div>
                </div>
                <div className="hero-stat-box">
                  <div className="hero-stat-value" style={{ color: 'var(--green)' }}>✨ {doneCount}</div>
                  <div className="hero-stat-label">Done Today</div>
                </div>
              </div>
            </div>

            {/* Motivation Box */}
            <div className={`motivation-alert ${motivation.class}`}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <div>{motivation.text}</div>
            </div>

            {/* Grid Split */}
            <div className="dashboard-grid">
              {/* Left Column: Daily Checklist */}
              <div>
                <div className="card">
                  <div className="card-header-flex">
                    <div>
                      <div className="card-title">📅 Daily Checklist</div>
                      <div className="card-subtitle">Complete daily tasks to earn recovery XP and badges</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa' }}>{pctDone}% Complete</span>
                  </div>

                  <div className="task-list">
                    {tasks.map(t => {
                      const done = !!todayDone[t.id]
                      const meta = TASK_CATEGORIES[t.category] || {}
                      return (
                        <div
                          key={t.id}
                          className={`task-item ${done ? 'completed' : ''}`}
                          onClick={() => handleTaskToggle(t.id, t.xp, tasks.length)}
                        >
                          <div className="task-checkbox-container">
                            <span className="check-icon">✓</span>
                          </div>
                          
                          <div className="task-icon-bg" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            {meta.icon || '📝'}
                          </div>

                          <div className="task-details">
                            <div className="task-item-title">
                              {t.title}
                              {t.period && <span className="task-period-badge">{t.period}</span>}
                            </div>
                            <div className="task-item-subtitle">{t.subtitle}</div>
                          </div>

                          <div className="task-xp-reward">
                            <div className="xp-amount">+{t.xp}</div>
                            <div className="xp-reward-label">XP</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Vitals Logger & Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Vitals Form */}
                <div className="card">
                  <div className="card-title">📊 Health Log</div>
                  <div className="card-subtitle" style={{ marginBottom: 16 }}>Log your vitals directly to your medical file</div>
                  
                  <form onSubmit={handleVitalsSubmit} className="vitals-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Blood Pressure</label>
                        <input className="form-input" placeholder="e.g. 120/80" value={bp} onChange={e => setBp(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Glucose (mg/dL)</label>
                        <input className="form-input" type="number" placeholder="e.g. 130" value={glucose} onChange={e => setGlucose(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (kg)</label>
                      <input className="form-input" type="number" step="0.1" placeholder="e.g. 72.5" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Self Notes</label>
                      <input className="form-input" placeholder="How are you feeling today?" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    
                    <button type="submit" className="btn">💾 Save & Sync</button>
                    {vitalsMsg && <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: 4 }}>{vitalsMsg}</div>}
                  </form>

                  {/* Vitals History */}
                  {gameState?.vital_log?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div className="form-label" style={{ marginBottom: 8 }}>Log History</div>
                      <div className="vitals-history-list">
                        {gameState.vital_log.map((v, i) => (
                          <div key={i} className="vitals-history-item">
                            <span className="vitals-hist-date">{v.date}</span>
                            <div className="vitals-hist-vals">
                              {v.bp && <span className="vitals-hist-pill">BP: {v.bp}</span>}
                              {v.glucose && <span className="vitals-hist-pill">Gluc: {v.glucose}</span>}
                              {v.weight && <span className="vitals-hist-pill">{v.weight} kg</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges Collection */}
                <div className="card">
                  <div className="card-title">🏆 Badge Showcase</div>
                  <div className="card-subtitle">Unlock achievements during your recovery journey</div>
                  
                  <div className="badge-grid">
                    {BADGES.map(badge => {
                      const unlocked = gameState?.badges?.includes(badge.id)
                      return (
                        <div
                          key={badge.id}
                          className={`badge-item ${unlocked ? 'unlocked' : ''}`}
                          style={{ '--badge-glow-color': badge.color }}
                        >
                          <div className="badge-icon-wrap">{badge.icon}</div>
                          <div className="badge-name">{badge.name}</div>
                          
                          <div className="badge-tooltip">
                            <strong style={{ display: 'block', marginBottom: 4 }}>{badge.name}</strong>
                            {badge.desc}
                            <div style={{ color: 'var(--green)', marginTop: 4, fontWeight: 700 }}>+{badge.xp} XP reward</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Compliance History graph */}
                <div className="card">
                  <div className="card-title">📈 7-Day Recovery Compliance</div>
                  <div className="card-subtitle">Your compliance score over the last week</div>
                  
                  <div className="weekly-progress-list">
                    {weeklyHistory.map(day => {
                      const pct = day.pct ?? 0
                      const barClass = pct >= 80 ? 'high' : pct >= 40 ? 'medium' : 'low'
                      return (
                        <div key={day.date} className="weekly-progress-day">
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{pct}%</span>
                          <div className="weekly-bar-container">
                            <div className={`weekly-bar-fill ${barClass}`} style={{ height: `${pct}%` }}></div>
                          </div>
                          <span className="weekly-day-label">{day.dayLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Diet Plan View */}
        {activeTab === 'diet' && pData.diet_plan && (
          <div className="card">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: 6 }}>🥗 {pData.diet_plan.plan_name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>{pData.diet_plan.overview}</p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {pData.diet_plan.caloric_target && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Calorie Target</div>
                  <div style={{ color: '#60a5fa', fontWeight: 700, marginTop: 2 }}>{pData.diet_plan.caloric_target}</div>
                </div>
              )}
              {pData.diet_plan.protein_target && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Protein Target</div>
                  <div style={{ color: '#8b5cf6', fontWeight: 700, marginTop: 2 }}>{pData.diet_plan.protein_target}</div>
                </div>
              )}
              {pData.diet_plan.sodium_limit && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sodium Limit</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>{pData.diet_plan.sodium_limit}</div>
                </div>
              )}
              {pData.diet_plan.fluid_limit && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fluid Limit</div>
                  <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>{pData.diet_plan.fluid_limit}</div>
                </div>
              )}
            </div>

            <div className="meal-grid-layout" style={{ marginBottom: 24 }}>
              <div className="meal-card-widget">
                <div className="meal-card-title">☀️ Breakfast Options</div>
                <ul className="meal-card-items">
                  {pData.diet_plan.breakfast?.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
              <div className="meal-card-widget">
                <div className="meal-card-title">🌤 Lunch Options</div>
                <ul className="meal-card-items">
                  {pData.diet_plan.lunch?.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
              <div className="meal-card-widget">
                <div className="meal-card-title">🌙 Dinner Options</div>
                <ul className="meal-card-items">
                  {pData.diet_plan.dinner?.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
              <div className="meal-card-widget">
                <div className="meal-card-title">🍵 Allowed Snacks</div>
                <ul className="meal-card-items">
                  {pData.diet_plan.snacks?.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 10 }}>✅ Recommended Foods</h4>
                <div className="diet-badge-group">
                  {pData.diet_plan.foods_recommended?.map((f, i) => <span key={i} className="food-badge-good">{f}</span>)}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--red)', textTransform: 'uppercase', marginBottom: 10 }}>⛔ Foods to Avoid</h4>
                <div className="diet-badge-group">
                  {pData.diet_plan.foods_strictly_restricted?.map((f, i) => <span key={i} className="food-badge-bad">{f}</span>)}
                </div>
              </div>
            </div>
            
            {pData.diet_plan.meal_timing_guidance && (
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>⏰ Meal Timing Advice:</strong> {pData.diet_plan.meal_timing_guidance}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Exercise Guide */}
        {activeTab === 'exercise' && pData.exercise_plan && (
          <div className="card">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: 6 }}>🏃 Activity & Rehabilitation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
              Your current rehabilitation phase is: <strong>{pData.exercise_plan.current_phase}</strong>
            </p>

            {pData.exercise_plan.absolute_exercise_restriction && (
              <div className="emergency-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', marginBottom: 24 }}>
                <span style={{ fontSize: '1.5rem' }}>🚫</span>
                <div>
                  <div className="emergency-title">Exercise Restriction Advised</div>
                  <div className="emergency-desc">{pData.exercise_plan.restriction_reason}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              {pData.exercise_plan.phase1 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phase 1: Immediate</div>
                  <h4 style={{ margin: '8px 0', fontSize: '1rem' }}>{pData.exercise_plan.phase1.type}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>⏱ Duration: {pData.exercise_plan.phase1.duration}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>Intensity: {pData.exercise_plan.phase1.intensity}</div>
                  {pData.exercise_plan.phase1.precautions && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Precautions: {pData.exercise_plan.phase1.precautions}</div>}
                </div>
              )}
              {pData.exercise_plan.phase2 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phase 2: Active Recovery</div>
                  <h4 style={{ margin: '8px 0', fontSize: '1rem' }}>{pData.exercise_plan.phase2.type}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>⏱ Duration: {pData.exercise_plan.phase2.duration}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>Intensity: {pData.exercise_plan.phase2.intensity}</div>
                </div>
              )}
              {pData.exercise_plan.phase3 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phase 3: Maintenance</div>
                  <h4 style={{ margin: '8px 0', fontSize: '1rem' }}>{pData.exercise_plan.phase3.type}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>⏱ Duration: {pData.exercise_plan.phase3.duration}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>Intensity: {pData.exercise_plan.phase3.intensity}</div>
                </div>
              )}
            </div>

            {pData.exercise_plan.pre_exercise_checklist?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>💡 Pre-Exercise Checklist</h4>
                <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {pData.exercise_plan.pre_exercise_checklist.map((item, idx) => <li key={idx} style={{ marginBottom: 4 }}>{item}</li>)}
                </ul>
              </div>
            )}

            {pData.exercise_plan.contraindications?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--red)', textTransform: 'uppercase', marginBottom: 10 }}>🚫 Restrictions & Contraindications</h4>
                <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {pData.exercise_plan.contraindications.map((item, idx) => <li key={idx} style={{ marginBottom: 4 }}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Medications */}
        {activeTab === 'meds' && (
          <div className="card">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: 12 }}>💊 Prescribed Medications</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>Please take your medications exactly at the timings listed below.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pData.medications?.map((m, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#60a5fa', fontWeight: 700 }}>{m.name}</h4>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.class}</div>
                    
                    <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dosage</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.dose}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Timing</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⏰ {m.timing}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Frequency</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.frequency}</div>
                      </div>
                    </div>

                    {m.important_notes?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Usage Notes</div>
                        <ul style={{ paddingLeft: 14, fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          {m.important_notes.map((n, j) => <li key={j}>{n}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 160, background: 'rgba(255,255,255,0.01)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Side Effects to Watch</div>
                    {m.side_effects_to_watch?.map((side, j) => (
                      <div key={j} style={{ fontSize: '0.72rem', color: 'var(--amber)', background: 'rgba(245,158,11,0.08)', padding: '2px 6px', borderRadius: 4, marginBottom: 4 }}>
                        ⚠️ {side}
                      </div>
                    ))}
                    {m.food_interactions?.map((fi, j) => (
                      <div key={j} style={{ fontSize: '0.72rem', color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '2px 6px', borderRadius: 4, marginTop: 6 }}>
                        ⛔ {fi}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Red Flags / Emergency Guide */}
        {activeTab === 'redflags' && (
          <div className="card">
            <div className="emergency-banner" style={{ marginBottom: 24 }}>
              <span className="emergency-icon">🚨</span>
              <div>
                <h3 className="emergency-title">Emergency Warning Symptoms</h3>
                <p className="emergency-desc">
                  If you experience any of the symptoms listed below, do not wait. Call <strong>108 / 112</strong> or visit the nearest hospital emergency department immediately.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {pData.red_flag_symptoms?.map((rf, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fca5a5', fontSize: '0.95rem' }}>
                    <span>⚠️</span> {rf.symptom}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Related Diagnosis: {rf.related_condition}</div>
                  <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(239,68,68,0.04)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid var(--red)' }}>
                    <strong>Action Required:</strong> {rf.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── App Routing Root ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientSelector />} />
      <Route path="/patient/:patientId" element={<PatientDashboard />} />
    </Routes>
  )
}
