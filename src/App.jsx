import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Demo from './pages/Demo'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import NewOrder from './pages/NewOrder'
import Products from './pages/Products'
import Debts from './pages/Debts'
import Targets from './pages/Targets'
import VisitRoutes from './pages/VisitRoutes'
import Promotions from './pages/Promotions'
import Settings from './pages/Settings'

const STORE_MANAGER_ALLOWED = ['/', '/orders', '/orders/new', '/debts']

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <Navigate to="/" replace /> : children
}

function RoleRoute({ children, path }) {
  const { role, loading } = useAuth()
  if (loading) return <Spinner />
  if (role === 'store_manager' && !STORE_MANAGER_ALLOWED.includes(path)) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/demo" element={<Demo />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<RoleRoute path="/customers"><Customers /></RoleRoute>} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="products" element={<RoleRoute path="/products"><Products /></RoleRoute>} />
            <Route path="debts" element={<Debts />} />
            <Route path="targets" element={<RoleRoute path="/targets"><Targets /></RoleRoute>} />
            <Route path="visit-routes" element={<RoleRoute path="/visit-routes"><VisitRoutes /></RoleRoute>} />
            <Route path="promotions" element={<RoleRoute path="/promotions"><Promotions /></RoleRoute>} />
            <Route path="settings" element={<RoleRoute path="/settings"><Settings /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
