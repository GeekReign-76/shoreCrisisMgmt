import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Breadcrumbs.css";

interface Crumb {
  label: string;
  path?: string;
}

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/services": "Services",
  "/insurance": "Insurance",
  "/crisis": "Crisis Help",
  "/contact": "Contact",
  "/login": "Login",
  "/register": "Register",
  "/dashboard": "Dashboard",
  "/client": "My Dashboard",
  "/clients": "Clients",
  "/booking": "Book Appointment",
  "/messages": "Messages",
  "/reports": "Reports",
  "/settings": "Settings",
  "/admin": "Admin",
  "/my-profile": "My Profile",
};

// Pages where breadcrumbs are not needed
const hiddenRoutes = ["/", "/login", "/register"];

export default function Breadcrumbs() {
  const location = useLocation();
  const { userId } = useParams();
  const { isOwner } = useAuth();

  if (hiddenRoutes.includes(location.pathname)) return null;

  const crumbs: Crumb[] = [{ label: "Home", path: "/" }];

  const path = location.pathname;

  // Build contextual breadcrumbs based on the current path
  if (path.startsWith("/profile/")) {
    if (isOwner()) {
      crumbs.push({ label: "Clients", path: "/clients" });
    }
    crumbs.push({ label: "Client Profile" });
  } else if (path === "/messages") {
    const home = isOwner() ? { label: "Dashboard", path: "/dashboard" } : { label: "My Dashboard", path: "/client" };
    crumbs.push(home);
    crumbs.push({ label: "Messages" });
  } else if (path === "/booking") {
    crumbs.push({ label: "My Dashboard", path: "/client" });
    crumbs.push({ label: "Book Appointment" });
  } else if (path === "/my-profile") {
    crumbs.push({ label: "My Dashboard", path: "/client" });
    crumbs.push({ label: "My Profile" });
  } else if (path === "/clients") {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
    crumbs.push({ label: "Clients" });
  } else if (path === "/reports") {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
    crumbs.push({ label: "Reports" });
  } else if (path === "/settings") {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
    crumbs.push({ label: "Settings" });
  } else if (path === "/admin") {
    crumbs.push({ label: "Admin" });
  } else if (path === "/dashboard") {
    crumbs.push({ label: "Dashboard" });
  } else if (path === "/client") {
    crumbs.push({ label: "My Dashboard" });
  } else {
    const label = routeLabels[path] || path.slice(1);
    crumbs.push({ label });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container breadcrumbs-inner">
        {crumbs.map((crumb, i) => (
          <span key={i} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            {crumb.path && i < crumbs.length - 1 ? (
              <Link to={crumb.path} className="breadcrumb-link">{crumb.label}</Link>
            ) : (
              <span className="breadcrumb-current">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
