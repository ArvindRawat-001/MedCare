# 🌱 MedCare — Patient Recovery Portal

> Your personal recovery companion. Track your daily health tasks, follow your doctor-approved care plan, log vitals, earn achievement badges, and stay on the path to full recovery — all in one place.

---

## 📌 What Is This?

The **MedCare Patient Recovery Portal** is a gamified, patient-facing web application that gives discharged hospital patients a structured, engaging, and easy-to-follow home recovery experience.

Once your doctor reviews and approves your care plan in the clinical system, it is instantly pushed to your personal portal. Everything is tailored specifically to your diagnoses, medications, diet needs, and physical restrictions — no generic advice.

---

## 🚀 Getting Started

```bash
# Install dependencies
cd patient-frontend
npm install

# Start the portal
npm run dev
```

Open **http://localhost:5174** in your browser.

> The patient backend must also be running on **http://localhost:8001**:
> ```bash
> cd patient-backend
> python main.py
> ```

---

## 🗺️ How to Use the Portal

### Step 1 — Select Your Profile
When you open the portal, you will see a list of registered patients. Click **"Enter Portal →"** next to your name to access your personal recovery dashboard.

### Step 2 — Complete Daily Tasks
Your **Recovery Hub** shows all the tasks you need to complete today — medications, meals, exercise, and vitals. Tick them off to earn XP and keep your streak alive.

### Step 3 — Log Your Vitals
Use the **Health Log** form to record your blood pressure, glucose, and weight each day. This keeps a 30-day history of your readings.

### Step 4 — Follow Your Care Plan
Browse the **Diet**, **Exercise**, **Medications**, and **Emergency Guide** tabs to see your full, doctor-approved care plan at any time.

---

## 🧭 Portal Sections

### 📊 Recovery Hub *(Home Tab)*
Your main daily dashboard. Everything you need to stay on track today.

