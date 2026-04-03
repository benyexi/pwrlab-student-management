import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Students = lazy(() => import('./pages/Students'))
const StudentDetail = lazy(() => import('./pages/StudentDetail'))
const Sites = lazy(() => import('./pages/Sites'))
const SiteDetail = lazy(() => import('./pages/SiteDetail'))
const FieldData = lazy(() => import('./pages/FieldData'))
const Projects = lazy(() => import('./pages/Projects'))
const Papers = lazy(() => import('./pages/Papers'))
const Reports = lazy(() => import('./pages/Reports'))
const StudentReports = lazy(() => import('./pages/StudentReports'))
const Milestones = lazy(() => import('./pages/Milestones'))
const Reservations = lazy(() => import('./pages/Reservations'))
const Questions = lazy(() => import('./pages/Questions'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700" />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
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
              <Route
                path="students"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <Students />
                  </RoleGuard>
                }
              />
              <Route
                path="students/:id"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <StudentDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="sites"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <Sites />
                  </RoleGuard>
                }
              />
              <Route
                path="sites/:id"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <SiteDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="field-data"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <FieldData />
                  </RoleGuard>
                }
              />
              <Route path="projects" element={<Projects />} />
              <Route path="papers" element={<Papers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/:studentId" element={<StudentReports />} />
              <Route path="milestones" element={<Milestones />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="questions" element={<Questions />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </HashRouter>
  )
}
