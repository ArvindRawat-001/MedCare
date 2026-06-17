const BASE = 'http://localhost:8001/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getPatients:      () => req('/patients/all'),
  getPlan:          (patientId) => req(`/patients/${patientId}/plan`),
  getGamification:  (patientId) => req(`/patients/${patientId}/gamification`),
  saveGamification: (patientId, data) => req(`/patients/${patientId}/gamification`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
}
