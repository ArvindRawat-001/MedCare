import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewCase from './pages/NewCase.jsx'
import CaseDetail from './pages/CaseDetail.jsx'
import CarePlanView from './pages/CarePlanView.jsx'
import ReviewQueue from './pages/ReviewQueue.jsx'
import HealthScribe from './pages/HealthScribe.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases/new" element={<NewCase />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/cases/:id/plan" element={<CarePlanView />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/healthscribe" element={<HealthScribe />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
