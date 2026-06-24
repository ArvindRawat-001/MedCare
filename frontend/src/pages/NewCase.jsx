import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/client.js'

const SAMPLES = {
  'Ramesh Kumar — Post-MI + T2DM + HTN (65M, Complex)': `DISCHARGE SUMMARY
Patient: Ramesh Kumar | Age: 65 years | Sex: Male | IP No: MED-2026-0341
Admission: 12/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology (ICU → General)

PRIMARY DIAGNOSIS:
1. Acute Myocardial Infarction (STEMI — Anterior wall) — Post Primary PCI with Drug-Eluting Stent to LAD
2. Type 2 Diabetes Mellitus (Known case — 10 years)
3. Hypertension (Known case — 8 years)

INVESTIGATIONS:
- Troponin I: 45.2 ng/mL (critically elevated)
- HbA1c: 8.4%
- Fasting Blood Glucose: 184 mg/dL
- Serum Creatinine: 1.2 mg/dL | eGFR: 62 mL/min
- Blood Pressure: 160/100 mmHg
- Hemoglobin: 12.8 g/dL
- Serum Potassium: 3.9 mEq/L

DISCHARGE MEDICATIONS:
1. Tab Aspirin 75mg — Once daily AFTER breakfast
2. Tab Clopidogrel 75mg — Once daily AFTER breakfast
3. Tab Atorvastatin 80mg — Once daily at NIGHT
4. Tab Metoprolol 25mg — Twice daily
5. Tab Lisinopril 5mg — Once daily MORNING
6. Tab Metformin 500mg — Twice daily WITH meals
7. Tab Amlodipine 5mg — Once daily

ALLERGIES: Penicillin (rash and urticaria)
DIET: Diabetic + Cardiac diet. Low salt. Low fat. Low sugar.
FOLLOW UP: Cardiology in 1 week. Endocrinology in 4 weeks.`,

  'Priya Sharma — Typhoid Recovery (32F, Simple)': `DISCHARGE SUMMARY
Patient: Priya Sharma | Age: 32 years | Sex: Female | IP No: MED-2026-0562
Admission: 09/06/2026 | Discharge: 16/06/2026 | Ward: General Medicine

PRIMARY DIAGNOSIS:
1. Enteric Fever (Typhoid) — Blood culture positive: Salmonella typhi

INVESTIGATIONS:
- Blood Culture: Salmonella typhi (sensitive to cefixime)
- Widal Test: O 1:320, H 1:320
- Hemoglobin: 10.8 g/dL | WBC: 3.2 x 10^9/L
- Serum Creatinine: 0.8 mg/dL | eGFR: 95 mL/min
- Liver enzymes: ALT 68, AST 72 (mild elevation)
- Temperature on admission: 103.4°F

DISCHARGE MEDICATIONS:
1. Tab Cefixime 400mg — Twice daily for 7 more days
2. Tab Paracetamol 500mg — Only if fever
3. ORS sachet — As needed for hydration

ALLERGIES: None Known (NKDA)
DIET: Typhoid diet — soft, easily digestible, bland food only. Avoid spicy/oily food.`,

  'Arjun Singh — CHF + CKD3 + HTN (72M, High Complexity)': `DISCHARGE SUMMARY
Patient: Arjun Singh | Age: 72 years | Sex: Male | IP No: MED-2026-0489
Admission: 05/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology

PRIMARY DIAGNOSIS:
1. Decompensated Congestive Heart Failure (NYHA Class III → Class II) | EF: 35%
2. Chronic Kidney Disease Stage 3 (eGFR 38 mL/min)
3. Hypertension (Known case — 15 years)

INVESTIGATIONS:
- BNP: 210 pg/mL (discharge) | Serum Creatinine: 2.1 mg/dL
- eGFR: 38 mL/min | Serum Potassium: 5.2 mEq/L
- Hemoglobin: 9.8 g/dL | Blood Pressure: 150/95 mmHg

DISCHARGE MEDICATIONS:
1. Tab Furosemide 40mg — Once daily MORNING
2. Tab Losartan 50mg — Once daily
3. Tab Carvedilol 6.25mg — Twice daily WITH food
4. Tab Spironolactone 25mg — Once daily MORNING
5. Tab Atorvastatin 20mg — Once daily NIGHT

ALLERGIES: Penicillin (anaphylaxis), Sulfonamide antibiotics (rash)
DIET: Strict sodium restriction (<1.5g/day). Fluid restriction (1.5L/day). Low potassium diet.`,
}

