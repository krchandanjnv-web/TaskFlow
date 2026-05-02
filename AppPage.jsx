import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskFlowVibrant from "../components/TaskFlowVibrant";

/**
 * AppPage sits between the router and TaskFlowVibrant.
 *
 * Responsibilities:
 *  1. Pull the authenticated user from AuthContext.
 *  2. Pass user metadata (id, email, display name) into TaskFlowVibrant
 *     so it can personalise the UI and scope data fetches.
 *  3. Provide a signOut callback wired to Supabase + redirect to /login.
 */
export default function AppPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  // Derive a display name from user metadata (set during registration)
  // or fall back gracefully to the email prefix.
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <TaskFlowVibrant
      userId={user?.id}
      userEmail={user?.email}
      userName={displayName}
      onSignOut={handleSignOut}
    />
  );
}
