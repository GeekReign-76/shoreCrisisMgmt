import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPages.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const loggedInUser = await login(email, password);
      const dest = loggedInUser.role === "admin" ? "/admin" :
                   loggedInUser.role === "owner" ? "/dashboard" : "/client";
      navigate(dest);
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <img src="/logo.png" alt="Shore Crisis Management" className="auth-logo" />
        <h2>Sign In</h2>
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input className="form-input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-input" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>Sign In</button>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
