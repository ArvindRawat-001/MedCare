# 🏥 MedCare — Automatic Discharge Care Plan System

> A full-stack clinical prototype that automates post-discharge care planning for doctors and delivers a personalized recovery companion portal to patients.

---

## 📌 Overview

When a patient is discharged from a hospital, the process of writing a complete, personalized care plan — covering medications, diet, exercise, follow-ups, and emergency red flags — is time-intensive and error-prone when done manually.

**MedCare** solves this by:

1. **Automatically extracting** clinical entities (diseases, drugs, lab values, allergies) from unstructured discharge summary text using a built-in NLP service.
2. **Running a medical rule engine** that cross-references a curated knowledge base to detect drug interactions, flag critical abnormalities, and enforce clinical guidelines.
3. **Generating a structured, patient-specific care plan** that a doctor can review, edit, and approve with a single click.
4. **Delivering the approved plan** to a dedicated **Patient Recovery Portal**, where patients can track daily tasks, log vitals, earn gamification badges, and monitor their recovery progress.

---

## 🗂️ Project Structure

```
MedCare/
├── backend/               # Doctor-facing API (FastAPI) — port 8000
│   ├── main.py            # All REST API routes
│   ├── models.py          # SQLAlchemy DB models + Pydantic schemas
│   ├── nlp_service.py     # NLP entity extraction from discharge text
│   ├── rule_engine.py     # Medical rule engine (flags, interactions, thresholds)
│   ├── care_plan_generator.py  # Structured care plan builder
│   ├── knowledge_base.py  # Curated disease/drug/nutrition/lab knowledge graph
│   ├── medcare.db         # SQLite database (shared with patient-backend)
│   └── requirements.txt
│
├── frontend/              # Doctor-facing UI (React + Vite) — port 5173
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx      # Main case management dashboard
│       │   ├── NewCase.jsx        # Register patient + paste discharge text
│       │   ├── CaseDetail.jsx     # NLP results, entity extraction, rule flags
│       │   ├── CarePlanView.jsx   # Full care plan viewer + approve workflow
│       │   └── ReviewQueue.jsx    # Priority queue for flagged/critical cases
│       └── components/
│           └── Layout.jsx         # Sidebar navigation shell
│
├── patient-backend/       # Patient-facing API (FastAPI) — port 8001
│   ├── main.py            # Patient REST API routes
│   └── models.py          # Patient gamification models
│
└── patient-frontend/      # Patient Recovery Portal (React + Vite) — port 5174
    └── src/
        ├── App.jsx         # Patient selector + full dashboard UI
        └── patient/
            └── gamification.js  # XP, levels, streaks, badges logic
```

---

## 👨‍⚕️ Doctor Dashboard (`frontend` + `backend`)

The doctor-facing interface is the clinical hub where hospital staff manage discharged patients and their care plans.

### Features

#### 📋 Case Management Dashboard
- Overview of **all discharge cases** in a sortable table
- Live stats: Total Cases, Needs Review, Approved, Ready, Patients registered, Flags Pending
- One-click navigation to any case or its generated care plan

#### ➕ New Case Creation
- Register a new patient (name, age, sex, weight, blood group, allergies, contact)
- Paste raw **discharge summary text** from hospital records
- Submit triggers automatic NLP processing

#### 🔬 NLP Entity Extraction
- Parses unstructured discharge text to identify:
  - **Diseases & diagnoses** (ICD-10 mapped)
  - **Prescribed drugs** with dosage and timing
  - **Lab values** (HbA1c, creatinine, eGFR, cholesterol, etc.)
  - **Allergies** and contraindications

#### ⚙️ Medical Rule Engine
- Cross-references extracted entities against the knowledge base
- Raises **critical / high / medium / low** severity flags for:
  - Dangerous drug–drug interactions
  - Lab values outside safe thresholds
  - Disease-specific dietary and exercise restrictions
  - Allergy conflicts with prescribed medications
  - Age-specific dosing concerns
- Cases with critical flags are automatically routed to **Review Required** status

#### 🤖 Care Plan Generation
- Builds a complete, structured care plan including:
  - **Medications** — dosage, timing, frequency, side effects, food interactions
  - **Diet Plan** — meal options (breakfast/lunch/dinner/snacks), caloric & protein targets, foods to avoid
  - **Exercise & Rehabilitation** — phased activity guide with restrictions
  - **Follow-up Schedule** — specialist appointments and monitoring intervals
  - **Red Flag Symptoms** — emergency warning signs mapped to diagnoses with required actions
- Plans carry a **confidence score** and `requires_human_review` flag

#### 👨‍⚕️ Review & Approval Workflow
- Doctors can inspect every flag raised by the rule engine
- Side-by-side view of extracted entities and the generated care plan
- One-click **Approve** with doctor name — records timestamp
- Approved plans become immediately available in the Patient Portal

#### ⚠️ Review Queue
- Dedicated page listing only **review_required** cases, sorted by urgency
- Shows critical and high flag counts per case for quick triage

---

## 🌱 Patient Recovery Portal (`patient-frontend` + `patient-backend`)

Once a doctor approves a care plan, the patient can access their personalized recovery companion.

