/**
 * 🌿 MAIN APP COMPONENT - Application Entry Point
 * 
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ServerThemeProvider } from './contexts/ServerThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Chat } from './pages/Chat';
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPass } from './pages/Forgotpass';
import { Profile } from './pages/Profile';
import { ServerSettings } from './pages/ServerSettings';

/**
 * PROTECTED ROUTE COMPONENT
 * @param children - Component to render if authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // LEARNING: Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-nature-cream dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce-gentle">🌿</div>
          <div className="font-pixel text-grass-600 dark:text-grass-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  //Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
}

/**
 * PUBLIC ROUTE COMPONENT
 * 
 * @param children - Component to render if NOT authenticated
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-nature-cream dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce-gentle">🌿</div>
          <div className="font-pixel text-grass-600 dark:text-grass-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Already logged in, redirect to chat
  if (user) {
    return <Navigate to="/chat" replace />;
  }

  // Not logged in, show login/register page
  return <>{children}</>;
}

/**
 * APP ROUTES
 */
function AppRoutes() {
  return (
    <Routes>
      {/* LEARNING: Public Routes (login/register) */}
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
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPass />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* LEARNING: Protected Routes (require authentication) */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/server/:serverId/settings"
        element={
          <ProtectedRoute>
            <ServerSettings />
          </ProtectedRoute>
        }
      />

      {/* LEARNING: Catch-all Route */}
      {/* Redirects any unknown URLs to /chat */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

/**
 * MAIN APP COMPONENT
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ServerThemeProvider>
          <AuthProvider>
            <PresenceProvider>
              <AppRoutes />
            </PresenceProvider>
          </AuthProvider>
        </ServerThemeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;


