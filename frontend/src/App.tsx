/**
 * 🌿 MAIN APP COMPONENT - Application Entry Point
 * 
 * LEARNING: This sets up routing and provides global context
 * 
 * STRUCTURE:
 * App
 *  └─ BrowserRouter (React Router - enables navigation)
 *      └─ ThemeProvider (Light/Dark mode state)
 *          └─ AuthProvider (User authentication state)
 *              └─ Routes (Route definitions)
 * 
 * REACT ROUTER BASICS:
 * - BrowserRouter: Enables client-side routing (no page reloads)
 * - Routes: Container for all route definitions
 * - Route: Maps a URL path to a component
 * - Navigate: Programmatic navigation/redirects
 * 
 * WHY THIS ORDER?
 * - BrowserRouter must be outermost (provides routing context)
 * - ThemeProvider before AuthProvider (theme available during login)
 * - AuthProvider wraps routes (auth state available everywhere)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Chat } from './pages/Chat';

/**
 * PROTECTED ROUTE COMPONENT
 * 
 * LEARNING: Higher-Order Component Pattern
 * - Wraps routes that require authentication
 * - Checks if user is logged in
 * - Redirects to login if not authenticated
 * 
 * @param children - Component to render if authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // LEARNING: Loading State
  // Show spinner while checking if user is logged in
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

  // LEARNING: Redirect if not authenticated
  // <Navigate> is like useNavigate().navigate() but for JSX
  // replace: true → replaces current history entry (can't go back)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
}

/**
 * PUBLIC ROUTE COMPONENT
 * 
 * LEARNING: Inverse of ProtectedRoute
 * - For login/register pages
 * - Redirects to chat if already logged in
 * - Prevents logged-in users from seeing login page
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
 * 
 * LEARNING: Route Configuration
 * - path: URL pattern to match
 * - element: Component to render at that path
 * - Wrap in ProtectedRoute or PublicRoute based on auth needs
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

      {/* LEARNING: Protected Routes (require authentication) */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
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
 * 
 * LEARNING: Provider Nesting
 * - Each provider wraps its children
 * - Inner components can access all outer contexts
 * - Order matters! (BrowserRouter → Theme → Auth → Routes)
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

/**
 * 🎓 LEARNING: How It All Works Together
 * 
 * COMPONENT TREE:
 * ```
 * App
 *  └─ BrowserRouter (React Router)
 *      └─ ThemeProvider (Light/Dark mode)
 *          └─ AuthProvider (User state)
 *              └─ AppRoutes
 *                  ├─ /login → PublicRoute → Login
 *                  ├─ /register → PublicRoute → Register
 *                  └─ /chat → ProtectedRoute → Chat
 * ```
 * 
 * USER FLOW:
 * 1. User visits app → Redirected to /chat
 * 2. ProtectedRoute checks auth → Not logged in
 * 3. Redirect to /login
 * 4. User fills login form → Clicks "Log In"
 * 5. Login component calls useAuth().login()
 * 6. AuthContext makes API call → Saves token → Updates state
 * 7. App re-renders with user state
 * 8. PublicRoute sees user logged in → Redirect to /chat
 * 9. ProtectedRoute sees user logged in → Show Chat component
 * 10. User can now chat! 🌿
 * 
 * KEY CONCEPTS:
 * - Context API: Share state across components
 * - Protected Routes: Guard pages that need authentication
 * - React Router: Navigate without page reloads
 * - Conditional Rendering: Show different UI based on state
 */

