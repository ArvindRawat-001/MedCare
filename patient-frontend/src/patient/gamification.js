/**
 * MedCare Patient Gamification Engine
 * Pure logic for state calculations, streaks, badges, levels, and task generation.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, name: 'Health Starter',   minXP: 0,    icon: '🌱', color: '#10b981' },
  { level: 2, name: 'Recovery Warrior', minXP: 100,  icon: '💪', color: '#3b82f6' },
  { level: 3, name: 'Wellness Seeker',  minXP: 250,  icon: '🌟', color: '#8b5cf6' },
  { level: 4, name: 'Health Champion',  minXP: 500,  icon: '🏆', color: '#f59e0b' },
  { level: 5, name: 'Vitality Master',  minXP: 1000, icon: '🔥', color: '#ef4444' },
]

export const BADGES = [
  { id: 'first_step',    name: 'First Step',       icon: '👟', desc: 'Complete your very first task',        xp: 20,  color: '#10b981' },
  { id: 'perfect_day',   name: 'Perfect Day',       icon: '🌟', desc: 'Complete 100% of tasks in a day',     xp: 100, color: '#f59e0b' },
  { id: 'week_warrior',  name: 'Week Warrior',      icon: '🔥', desc: 'Maintain a 7-day streak',             xp: 150, color: '#f97316' },
  { id: 'streak_legend', name: 'Streak Legend',     icon: '⚡', desc: 'Maintain a 14-day streak',            xp: 300, color: '#7c3aed' },
  { id: 'med_master',    name: 'Med Master',         icon: '💊', desc: 'Take all medications for 5 days',    xp: 100, color: '#3b82f6' },
  { id: 'move_it',       name: 'Move It!',           icon: '🏃', desc: 'Complete your first exercise',        xp: 30,  color: '#06b6d4' },
  { id: 'eat_right',     name: 'Eat Right',          icon: '🥗', desc: 'Follow diet plan for 3 days',        xp: 50,  color: '#22c55e' },
  { id: 'monitor_master',name: 'Monitor Master',     icon: '📊', desc: 'Log vitals 5 times',                 xp: 50,  color: '#8b5cf6' },
  { id: 'recovery_star', name: 'Recovery Star',      icon: '⭐', desc: 'Reach Level 3 (Wellness Seeker)',    xp: 200, color: '#f59e0b' },
]

export const TASK_CATEGORIES = {
  medication: { label: 'Medication', icon: '💊', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  exercise:   { label: 'Exercise',   icon: '🏃', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  diet:       { label: 'Diet',       icon: '🍽️', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  monitoring: { label: 'Monitoring', icon: '📊', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  rest:       { label: 'Rest',       icon: '😴', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

// ── Date Helpers ──────────────────────────────────────────────────────────────

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function daysBetween(a, b) {
  const msPerDay = 86400000
  return Math.round((new Date(b) - new Date(a)) / msPerDay)
}

// ── Level Calculation ─────────────────────────────────────────────────────────

export function getLevel(xp) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl
    else break
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = LEVELS[nextIdx] || null
  const xpForCurrent = current.minXP
  const xpForNext = next ? next.minXP : current.minXP + 999
  const progress = next ? Math.round(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100) : 100
  return { ...current, next, progress, xpToNext: next ? xpForNext - xp : 0 }
}

// ── State Updaters (Pure functions for React State) ───────────────────────────

export function recalcStreak(state) {
  const t = today()
  const last = state.last_active_date
  if (!last) return state
  const diff = daysBetween(last, t)
  if (diff > 1) {
    return { ...state, streak: 0 }
  }
  return state
}

export function completeTaskInState(state, taskId, xpReward, totalTasksCount) {
  // Deep clone to avoid mutating React state directly
  const newState = JSON.parse(JSON.stringify(state))
  const t = today()

  if (!newState.task_log[t]) newState.task_log[t] = {}
  const alreadyDone = newState.task_log[t][taskId]

  if (alreadyDone) {
    // Undo
    newState.task_log[t][taskId] = false
    newState.xp = Math.max(0, newState.xp - xpReward)
  } else {
    newState.task_log[t][taskId] = true
    newState.xp += xpReward

    // Count total tasks done overall
    let totalCompleted = 0
    Object.values(newState.task_log).forEach(dayLog => {
      totalCompleted += Object.values(dayLog).filter(Boolean).length
    })

    // First task badge
    if (totalCompleted === 1 && !newState.badges.includes('first_step')) {
      newState.badges.push('first_step')
      newState.xp += BADGES.find(b => b.id === 'first_step').xp
    }

    // Exercise badge
    if (taskId === 'exercise' && !newState.badges.includes('move_it')) {
      newState.badges.push('move_it')
      newState.xp += BADGES.find(b => b.id === 'move_it').xp
    }
  }

  // Check perfect day
  const todayDone = Object.values(newState.task_log[t] || {}).filter(Boolean).length
  if (todayDone >= totalTasksCount && !newState.badges.includes('perfect_day')) {
    newState.badges.push('perfect_day')
    newState.xp += BADGES.find(b => b.id === 'perfect_day').xp
  }

  // Update streak
  const last = newState.last_active_date
  if (last !== t) {
    const diff = last ? daysBetween(last, t) : 1
    if (diff === 1) {
      newState.streak += 1
    } else if (diff > 1 || !last) {
      newState.streak = 1
    }
    if (newState.streak > newState.longest_streak) newState.longest_streak = newState.streak
    newState.last_active_date = t
  }

  // Streak badges
  if (newState.streak >= 7 && !newState.badges.includes('week_warrior')) {
    newState.badges.push('week_warrior')
    newState.xp += BADGES.find(b => b.id === 'week_warrior').xp
  }
  if (newState.streak >= 14 && !newState.badges.includes('streak_legend')) {
    newState.badges.push('streak_legend')
    newState.xp += BADGES.find(b => b.id === 'streak_legend').xp
  }

  // Level-based badge
  const lvl = getLevel(newState.xp)
  if (lvl.level >= 3 && !newState.badges.includes('recovery_star')) {
    newState.badges.push('recovery_star')
    newState.xp += BADGES.find(b => b.id === 'recovery_star').xp
  }

  // Eat right badge (diet compliance for 3 days)
  const dietIds = ['breakfast', 'lunch', 'dinner']
  const daysWith3Meals = Object.entries(newState.task_log).filter(([, tasks]) =>
    dietIds.every(id => tasks[id])
  ).length
  if (daysWith3Meals >= 3 && !newState.badges.includes('eat_right')) {
    newState.badges.push('eat_right')
    newState.xp += BADGES.find(b => b.id === 'eat_right').xp
  }

  // Monitor master badge (vitals logged 5 times)
  const vitalDays = Object.entries(newState.task_log).filter(([, tasks]) =>
    tasks['bp_morning'] || tasks['vitals']
  ).length
  if (vitalDays >= 5 && !newState.badges.includes('monitor_master')) {
    newState.badges.push('monitor_master')
    newState.xp += BADGES.find(b => b.id === 'monitor_master').xp
  }

  // Update level
  newState.level = getLevel(newState.xp).level

  return newState
}

export function logVitalsInState(state, vitals) {
  const newState = JSON.parse(JSON.stringify(state))
  const t = today()

  const existing = newState.vital_log.findIndex(v => v.date === t)
  if (existing >= 0) {
    newState.vital_log[existing] = { ...newState.vital_log[existing], ...vitals, date: t }
  } else {
    newState.vital_log.unshift({ ...vitals, date: t })
  }

  if (newState.vital_log.length > 30) {
    newState.vital_log = newState.vital_log.slice(0, 30)
  }

  // Check off vitals tasks if completed
  if (!newState.task_log[t]) newState.task_log[t] = {}
  
  if (vitals.bp) {
    newState.task_log[t]['bp_morning'] = true
  }
  if (vitals.weight) {
    newState.task_log[t]['vitals'] = true
  }

  // Update gamification properties
  newState.xp += 10 // Reward for logging vitals
  newState.level = getLevel(newState.xp).level

  return newState
}

// ── Daily Task Generation ─────────────────────────────────────────────────────

export function generateDailyTasks(planData) {
  if (!planData) return []
  const tasks = []

  // Medications — group morning/night
  const morningMeds = []
  const nightMeds   = []
  const otherMeds   = []

  planData.medications?.forEach(med => {
    const timing = (med.timing || '').toLowerCase()
    const item = {
      id: `med_${(med.drug_code || med.name || '').replace(/\s+/g, '_')}`,
      name: med.name,
      dose: med.dose,
      timing: med.timing,
      category: 'medication',
    }
    if (timing.includes('morning') || timing.includes('breakfast') || timing.includes('before meal')) morningMeds.push(item)
    else if (timing.includes('night') || timing.includes('evening') || timing.includes('bedtime')) nightMeds.push(item)
    else otherMeds.push(item)
  })

  if (morningMeds.length > 0) {
    tasks.push({
      id: 'med_group_morning',
      category: 'medication',
      icon: '💊',
      period: 'morning',
      title: `Morning Medications (${morningMeds.length})`,
      subtitle: morningMeds.map(m => m.name).join(', '),
      detail: morningMeds,
      xp: morningMeds.length * 15,
      required: true,
    })
  }

  if (otherMeds.length > 0) {
    tasks.push({
      id: 'med_group_midday',
      category: 'medication',
      icon: '💊',
      period: 'midday',
      title: `Midday Medications (${otherMeds.length})`,
      subtitle: otherMeds.map(m => m.name).join(', '),
      detail: otherMeds,
      xp: otherMeds.length * 15,
      required: true,
    })
  }

  if (nightMeds.length > 0) {
    tasks.push({
      id: 'med_group_night',
      category: 'medication',
      icon: '💊',
      period: 'evening',
      title: `Night Medications (${nightMeds.length})`,
      subtitle: nightMeds.map(m => m.name).join(', '),
      detail: nightMeds,
      xp: nightMeds.length * 15,
      required: true,
    })
  }

  // Exercise
  const ex = planData.exercise_plan
  if (ex) {
    if (ex.absolute_exercise_restriction) {
      tasks.push({
        id: 'rest_today',
        category: 'rest',
        icon: '🛏️',
        period: 'morning',
        title: 'Complete Rest Today',
        subtitle: ex.restriction_reason || 'Doctor has advised complete rest',
        xp: 10,
      })
    } else {
      const phase = ex.phase1 || {}
      tasks.push({
        id: 'exercise',
        category: 'exercise',
        icon: '🏃',
        period: 'afternoon',
        title: ex.current_phase || 'Light exercise',
        subtitle: `${phase.type || 'Light activity'} · ${phase.duration || '20 min'}`,
        xp: 35,
      })
    }
  }

  // Diet
  tasks.push({ id: 'breakfast', category: 'diet', icon: '🍽️', period: 'morning',   title: 'Healthy Breakfast', subtitle: planData.diet_plan?.plan_name || 'As per diet plan', xp: 10 })
  tasks.push({ id: 'lunch',     category: 'diet', icon: '🍽️', period: 'midday',    title: 'Healthy Lunch',     subtitle: 'Follow your diet plan', xp: 10 })
  tasks.push({ id: 'dinner',    category: 'diet', icon: '🍽️', period: 'evening',   title: 'Healthy Dinner',    subtitle: 'Light dinner before 8:00 PM', xp: 10 })

  // Monitoring
  tasks.push({ id: 'bp_morning', category: 'monitoring', icon: '📊', period: 'morning',  title: 'Check Blood Pressure', subtitle: 'Log blood pressure reading', xp: 15 })
  tasks.push({ id: 'vitals',     category: 'monitoring', icon: '⚖️', period: 'morning',  title: 'Log Morning Weight',   subtitle: 'Record weight in companion app', xp: 15 })
  tasks.push({ id: 'diary',      category: 'monitoring', icon: '📝', period: 'evening',  title: 'Log Daily Vitals',     subtitle: 'Log glucose levels and symptoms', xp: 15 })

  return tasks
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

export function getMotivationalMessage(pct, streak) {
  if (pct === 100) return { text: "PERFECT DAY! You are recovering brilliantly! 🎉", mood: 'perfect', class: 'perfect' }
  if (pct >= 85)   return { text: "Almost there! Just a couple more tasks to unlock perfect day! 🌟", mood: 'great', class: 'great' }
  if (pct >= 50)   return { text: "Halfway through your daily tasks! Keep it up! ⚡", mood: 'good', class: 'good' }
  if (pct > 0)     return { text: "Great start! Every single step contributes to recovery! 💪", mood: 'okay', class: 'okay' }
  if (streak > 0)  return { text: `Log your first task to maintain your ${streak}-day streak! 🔥`, mood: 'warn', class: 'warn' }
  return { text: "Welcome! Complete your daily checklist and earn XP to level up! 🌱", mood: 'start', class: 'start' }
}

export function getTodayCompliance(state, totalTasks) {
  if (!state || totalTasks === 0) return 0
  const t = today()
  const dayLog = state.task_log[t] || {}
  const done = Object.values(dayLog).filter(Boolean).length
  return Math.round((done / totalTasks) * 100)
}

export function getWeeklyHistory(state, totalTasks) {
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' })
    const dayLog = state?.task_log?.[dateStr] || {}
    const done = Object.values(dayLog).filter(Boolean).length
    const pct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : (dateStr === today() ? 0 : null)
    result.push({ date: dateStr, dayLabel, pct: pct ?? null, done })
  }
  return result
}
