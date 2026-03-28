import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Sites from './pages/Sites'
import SiteDetail from './pages/SiteDetail'
import FieldData from './pages/FieldData'
import Projects from './pages/Projects'
import Papers from './pages/Papers'
import Reports from './pages/Reports'
import Milestones from './pages/Milestones'
import Reservations from './pages/Reservations'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="sites" element={<Sites />} />
        <Route path="sites/:id" element={<SiteDetail />} />
        <Route path="field-data" element={<FieldData />} />
        <Route path="projects" element={<Projects />} />
        <Route path="papers" element={<Papers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="reservations" element={<Reservations />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
