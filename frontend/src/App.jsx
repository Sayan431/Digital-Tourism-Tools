import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KPIManagement from './pages/KPIManagement';
import CRM from './pages/CRM';
import Experiences from './pages/Experiences';
import Bookings from './pages/Bookings';
import Workflows from './pages/Workflows';
import AnalyticsReports from './pages/AnalyticsReports';
import Organizations from './pages/Organizations';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2376A8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="kpis" element={<KPIManagement />} />
              <Route path="crm" element={<CRM />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="reports" element={<AnalyticsReports />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
