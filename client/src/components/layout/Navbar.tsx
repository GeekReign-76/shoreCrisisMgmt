import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout, isOwner } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  const navLink = (to: string, label: string) => (
    <Link to={to} onClick={closeMenu} className={location.pathname === to ? "active" : ""}>{label}</Link>
  );

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <img src="/logo.png" alt="Shore Crisis Management" className="navbar-logo" />
          <span className="navbar-title">Shore Crisis Management</span>
        </Link>

        <div className="navbar-right-controls">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"}>
            {dark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        </button>
        </div>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {navLink("/services", "Services")}
          {navLink("/insurance", "Insurance")}
          {navLink("/crisis", "Crisis Help")}
          {navLink("/contact", "Contact")}

          {user ? (
            <>
              <div className="nav-divider" />
              {user.role === "admin" ? (
                <>
                  {navLink("/admin", "Admin")}
                  {navLink("/dashboard", "Dashboard")}
                  {navLink("/clients", "Clients")}
                  {navLink("/messages", "Messages")}
                  {navLink("/reports", "Reports")}
                  {navLink("/settings", "Settings")}
                </>
              ) : isOwner() ? (
                <>
                  {navLink("/dashboard", "Dashboard")}
                  {navLink("/clients", "Clients")}
                  {navLink("/messages", "Messages")}
                  {navLink("/reports", "Reports")}
                  {navLink("/settings", "Settings")}
                </>
              ) : (
                <>
                  {navLink("/client", "My Dashboard")}
                  {navLink("/booking", "Book")}
                  {navLink("/messages", "Messages")}
                  {navLink("/my-profile", "Profile")}
                </>
              )}
              <button onClick={handleLogout} className="btn btn-outline btn-sm nav-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="nav-divider" />
              <Link to="/login" onClick={closeMenu} className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      </div>
    </nav>
  );
}
