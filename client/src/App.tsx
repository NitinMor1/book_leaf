import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';

import { Login } from './pages/Login';
import { MyBooks } from './pages/author/MyBooks';
import { SubmitTicket } from './pages/author/SubmitTicket';
import { MyTickets } from './pages/author/MyTickets';
import { AuthorTicketDetail } from './pages/author/TicketDetail';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTicketQueue } from './pages/admin/AdminTicketQueue';
import { AdminTicketDetail } from './pages/admin/AdminTicketDetail';
import { AuthorDirectory } from './pages/admin/AuthorDirectory';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'AUTHOR' | 'ADMIN';
}> = ({ children, allowedRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/author/books'} replace />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] pb-12">{children}</main>
    </>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/author/books'} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Author Portal Routes */}
            <Route
              path="/author/books"
              element={
                <ProtectedRoute allowedRole="AUTHOR">
                  <MyBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/author/submit"
              element={
                <ProtectedRoute allowedRole="AUTHOR">
                  <SubmitTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/author/tickets"
              element={
                <ProtectedRoute allowedRole="AUTHOR">
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/author/tickets/:id"
              element={
                <ProtectedRoute allowedRole="AUTHOR">
                  <AuthorTicketDetail />
                </ProtectedRoute>
              }
            />

            {/* Admin Portal Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminTicketQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets/:id"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminTicketDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/authors"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AuthorDirectory />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
