import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import DictionaryPage from './pages/DictionaryPage.jsx'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/app" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>
  if (user) return <Navigate to="/app" replace />
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/login"       element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"    element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/app"         element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/practice"    element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="/dictionary"  element={<ProtectedRoute><DictionaryPage /></ProtectedRoute>} />
          <Route path="/admin"       element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
