import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

// Public routes
import MenuPage from '@/pages/MenuPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Protected routes
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminMenu from '@/pages/admin/Menu'
import AdminOrders from '@/pages/admin/Orders'
import AdminCustomers from '@/pages/admin/Customers'
import AdminSettings from '@/pages/admin/Settings'
import AdminDelivery from '@/pages/admin/Delivery'
import AdminMessages from '@/pages/admin/Messages'

// Customer routes
import CustomerProfile from '@/pages/customer/Profile'
import CustomerOrders from '@/pages/customer/Orders'
import CustomerStores from '@/pages/customer/Stores'
import CustomerCart from '@/pages/customer/Cart'

import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/components/admin/AdminLayout'
import CustomerLayout from '@/components/customer/CustomerLayout'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/store/:slug" element={<MenuPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminMenu />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminOrders />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminCustomers />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/delivery"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminDelivery />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminMessages />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Customer routes */}
            <Route
              path="/stores"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerStores />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerCart />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerOrders />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerProfile />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