### Features

#### 🔑 Patient Selector
- Patients pick their profile from a list to enter their private portal
- No login required for this prototype — ID-based access

#### 📊 Recovery Hub (Gamification)
- **XP & Level System** — patients earn XP by completing daily recovery tasks
  - Levels: Seedling → Sprout → Sapling → Grower → Healer → Champion → Guardian → Master
- **Daily Streak Tracker** — consecutive days of completing tasks builds a streak
- **Daily Task Checklist** — auto-generated from the care plan (take medications, walk, log vitals, follow diet, attend follow-up, etc.)
- **Motivational Messages** — dynamic encouragement based on current compliance %

#### 🏆 Badge Showcase
- Unlockable achievement badges rewarded for milestones:
  - First Step, Week Warrior, Medication Master, Vital Tracker, Diet Champion, and more
- Each badge displays its description and XP reward on hover

#### 📈 7-Day Compliance Chart
- Visual bar chart of daily task completion percentage over the past week
- Color-coded: green (≥80%), amber (≥40%), red (<40%)

#### 💊 Medications Tab
- Full medication list from the approved care plan
- Shows dosage, timing, frequency, side effects to watch, and food interactions

#### 🥗 Diet Plan Tab
- Personalized meal plan with calorie/protein/sodium/fluid targets
- Breakfast, lunch, dinner, and snack options
- Recommended foods and strictly restricted foods

#### 🏃 Exercise Guide Tab
- Phased rehabilitation plan (Phase 1 Immediate → Phase 2 Active → Phase 3 Maintenance)
- Pre-exercise checklist and contraindications
- Exercise restriction warnings for high-risk cases

#### 🚨 Emergency Guide Tab
- Red flag symptom list linked to each diagnosis
- Clear action steps (call 108 / visit ER) for every warning symptom

#### 📊 Health Log
- Patients manually log vitals: Blood Pressure, Glucose, Weight, and free-text notes
- Logs are timestamped and saved to the backend
- Running vitals history displayed in the portal

---

## 🧬 Knowledge Base

The rule engine and care plan generator are powered by a curated static knowledge graph (`knowledge_base.py`) covering:

| Domain | Coverage |
|---|---|
| **Diseases** | T2DM, Hypertension, CKD Stage 3, Post-MI (Post-PCI), CHF, Enteric Fever (Typhoid) |
| **Drugs** | 13 medications with class, interactions, contraindications, and food rules |
| **Nutrition** | 6 Indian-diet meal plans (diabetic, cardiac, renal, typhoid, general) |
| **Lab Tests** | 8 tests (HbA1c, eGFR, creatinine, potassium, sodium, Hb, BP, cholesterol) with normal/critical thresholds |
| **Exercise** | 6 exercise types with per-disease restriction matrix |
| **Age Groups** | 6 profiles: Pediatric, Young Adult, Adult, Middle-aged, Senior, Geriatric |

---

## 🚀 Running the Project

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Doctor Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### 2. Doctor Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Patient Backend
```bash
cd patient-backend
# Uses the same medcare.db as the doctor backend
# Install the same dependencies as the doctor backend
python main.py
# Runs on http://localhost:8001
```

### 4. Patient Frontend
```bash
cd patient-frontend
npm install
npm run dev
# Runs on http://localhost:5174
```

---

## 🌐 Service URLs

| Service | URL | Purpose |
|---|---|---|
| Doctor Dashboard | http://localhost:5173 | Clinical case management UI |
| Doctor API | http://localhost:8000 | REST API + Swagger docs at `/docs` |
| Patient Portal | http://localhost:5174 | Patient recovery companion UI |
| Patient API | http://localhost:8001 | Patient gamification + plan API |

> **Note:** Both backends share the same `medcare.db` SQLite database file located in `backend/medcare.db`.

---

## 🔄 End-to-End Workflow

```
1. Doctor registers a patient  →  NewCase page
2. Pastes discharge summary    →  NLP extracts entities
3. Rule engine runs            →  Flags critical issues
4. Care plan is generated      →  Doctor reviews in CarePlanView
5. Doctor approves plan        →  Plan marked approved in DB
6. Patient opens portal        →  Selects their profile
7. Patient sees their plan     →  Daily tasks, diet, meds, exercises
8. Patient logs progress       →  XP, streaks, badges, vitals tracked
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Doctor Backend | Python, FastAPI, SQLAlchemy, SQLite, Uvicorn |
| Patient Backend | Python, FastAPI, SQLAlchemy, SQLite, Uvicorn |
| Doctor Frontend | React 18, React Router v7, Vite |
| Patient Frontend | React 18, React Router v7, Vite |
| Styling | Vanilla CSS (custom design system, dark mode) |
| Database | SQLite (`medcare.db`) — shared across both backends |

---

## 📝 Notes

- This is a **prototype / demo system** — no authentication is implemented.
- The NLP service uses **rule-based pattern matching**, not a trained ML model.
- Sample patients (Ramesh, Priya, Arjun) are auto-seeded into the database on first startup.
- The knowledge base is a **static hand-crafted graph** focused on common Indian hospital discharge conditions.
