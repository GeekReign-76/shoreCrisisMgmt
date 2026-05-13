import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPages.css";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await register(email, password, fullName, phone || undefined);
      navigate("/client");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <img src="/logo.png" alt="Shore Crisis Management" className="auth-logo" />
        <h2>Create Account</h2>
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label>Full Name *</label>
          <input className="form-input" required value={fullName}
            onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input className="form-input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input className="form-input" type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password *</label>
          <input className="form-input" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Confirm Password *</label>
          <input className="form-input" type="password" required value={confirm}
            onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>Create Account</button>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
