import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps any route that requires authentication.
 * - While session is loading (undefined) → shows a minimal splash so
 *   the page doesn't flash to /login on refresh.
 * - If no session → redirects to /login, preserving the attempted URL.
 * - If authenticated → renders children.
 */
export default function ProtectedRoute({ children }) {
  const { session } = useAuth();
  const location    = useLocation();

  // Still resolving the persisted session from Supabase
  if (session === undefined) {
    return (
      <div style={styles.splash}>
        <div style={styles.dot} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/* ── Minimal splash loader — matches TaskFlow's cream surface ── */
const styles = {
  splash: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FDFAF6",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#FF8A73",
    animation: "pulse 1.2s ease-in-out infinite",
  },
};
