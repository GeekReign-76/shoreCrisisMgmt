import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import "./ClientsPage.css";

interface ClientRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  insurance_provider: string;
  created_at: string;
  total_appointments: string;
  confirmed_appointments: string;
  last_appointment: string;
  first_appointment: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/profiles").then((res) => {
      setClients(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.insurance_provider || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="clients-page">
      <div className="container">
        <div className="clients-header">
          <div>
            <h1>Clients</h1>
            <p className="clients-count">{clients.length} total clients</p>
          </div>
          <div className="search-bar">
            <input
              className="form-input"
              placeholder="Search by name, email, or insurance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="clients-grid">
          {filtered.map((c) => (
            <Link to={`/profile/${c.id}`} key={c.id} className="card client-card-link">
              <div className="client-row-avatar">
                {c.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="client-row-info">
                <h3>{c.full_name}</h3>
                <p className="client-row-email">{c.email}</p>
                <div className="client-row-meta">
                  {c.phone && <span>{c.phone}</span>}
                  {c.insurance_provider && <span className="client-insurance-tag">{c.insurance_provider}</span>}
                </div>
              </div>
              <div className="client-row-stats">
                <div className="mini-stat">
                  <span className="mini-stat-num">{c.total_appointments}</span>
                  <span className="mini-stat-label">Appts</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-num">{c.confirmed_appointments}</span>
                  <span className="mini-stat-label">Confirmed</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-num">
                    {c.last_appointment
                      ? new Date(c.last_appointment).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </span>
                  <span className="mini-stat-label">Last Visit</span>
                </div>
              </div>
              <div className="client-row-actions">
                <span className="view-arrow">&rarr;</span>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <p className="empty-state">
              {search ? "No clients match your search." : "No clients registered yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
