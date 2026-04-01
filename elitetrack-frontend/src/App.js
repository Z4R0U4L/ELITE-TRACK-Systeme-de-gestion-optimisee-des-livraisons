import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import DriverApp from './pages/DriverApp';
import TrackingPage from './pages/TrackingPage';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTop: '3px solid #CC0000', borderRadius: '50%' }}></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'merchant' ? '/dashboard' : '/driver'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'merchant' ? '/dashboard' : '/driver'} /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['merchant']}><MerchantDashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverApp /></ProtectedRoute>} />
      <Route path="/track/:token" element={<TrackingPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
