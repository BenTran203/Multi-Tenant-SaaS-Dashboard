/**
 * MAIN APP COMPONENT
 * 
 * LEARNING: This sets up routing and provides global context
 * 
 * REACT ROUTER:
 * - BrowserRouter: Enables routing in your app
 * - Routes: Container for all routes
 * - Route: Defines a route (path + component)
 * - Navigate: Redirect component
 * 
 * PROTECTED ROUTES:
 * - Some routes require authentication
 * - If not logged in, redirect to login page
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Chat } from './components/Chat';

/**
 * LEARNING: Protected Route Component
 * Wraps routes that require authentication
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Logged in, show the protected content
  return <>{children}</>;
};

/**
 * LEARNING: Public Route Component
 * Redirects to home if already logged in
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Already logged in, redirect to home
    return <Navigate to="/" replace />;
  }

  // Not logged in, show public page
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

/**
 * LEARNING: App Component Structure
 * 
 * App
 *  └─ BrowserRouter (enables routing)
 *      └─ AuthProvider (provides user state to all components)
 *          └─ AppRoutes
 *              ├─ / (Chat) - Protected
 *              ├─ /login - Public
 *              └─ /register - Public
 * 
 * DATA FLOW:
 * 1. User visits /
 * 2. ProtectedRoute checks if user is logged in
 * 3. If yes: Show Chat component
 * 4. If no: Redirect to /login
 * 5. User logs in
 * 6. AuthContext updates user state
 * 7. App re-renders
 * 8. ProtectedRoute sees user is logged in
 * 9. Shows Chat component
 */

