import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivateRoute } from './components/PrivateRoute';
import { AppProvider } from './components/AppContext';
import { HomePage } from './pages/HomePage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTPPage } from './pages/VerifyOTPPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OTPLoginPage } from './pages/OTPLoginPage';
import { Catalogue } from './pages/Catalogue';
import { BookDetails } from './pages/BookDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AdminLayout from './layouts/AdminLayout';
import { AdminDashboard } from './components/pages/admin/AdminDashboard';
import { AdminOrders } from './components/pages/admin/AdminOrders';
import { ProfilePage } from './components/pages/ProfilePage';
import { FirstLogin } from './pages/FirstLogin';
import { AdminUsers } from './components/pages/admin/AdminUsers';
import { AdminCatalog } from './components/pages/admin/AdminCatalog';
import { AdminNotifications } from './components/pages/admin/AdminNotifications';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const hideFooterRoutes = ['/admin', '/profile'];
  const showFooter = !hideFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col app-background">
      <Navbar />
      <main className="flex-1 page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp-login" element={<OTPLoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/first-login" element={<FirstLogin />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route
            path="/cart"
            element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivateRoute>
                <OrderDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute adminOnly>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PrivateRoute adminOnly>
                  <AdminLayout>
                    <AdminOrders />
                  </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <PrivateRoute adminOnly>
                  <AdminLayout>
                    <AdminCatalog />
                  </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <PrivateRoute adminOnly>
                  <AdminLayout>
                    <AdminNotifications />
                  </AdminLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppProvider>
          <Router>
            <AppLayout />
            <Toaster position="top-right" />
          </Router>
        </AppProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
