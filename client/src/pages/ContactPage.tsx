import { useState } from "react";
import api from "../api/client";
import "./ContactPage.css";

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "", diagnosis: "", dob: "", insuranceProvider: "",
    contactMethod: "phone", contactValue: "", reason: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/contact/submit", form);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    }
  };

  if (submitted) {
    return (
      <div className="contact-page">
        <div className="page-header">
          <div className="container">
            <h1>Contact Us</h1>
            <p>We're here to help</p>
          </div>
        </div>
        <div className="container section">
          <div className="card success-card">
            <h2>Thank You</h2>
            <p>Your submission has been received. A member of our team will be in touch soon.</p>
            <p>If this is an emergency, please call <strong>911</strong> or <strong>988</strong>.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Reach out — we're ready to help</p>
        </div>
      </div>

      <section className="container section">
        <div className="contact-grid">
          <form className="card contact-form" onSubmit={handleSubmit}>
            <h2>Intake Form</h2>
            <p className="hipaa-notice">
              This form is for initial contact only. All information is kept confidential
              in accordance with HIPAA regulations.
            </p>

            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-input" required value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input className="form-input" type="date" value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Mental Health Concern / Diagnosis</label>
              <textarea className="form-input" value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="Briefly describe what you're experiencing" />
            </div>

            <div className="form-group">
              <label>Insurance Provider</label>
              <select className="form-input" value={form.insuranceProvider}
                onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}>
                <option value="">Select provider...</option>
                <option>Aetna</option>
                <option>BlueCross BlueShield</option>
                <option>Carolina Complete</option>
                <option>Vaya Health</option>
                <option>Alliance Health</option>
                <option>Other</option>
                <option>No Insurance</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Contact Method *</label>
              <select className="form-input" value={form.contactMethod}
                onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone Number or Email *</label>
              <input className="form-input" required value={form.contactValue}
                onChange={(e) => setForm({ ...form, contactValue: e.target.value })}
                placeholder={form.contactMethod === "email" ? "your@email.com" : "(xxx) xxx-xxxx"} />
            </div>

            <div className="form-group">
              <label>Reason for Reaching Out</label>
              <textarea className="form-input" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Tell us how we can help" />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Submit
            </button>
          </form>

          <div className="contact-info">
            <div className="card">
              <h3>Get In Touch</h3>
              <div className="contact-item">
                <strong>Email</strong>
                <p>Shorecrisis35@gmail.com</p>
              </div>
              <div className="contact-item">
                <strong>Address</strong>
                <p>227 W 4th St, Suite LL102<br />Charlotte, NC 28202</p>
              </div>
              <div className="contact-item">
                <strong>Hours</strong>
                <p>Available 24 Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
