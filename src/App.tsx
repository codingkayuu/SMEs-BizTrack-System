import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

import { InvoiceListPage } from './pages/invoices/InvoiceListPage';
import { InvoiceFormPage } from './pages/invoices/InvoiceFormPage';

import { CustomerListPage } from './pages/customers/CustomerListPage';
import { IncomeListPage } from './pages/income/IncomeListPage';
import { ExpenseListPage } from './pages/expenses/ExpenseListPage';

import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Admin Portal Imports
import { AdminLoginPage } from './pages/admin/auth/AdminLoginPage';
import { AdminSignupPage } from './pages/admin/auth/AdminSignupPage';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/dashboard/AdminDashboardPage';
import { BusinessListPage } from './pages/admin/businesses/BusinessListPage';
import { BusinessDetailPage } from './pages/admin/businesses/BusinessDetailPage';
import { FinancialOverviewPage } from './pages/admin/analytics/FinancialOverviewPage';
import { TransactionBrowserPage } from './pages/admin/analytics/TransactionBrowserPage';
import { AdminManagementPage } from './pages/admin/system/AdminManagementPage';
import { AnnouncementsPage } from './pages/admin/system/AnnouncementsPage';
import { SettingsPage as AdminSettingsPage } from './pages/admin/system/SettingsPage';

function App() {
  // Application Entry Point
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider>
            {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
              <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm font-bold z-50">
                WARNING: Supabase Environment Variables are missing! Check your .env setup.
              </div>
            )}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes (Wrapped in Layout) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/invoices" element={<InvoiceListPage />} />
                  <Route path="/invoices/new" element={<InvoiceFormPage />} />
                  <Route path="/invoices/:id" element={<InvoiceFormPage />} />
                  <Route path="/income" element={<IncomeListPage />} />
                  <Route path="/expenses" element={<ExpenseListPage />} />
                  <Route path="/customers" element={<CustomerListPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Admin Portal Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/signup" element={<AdminSignupPage />} />

              <Route path="/admin" element={<AdminProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="businesses" element={<BusinessListPage />} />
                  <Route path="businesses/:id" element={<BusinessDetailPage />} />
                  <Route path="analytics" element={<FinancialOverviewPage />} />
                  <Route path="transactions" element={<TransactionBrowserPage />} />
                  <Route path="users" element={<AdminManagementPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
