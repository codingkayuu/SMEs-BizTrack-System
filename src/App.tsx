import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  // Application Entry Point
  return (
    <Router>
      <AuthProvider>
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
