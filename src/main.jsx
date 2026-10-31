import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { Landing } from './components/Landing.jsx'
import { LoginPage } from './components/auth/Login.jsx'
import { SignupPage } from './components/auth/Signup.jsx'
import { ForgotPasswordPage } from './components/auth/ForgotPassword.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<App />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)