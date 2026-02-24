import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import ProtectedRoute from './components/shared/ProtectedRoute'

import LandingPage from './pages/Landing/index'
import Login from './pages/Auth/Login'

// Lazy pages
import { lazy, Suspense } from 'react'
import Spinner from './components/ui/Spinner'

const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ClientLayout = lazy(() => import('./components/layout/ClientLayout'))
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'))
const ClientDashboard = lazy(() => import('./pages/Client/Dashboard'))
const ClientBooking = lazy(() => import('./pages/Client/Booking/index'))
const ClientAppointments = lazy(() => import('./pages/Client/Appointments'))
const ClientProfile = lazy(() => import('./pages/Client/Profile'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const AdminSchedule = lazy(() => import('./pages/Admin/Schedule'))
const AdminProfessionals = lazy(() => import('./pages/Admin/Professionals'))
const AdminServices = lazy(() => import('./pages/Admin/Services'))
const AdminProducts = lazy(() => import('./pages/Admin/Products'))
const AdminClients = lazy(() => import('./pages/Admin/Clients'))
const AdminReports = lazy(() => import('./pages/Admin/Reports'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Client */}
            <Route element={<ProtectedRoute role="CLIENT" />}>
              <Route element={<ClientLayout />}>
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/client/booking" element={<ClientBooking />} />
                <Route path="/client/appointments" element={<ClientAppointments />} />
                <Route path="/client/profile" element={<ClientProfile />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute role="ADMIN" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/admin/professionals" element={<AdminProfessionals />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/clients" element={<AdminClients />} />
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111111', color: '#f5f5f5', border: '1px solid #1f1f1f' },
          success: { iconTheme: { primary: '#d4a853', secondary: '#0a0a0a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
        }}
      />
    </QueryClientProvider>
  )
}
