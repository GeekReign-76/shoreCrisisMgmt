import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import "./ReportsPage.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHOW_TEST_MODE = import.meta.env.VITE_SHOW_TEST_MODE === "true";

export default function ReportsPage() {
  const [tab, setTab] = useState<"appointments" | "clients" | "revenue">("appointments");
  // In production (test mode hidden) always show real data; in dev/demo allow toggling
  const [dataMode, setDataMode] = useState<"all" | "real" | "test">(SHOW_TEST_MODE ? "all" : "real");
  const [apptData, setApptData] = useState<any>(null);
  const [clientData, setClientData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);

  // Reload data whenever tab or dataMode changes
  useEffect(() => {
    const suffix = `?mode=${dataMode}`;
    if (tab === "appointments") {
      api.get(`/reports/appointments${suffix}`).then((res) => setApptData(res.data));
    }
    if (tab === "clients") {
      api.get(`/reports/clients${suffix}`).then((res) => setClientData(res.data));
    }
    if (tab === "revenue") {
      api.get(`/reports/revenue${suffix}`).then((res) => setRevenueData(res.data));
    }
  }, [tab, dataMode]);

  return (
    <div className="reports-page">
      <div className="container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          {SHOW_TEST_MODE && (
            <div className="data-mode-toggle">
              <span className="toggle-label">Data:</span>
              <button className={`toggle-btn ${dataMode === "all" ? "active" : ""}`} onClick={() => setDataMode("all")}>All</button>
              <button className={`toggle-btn ${dataMode === "real" ? "active" : ""}`} onClick={() => setDataMode("real")}>Real</button>
              <button className={`toggle-btn test ${dataMode === "test" ? "active" : ""}`} onClick={() => setDataMode("test")}>Test</button>
            </div>
          )}
        </div>

        <div className="report-tabs">
          <button className={`tab ${tab === "appointments" ? "active" : ""}`} onClick={() => setTab("appointments")}>
            Appointments
          </button>
          <button className={`tab ${tab === "clients" ? "active" : ""}`} onClick={() => setTab("clients")}>
            Client Activity
          </button>
          <button className={`tab ${tab === "revenue" ? "active" : ""}`} onClick={() => setTab("revenue")}>
            Revenue
          </button>
        </div>

        {/* Appointment Analytics */}
        {tab === "appointments" && apptData && (
          <div className="report-content">
            <div className="stats-row">
              <div className="card stat-card">
                <span className="stat-number">{apptData.today}</span>
                <span className="stat-label">Today</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{apptData.thisWeek}</span>
                <span className="stat-label">This Week</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{apptData.totals.total}</span>
                <span className="stat-label">All Time</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{apptData.totals.confirmed}</span>
                <span className="stat-label">Confirmed</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{apptData.totals.cancelled}</span>
                <span className="stat-label">Cancelled</span>
              </div>
            </div>

            {/* Monthly trend */}
            <div className="card">
              <h3>Monthly Appointment Volume</h3>
              <div className="bar-chart">
                {apptData.monthly.map((m: any) => {
                  const maxVal = Math.max(...apptData.monthly.map((x: any) => parseInt(x.total)), 1);
                  const height = (parseInt(m.total) / maxVal) * 100;
                  const [year, month] = m.month.split("-");
                  return (
                    <div key={m.month} className="bar-group">
                      <div className="bar" style={{ height: `${height}%` }}>
                        <span className="bar-value">{m.total}</span>
                      </div>
                      <span className="bar-label">{MONTHS[parseInt(month) - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="report-grid">
              <div className="card">
                <h3>Busiest Days</h3>
                <div className="rank-list">
                  {apptData.byDayOfWeek.map((d: any) => (
                    <div key={d.day_of_week} className="rank-item">
                      <span className="rank-name">{DAYS[d.day_of_week]}</span>
                      <div className="rank-bar-bg">
                        <div className="rank-bar" style={{
                          width: `${(parseInt(d.count) / Math.max(...apptData.byDayOfWeek.map((x: any) => parseInt(x.count)), 1)) * 100}%`
                        }} />
                      </div>
                      <span className="rank-count">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Busiest Hours</h3>
                <div className="rank-list">
                  {apptData.byHour.slice(0, 8).map((h: any) => {
                    const hour = parseInt(h.hour);
                    const label = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
                    return (
                      <div key={h.hour} className="rank-item">
                        <span className="rank-name">{label}</span>
                        <div className="rank-bar-bg">
                          <div className="rank-bar" style={{
                            width: `${(parseInt(h.count) / Math.max(...apptData.byHour.map((x: any) => parseInt(x.count)), 1)) * 100}%`
                          }} />
                        </div>
                        <span className="rank-count">{h.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Activity */}
        {tab === "clients" && (
          <div className="report-content">
            <div className="card">
              <h3>Client Activity Overview</h3>
              <p style={{ color: "var(--color-text-light)", marginBottom: "var(--space-4)" }}>
                {clientData.length} total clients
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Since</th>
                    <th>Appointments</th>
                    <th>Cancelled</th>
                    <th>Messages</th>
                    <th>Total Fees</th>
                    <th>Last Visit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientData.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.full_name}</strong>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-light)" }}>{c.email}</div>
                      </td>
                      <td>{c.member_since ? new Date(c.member_since).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</td>
                      <td>{c.confirmed}</td>
                      <td>{c.cancelled}</td>
                      <td>{c.total_messages}</td>
                      <td>{parseFloat(c.total_fees) > 0 ? `$${parseFloat(c.total_fees).toFixed(2)}` : "—"}</td>
                      <td>{c.last_visit ? new Date(c.last_visit).toLocaleDateString() : "—"}</td>
                      <td>
                        <Link to={`/profile/${c.id}`} className="btn btn-outline btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue */}
        {tab === "revenue" && revenueData && (
          <div className="report-content">
            <div className="stats-row">
              <div className="card stat-card">
                <span className="stat-number">${parseFloat(revenueData.totals.total_revenue).toFixed(2)}</span>
                <span className="stat-label">Total Revenue</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">${parseFloat(revenueData.totals.paid_revenue).toFixed(2)}</span>
                <span className="stat-label">Paid</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">${parseFloat(revenueData.totals.pending_revenue).toFixed(2)}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{revenueData.totals.paid_count}</span>
                <span className="stat-label">Paid Sessions</span>
              </div>
            </div>

            {/* Monthly revenue chart */}
            <div className="card">
              <h3>Monthly Revenue</h3>
              <div className="bar-chart">
                {revenueData.monthly.map((m: any) => {
                  const maxVal = Math.max(...revenueData.monthly.map((x: any) => parseFloat(x.revenue)), 1);
                  const height = (parseFloat(m.revenue) / maxVal) * 100;
                  const [year, month] = m.month.split("-");
                  return (
                    <div key={m.month} className="bar-group">
                      <div className="bar revenue-bar" style={{ height: `${height}%` }}>
                        <span className="bar-value">${parseFloat(m.revenue).toFixed(0)}</span>
                      </div>
                      <span className="bar-label">{MONTHS[parseInt(month) - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By insurance */}
            <div className="card">
              <h3>Revenue by Insurance Provider</h3>
              <div className="rank-list">
                {revenueData.byInsurance.map((ins: any) => (
                  <div key={ins.provider} className="rank-item">
                    <span className="rank-name">{ins.provider}</span>
                    <div className="rank-bar-bg">
                      <div className="rank-bar revenue-bar" style={{
                        width: `${(parseFloat(ins.revenue) / Math.max(...revenueData.byInsurance.map((x: any) => parseFloat(x.revenue)), 1)) * 100}%`
                      }} />
                    </div>
                    <span className="rank-count">${parseFloat(ins.revenue).toFixed(2)} ({ins.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "appointments" && !apptData && <p className="empty-state">Loading...</p>}
        {tab === "revenue" && !revenueData && <p className="empty-state">Loading...</p>}
      </div>
    </div>
  );
}
