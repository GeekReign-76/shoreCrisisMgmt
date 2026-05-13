import { useState, useEffect } from "react";
import api from "../api/client";
import "./AdminPage.css";

interface Rate {
  id: number;
  name: string;
  rate_per_hour: string;
  is_default: boolean;
}

interface TestStatus {
  hasTestData: boolean;
  testUserCount: number;
  testAppointmentCount: number;
}

const SHOW_TEST_MODE = import.meta.env.VITE_SHOW_TEST_MODE === "true";

export default function AdminPage() {
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [newRate, setNewRate] = useState({ name: "", ratePerHour: "", isDefault: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [seedResult, setSeedResult] = useState<any>(null);

  useEffect(() => {
    if (SHOW_TEST_MODE) {
      api.get("/admin/test-status").then((res) => setTestStatus(res.data));
    }
    api.get("/rates").then((res) => setRates(res.data));
  }, []);

  const seedTestData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/admin/seed-test-data");
      setSeedResult(res.data.stats);
      setMessage("Test data seeded successfully!");
      const statusRes = await api.get("/admin/test-status");
      setTestStatus(statusRes.data);
    } catch {
      setMessage("Failed to seed test data");
    }
    setLoading(false);
  };

  const clearTestData = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.delete("/admin/test-data");
      setMessage("Test data cleared!");
      setSeedResult(null);
      const statusRes = await api.get("/admin/test-status");
      setTestStatus(statusRes.data);
    } catch {
      setMessage("Failed to clear test data");
    }
    setLoading(false);
  };

  const addRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/rates", {
        name: newRate.name,
        ratePerHour: parseFloat(newRate.ratePerHour),
        isDefault: newRate.isDefault,
      });
      setRates((prev) => [...prev, res.data]);
      setNewRate({ name: "", ratePerHour: "", isDefault: false });
    } catch {
      setMessage("Failed to add rate");
    }
  };

  const deleteRate = async (id: number) => {
    await api.delete(`/rates/${id}`);
    setRates((prev) => prev.filter((r) => r.id !== id));
  };

  const setDefault = async (id: number) => {
    await api.patch(`/rates/${id}`, { isDefault: true });
    setRates((prev) => prev.map((r) => ({ ...r, is_default: r.id === id })));
  };

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Admin Panel</h1>

        {message && (
          <div className="card admin-message">{message}</div>
        )}

        {/* Test Mode Section — only visible in dev/demo builds */}
        {SHOW_TEST_MODE && (
          <section className="admin-section">
            <h2>Test Mode</h2>
            <p className="section-desc">
              Seed realistic test data to preview the app with sample clients, appointments, messages, notes, and reports.
              Use the data mode toggle on the Reports page to switch between test and real data views.
            </p>

            <div className="card test-mode-card">
              <div className="test-status">
                <div className="test-indicator">
                  <div className={`status-dot ${testStatus?.hasTestData ? "active" : ""}`} />
                  <span>{testStatus?.hasTestData ? "Test data is loaded" : "No test data"}</span>
                </div>
                {testStatus?.hasTestData && (
                  <div className="test-counts">
                    <span>{testStatus.testUserCount} test clients</span>
                    <span>{testStatus.testAppointmentCount} test appointments</span>
                  </div>
                )}
              </div>

              <div className="test-actions">
                <button className="btn btn-primary" onClick={seedTestData} disabled={loading}>
                  {loading ? "Working..." : testStatus?.hasTestData ? "Reseed Test Data" : "Generate Test Data"}
                </button>
                {testStatus?.hasTestData && (
                  <button className="btn btn-danger" onClick={clearTestData} disabled={loading}>
                    Clear Test Data
                  </button>
                )}
              </div>

              {seedResult && (
                <div className="seed-result">
                  <h4>Seeded:</h4>
                  <div className="seed-stats">
                    <span>{seedResult.clients} clients</span>
                    <span>{seedResult.appointments} appointments</span>
                    <span>{seedResult.sessionNotes} session notes</span>
                    <span>{seedResult.messages} messages</span>
                    <span>{seedResult.contactSubmissions} contact forms</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Rate Settings */}
        <section className="admin-section">
          <h2>Revenue Rate Settings</h2>
          <p className="section-desc">
            Configure hourly rates. When an appointment is marked as "completed," the fee is automatically
            calculated using the default rate and the session duration.
          </p>

          <form className="card rate-form" onSubmit={addRate}>
            <div className="rate-row">
              <div className="form-group">
                <label>Rate Name</label>
                <input className="form-input" required value={newRate.name} placeholder="e.g., Standard Session"
                  onChange={(e) => setNewRate({ ...newRate, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Rate per Hour ($)</label>
                <input className="form-input" type="number" step="0.01" required value={newRate.ratePerHour}
                  placeholder="150.00"
                  onChange={(e) => setNewRate({ ...newRate, ratePerHour: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={newRate.isDefault}
                    onChange={(e) => setNewRate({ ...newRate, isDefault: e.target.checked })} />
                  Default
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Add Rate</button>
            </div>
          </form>

          <div className="rates-list">
            {rates.map((r) => (
              <div key={r.id} className={`card rate-card ${r.is_default ? "default" : ""}`}>
                <div className="rate-info">
                  <strong>{r.name}</strong>
                  <span className="rate-amount">${parseFloat(r.rate_per_hour).toFixed(2)}/hr</span>
                  {r.is_default && <span className="badge badge-confirmed">Default</span>}
                </div>
                <div className="rate-actions">
                  {!r.is_default && (
                    <button className="btn btn-outline btn-sm" onClick={() => setDefault(r.id)}>Set Default</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => deleteRate(r.id)}>Delete</button>
                </div>
              </div>
            ))}
            {rates.length === 0 && <p className="empty-state">No rates configured. Add one above — the default rate is used for auto-calculating fees.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
