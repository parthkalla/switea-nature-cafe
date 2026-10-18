import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { MenuPage } from './pages/public/MenuPage';
import { CartPage } from './pages/public/CartPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { OrderStatusPage } from './pages/public/OrderStatusPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminKitchen } from './pages/admin/AdminKitchen';
import { AdminTables } from './pages/admin/AdminTables';
import { AdminMenu } from './pages/admin/AdminMenu';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOffers } from './pages/admin/AdminOffers';
import { AdminBranding } from './pages/admin/AdminBranding';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminTeam } from './pages/admin/AdminTeam';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminModifiers } from './pages/admin/AdminModifiers';
import { AdminCustomers } from './pages/admin/AdminCustomers';

// Super Admin Pages
import { SuperAdminLoginPage } from './pages/superAdmin/SuperAdminLoginPage';
import { SuperAdminDashboard } from './pages/superAdmin/SuperAdminDashboard';
import { SuperAdminRestaurants } from './pages/superAdmin/SuperAdminRestaurants';
import { SuperAdminUsers } from './pages/superAdmin/SuperAdminUsers';
import { SuperAdminPlans } from './pages/superAdmin/SuperAdminPlans';
import { SuperAdminAuditLogs } from './pages/superAdmin/SuperAdminAuditLogs';
import { SuperAdminAnalytics } from './pages/superAdmin/SuperAdminAnalytics';
import { SuperAdminSettings } from './pages/superAdmin/SuperAdminSettings';

// Protected Route Helpers
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const ProtectedSuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <Navigate to="/super-admin/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menu/:restaurantSlug" element={<MenuPage />} />
            <Route path="/menu/:restaurantSlug/table/:tableToken" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderToken" element={<OrderStatusPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/terms-and-conditions" element={<TermsPage />} />

            {/* Restaurant Administration */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
            <Route path="/admin/kitchen" element={<ProtectedAdminRoute><AdminKitchen /></ProtectedAdminRoute>} />
            <Route path="/admin/tables" element={<ProtectedAdminRoute><AdminTables /></ProtectedAdminRoute>} />
            <Route path="/admin/qr-codes" element={<ProtectedAdminRoute><AdminTables /></ProtectedAdminRoute>} />
            <Route path="/admin/menu" element={<ProtectedAdminRoute><AdminMenu /></ProtectedAdminRoute>} />
            <Route path="/admin/categories" element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
            <Route path="/admin/modifiers" element={<ProtectedAdminRoute><AdminModifiers /></ProtectedAdminRoute>} />
            <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomers /></ProtectedAdminRoute>} />
            <Route path="/admin/offers" element={<ProtectedAdminRoute><AdminOffers /></ProtectedAdminRoute>} />
            <Route path="/admin/branding" element={<ProtectedAdminRoute><AdminBranding /></ProtectedAdminRoute>} />
            <Route path="/admin/gallery" element={<ProtectedAdminRoute><AdminGallery /></ProtectedAdminRoute>} />
            <Route path="/admin/profile" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
            <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
            <Route path="/admin/reviews" element={<ProtectedAdminRoute><AdminReviews /></ProtectedAdminRoute>} />
            <Route path="/admin/team" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
            <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>} />

            {/* Super Admin Platform */}
            <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<ProtectedSuperAdminRoute><SuperAdminDashboard /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/restaurants" element={<ProtectedSuperAdminRoute><SuperAdminRestaurants /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/users" element={<ProtectedSuperAdminRoute><SuperAdminUsers /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/plans" element={<ProtectedSuperAdminRoute><SuperAdminPlans /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/subscriptions" element={<ProtectedSuperAdminRoute><SuperAdminPlans /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/analytics" element={<ProtectedSuperAdminRoute><SuperAdminAnalytics /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/audit-logs" element={<ProtectedSuperAdminRoute><SuperAdminAuditLogs /></ProtectedSuperAdminRoute>} />
            <Route path="/super-admin/settings" element={<ProtectedSuperAdminRoute><SuperAdminSettings /></ProtectedSuperAdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