export default function NewCase() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [patient, setPatient] = useState({ name:'', age:'', sex:'Male', weight_kg:'', blood_group:'', allergies:'', contact:'', address:'' })
  const [docText, setDocText] = useState('')
  const [patientId, setPatientId] = useState(null)

  useEffect(() => {
    if (location.state?.prefill) {
      const p = location.state.prefill
      setPatient({
        name: p.name || '',
        age: p.age ? String(p.age) : '',
        sex: p.sex || 'Male',
        weight_kg: p.weight_kg ? String(p.weight_kg) : '',
        blood_group: p.blood_group || '',
        allergies: p.allergies || '',
        contact: '',
        address: ''
      })
      setDocText(p.discharge_text || '')
    }
  }, [location.state])

  const set = (field) => (e) => setPatient(p => ({ ...p, [field]: e.target.value }))

  const handlePatient = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const p = await api.createPatient({
        ...patient,
        age: parseInt(patient.age),
        weight_kg: parseFloat(patient.weight_kg) || null,
        allergies: patient.allergies ? patient.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setPatientId(p.id)
      setStep(2)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleCase = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const c = await api.createCase({ patient_id: patientId, discharge_text: docText })
      navigate(`/cases/${c.id}`)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">New Discharge Case</div>
          <div className="topbar-sub">Register patient and upload discharge document</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back</button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 780 }}>
        {/* Steps */}
        <div className="pipeline-steps" style={{ marginBottom: 32 }}>
          {['Patient Details', 'Discharge Document', 'Processing & Plan'].map((label, i) => (
            <div key={label} className="pipeline-step">
              <div className={`step-circle ${step > i+1 ? 'done' : step === i+1 ? 'active' : 'pending'}`}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="alert danger" style={{ marginBottom: 20 }}>
            <span className="alert-icon">❌</span>
            <div className="alert-content"><div className="alert-title">{error}</div></div>
          </div>
        )}

        {/* Step 1 — Patient */}
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">👤 Patient Demographics</div>
                <div className="card-subtitle">Basic patient information for this discharge case</div>
              </div>
            </div>
            <form onSubmit={handlePatient}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required placeholder="Ramesh Kumar" value={patient.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age (years) *</label>
                  <input className="form-input" type="number" required min={0} max={120} placeholder="65" value={patient.age} onChange={set('age')} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Sex *</label>
                  <select className="form-select" value={patient.sex} onChange={set('sex')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input className="form-input" type="number" step="0.1" placeholder="70.0" value={patient.weight_kg} onChange={set('weight_kg')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={patient.blood_group} onChange={set('blood_group')}>
                    <option value="">Unknown</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Known Drug Allergies <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(comma-separated, e.g. penicillin, sulfonamide)</span></label>
                <input className="form-input" placeholder="penicillin, sulfonamide" value={patient.allergies} onChange={set('allergies')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input className="form-input" placeholder="Name — Phone Number" value={patient.contact} onChange={set('contact')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="City, State" value={patient.address} onChange={set('address')} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Saving Patient...</> : 'Continue → Upload Document'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2 — Document */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📄 Discharge Document</div>
                <div className="card-subtitle">Paste the discharge summary text (OCR output or typed)</div>
              </div>
            </div>

            <div className="alert info" style={{ marginBottom: 20 }}>
              <span className="alert-icon">💡</span>
              <div className="alert-content">
                <div className="alert-title">Load a sample document to demo the system</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {Object.keys(SAMPLES).map(k => (
                    <button key={k} type="button" className="btn btn-ghost btn-sm" onClick={() => setDocText(SAMPLES[k])}>
                      {k.split('—')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleCase}>
              <div className="form-group">
                <label className="form-label">Discharge Summary Text *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 340, fontFamily: 'Courier New, monospace', fontSize: '0.82rem', lineHeight: 1.7 }}
                  required
                  placeholder="Paste discharge summary here — or click a sample above to load demo data..."
                  value={docText}
                  onChange={e => setDocText(e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {docText.length} characters · {docText.split('\n').length} lines
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Edit Patient</button>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !docText.trim()}>
                  {loading ? <><span className="spinner" /> Creating Case...</> : '🚀 Create Case & Start Processing'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
