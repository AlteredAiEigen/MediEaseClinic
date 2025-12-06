import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, UserRole } from "@/context/auth-context";
import { MediEaseLoader } from "@/components/mediease-loader";

type RoleRequirement = UserRole | UserRole[];

interface RequireAuthProps {
  children: ReactNode;
  role?: RoleRequirement;
}

const roleDefaultRoutes: Record<UserRole, string> = {
  admin: "/admin-dashboard",
  doctor: "/doctor-dashboard",
  receptionist: "/receptionist-dashboard",
};

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, initialized, loading } = useAuth();
  const location = useLocation();
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;

  if (!initialized || loading) {
    return <MediEaseLoader message="Loading your workspace..." fullScreen />;
  }

  if (!user) {
    const targetRole =
      Array.isArray(role) ? role[0] ?? "doctor" : role ?? "doctor";
    return (
      <Navigate
        to={`/auth?role=${targetRole}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoute = roleDefaultRoutes[user.role] ?? "/";
    return <Navigate to={defaultRoute} replace />;
  }
  return <>{children}</>;
}

