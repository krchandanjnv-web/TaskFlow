import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute  from "./components/ProtectedRoute";
import LoginPage       from "./pages/LoginPage";
import AppPage         from "./pages/AppPage";

/**
 * Root of the application.
 *
 * Route map:
 *   /           → redirect to /app
 *   /login      → LoginPage   (public)
 *   /app        → AppPage     (protected — requires Supabase session)
 *   *           → redirect to /app
 *
 * AuthProvider wraps BrowserRouter so every descendant
 * (including router hooks) can read the auth context.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="/"  element={<Navigate to="/app" replace />} />
          <Route path="*"  element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
