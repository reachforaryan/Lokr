import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Welcome } from './pages/Welcome'
import { FilesEnhanced as Files } from './pages/FilesEnhanced'
import { Settings } from './pages/Settings'
import { Admin } from './pages/Admin'
import { SharedFile } from './pages/SharedFile'
import { AuditLog } from './pages/AuditLog'
import { useAuth } from './hooks/useAuth'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const isOnboardingComplete = localStorage.getItem('onboarding_completed')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public shared file route - accessible without authentication */}
      <Route path="/shared/:token" element={<SharedFile />} />

      {/* Authenticated routes */}
      {!isAuthenticated ? (
        <>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </>
      ) : isAuthenticated && !isOnboardingComplete ? (
        <Route path="*" element={<Welcome />} />
      ) : (
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/files" element={<Files />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        } />
      )}
    </Routes>
  )
}

export default App