- **Level & XP Banner** — shows your current recovery level, XP earned, and a progress bar to the next level
- **Daily Streak** — tracks how many consecutive days you have completed at least one task
- **Done Today** — live count of tasks completed today
- **Motivational Banner** — a dynamic message that changes based on your current completion percentage and streak
- **Daily Task Checklist** — a personalized list of tasks generated from your care plan (see [Daily Tasks](#-daily-tasks) below)
- **Health Log** — form to log Blood Pressure, Glucose, Weight, and personal notes
- **Vitals History** — timestamped log of all recorded readings (last 30 days)
- **Badge Showcase** — your unlocked achievement badges and all badges still to earn
- **7-Day Compliance Chart** — a bar chart showing your task completion % for each of the last 7 days

---

### 🥗 Diet Plan Tab
Your personalized nutrition plan prescribed by your clinical team.

| Feature | Details |
|---|---|
| **Plan Name** | Named diet (e.g. Cardiac Recovery Diet, Diabetic Meal Plan) |
| **Targets** | Calorie target, protein target, sodium limit, fluid limit |
| **Meal Options** | Separate lists for Breakfast, Lunch, Dinner, and Snacks |
| **Recommended Foods** | Green-tagged foods that support your recovery |
| **Foods to Avoid** | Red-tagged foods that are strictly restricted for your condition |
| **Meal Timing Advice** | Guidance on when to eat for optimal recovery |

---

### 🏃 Exercise Guide Tab
A phased rehabilitation plan customized to your current health status.

| Feature | Details |
|---|---|
| **Current Phase** | Shows which rehabilitation phase you are in |
| **Exercise Restriction Alert** | Shown in red if your doctor has advised complete rest |
| **Phase 1 — Immediate** | Type of activity, duration, intensity, precautions |
| **Phase 2 — Active Recovery** | Gradual increase in activity |
| **Phase 3 — Maintenance** | Long-term activity guidelines |
| **Pre-Exercise Checklist** | Things to check/do before any physical activity |
| **Contraindications** | Activities or movements to strictly avoid |

---

### 💊 Medications Tab
Your complete prescribed medication list with all the detail you need to take them correctly.

| Feature | Details |
|---|---|
| **Drug Name & Class** | Name and pharmacological class of each medication |
| **Dosage** | Exact dose to take |
| **Timing** | When to take (morning, night, with meals, etc.) |
| **Frequency** | How often (once daily, twice daily, etc.) |
| **Side Effects** | Effects to watch out for and report to your doctor |
| **Food Interactions** | Foods that interfere with the medication's effectiveness |
| **Usage Notes** | Important instructions (take with water, avoid on empty stomach, etc.) |

---

### 🚨 Emergency Guide Tab
A critical reference card of warning symptoms tied to your specific diagnoses.

- Lists every **red flag symptom** you should never ignore
- Each symptom is linked to the **related diagnosis** it may indicate
- Clear, plain-English **action required** — whether to call 108, visit the ER, or contact your doctor immediately
- Designed to be readable in an emergency situation

---

## ✅ Daily Tasks

Your daily checklist is automatically generated from your care plan every day. Tasks are grouped into five categories:

| Category | Icon | Examples |
|---|---|---|
| **Medication** | 💊 | Morning Medications, Night Medications, Midday Medications |
| **Exercise** | 🏃 | Light Walk · 20 min, Rehabilitation Exercise, Rest (if restricted) |
| **Diet** | 🍽️ | Healthy Breakfast, Healthy Lunch, Healthy Dinner |
| **Monitoring** | 📊 | Check Blood Pressure, Log Morning Weight, Log Daily Vitals |
| **Rest** | 😴 | Complete Rest Today (shown only when doctor advises bed rest) |

Each task shows:
- The **time of day** it should be done (morning / midday / afternoon / evening)
- A **subtitle** with specific details (medicine names, exercise type, duration)
- The **XP reward** for completing it
- A **checkmark** — tap or click to mark done. Tap again to undo.

> **Logging vitals** via the Health Log form automatically ticks off the BP and weight monitoring tasks for the day.

---

## 🎮 Gamification System

MedCare uses a gamification engine to keep you motivated throughout your recovery journey.

### ⚡ XP (Experience Points)

You earn XP for every action in the portal:

| Action | XP Earned |
|---|---|
| Complete a morning medication task | +15 XP per medication |
| Complete an exercise task | +35 XP |
| Complete a diet task (each meal) | +10 XP |
| Complete a monitoring task | +15 XP |
| Log vitals (BP or weight) | +10 XP |
| Unlock a badge | +badge XP (varies) |

Unchecking a completed task removes the XP — so it stays honest.

---

### 🏅 Levels

As you earn XP your level increases. Each level has a unique name and icon:

| Level | Name | XP Required | Icon |
|---|---|---|---|
| 1 | Health Starter | 0 XP | 🌱 |
| 2 | Recovery Warrior | 100 XP | 💪 |
| 3 | Wellness Seeker | 250 XP | 🌟 |
| 4 | Health Champion | 500 XP | 🏆 |
| 5 | Vitality Master | 1000 XP | 🔥 |

The XP progress bar and level name are always visible at the top of the Recovery Hub.

---

### 🔥 Daily Streaks

- A **streak** counts how many days in a row you have completed at least one task
- Miss a day completely and your streak resets to 0
- Your **longest streak ever** is also tracked
- Streaks unlock the most valuable badges

---

### 🏆 Badges

Earn badges by hitting recovery milestones. Each badge grants bonus XP:

| Badge | Icon | How to Unlock | Bonus XP |
|---|---|---|---|
| First Step | 👟 | Complete your very first task | +20 XP |
| Perfect Day | 🌟 | Complete 100% of tasks in a single day | +100 XP |
| Week Warrior | 🔥 | Maintain a 7-day streak | +150 XP |
| Streak Legend | ⚡ | Maintain a 14-day streak | +300 XP |
| Med Master | 💊 | Take all medications for 5 days | +100 XP |
| Move It! | 🏃 | Complete your first exercise task | +30 XP |
| Eat Right | 🥗 | Follow the diet plan for 3 consecutive days | +50 XP |
| Monitor Master | 📊 | Log vitals on 5 separate days | +50 XP |
| Recovery Star | ⭐ | Reach Level 3 (Wellness Seeker) | +200 XP |

All badges — locked and unlocked — are displayed in the Badge Showcase. Hover over any badge to see its description and XP reward.

---

### 📈 7-Day Compliance Chart

A visual overview of how consistently you are following your recovery plan over the past week:

- **Green bar** — ≥ 80% tasks completed (Excellent)
- **Amber bar** — ≥ 40% tasks completed (Keep going)
- **Red bar** — < 40% tasks completed (Needs improvement)

---

## 💾 Data & Sync

- All progress (XP, streaks, badges, vitals, task logs) is **automatically saved to the server** each time you complete a task or log vitals
- A **"☁️ Auto-syncing..."** indicator appears during save; **"✓ All data synced"** confirms success
- Vitals history is stored for up to **30 days**
- Your data persists across browser sessions and devices (tied to your Patient ID)

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, Vite |
| Styling | Vanilla CSS — custom dark-mode design system |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Fonts | Outfit, Plus Jakarta Sans (Google Fonts) |

---

## 📝 Notes

- This is a **prototype / demo** — no login or password is required.
- Your care plan only appears after your **doctor has approved it** in the clinical dashboard.
- If you see a *"Discharge Plan Pending Review"* message, your clinical team has not yet finalized your plan — check back shortly.
- The patient backend shares the same database (`medcare.db`) as the doctor backend — both must be running simultaneously.
