import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Admin can access owner pages too
  if (role) {
    const allowed = user.role === role || (user.role === "admin" && role === "owner");
    if (!allowed) {
      return <Navigate to={user.role === "admin" ? "/admin" : user.role === "owner" ? "/dashboard" : "/client"} />;
    }
  }

  return <>{children}</>;
}
