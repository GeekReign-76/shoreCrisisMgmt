import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useSocket } from "../contexts/SocketContext";
import { Appointment } from "../types";
import { format } from "date-fns";
import "./Dashboard.css";

export default function ClientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    api.get("/appointments").then((res) => {
      setAppointments(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: { appointment: Appointment }) => {
      setAppointments((prev) => {
        const idx = prev.findIndex((a) => a.id === data.appointment.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.appointment;
          return updated;
        }
        return [data.appointment, ...prev];
      });
    };
    socket.on("appointment:updated", handler);
    return () => { socket.off("appointment:updated", handler); };
  }, [socket]);

  const upcoming = appointments.filter(
    (a) => (a.status === "confirmed" || a.status === "pending") && new Date(a.start_time) > new Date()
  );
  const past = appointments.filter(
    (a) => new Date(a.start_time) <= new Date() || a.status === "cancelled" || a.status === "denied"
  );

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="container">
        <h1>My Dashboard</h1>

        <div className="stats-row">
          <div className="card stat-card">
            <span className="stat-number">{upcoming.length}</span>
            <span className="stat-label">Upcoming Appointments</span>
          </div>
          <Link to="/booking" className="card stat-card stat-link">
            <span className="stat-label">Book Appointment</span>
          </Link>
          <Link to="/messages" className="card stat-card stat-link">
            <span className="stat-label">Messages</span>
          </Link>
        </div>

        <section className="dash-section">
          <h2>Upcoming Appointments</h2>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming appointments.</p>
              <Link to="/booking" className="btn btn-primary" style={{ marginTop: "var(--space-3)" }}>
                Book Now
              </Link>
            </div>
          ) : (
            <div className="appointments-list">
              {upcoming.map((a) => (
                <div key={a.id} className="card appointment-card">
                  <div className="appt-info">
                    <strong>{format(new Date(a.start_time), "EEEE, MMM d, yyyy")}</strong>
                    <span>{format(new Date(a.start_time), "h:mm a")} — {format(new Date(a.end_time), "h:mm a")}</span>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                    {a.owner_response && <p className="appt-notes">Note: {a.owner_response}</p>}
                    {a.suggested_time && (
                      <p className="appt-notes">Suggested time: {format(new Date(a.suggested_time), "MMM d 'at' h:mm a")}</p>
                    )}
                  </div>
                  <div className="appt-actions">
                    <button className="btn btn-danger btn-sm"
                      onClick={() => api.patch(`/appointments/${a.id}/cancel`).then(() =>
                        setAppointments((prev) => prev.map((ap) => ap.id === a.id ? { ...ap, status: "cancelled" } : ap))
                      )}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section className="dash-section">
            <h2>Past Appointments</h2>
            <div className="appointments-list">
              {past.slice(0, 5).map((a) => (
                <div key={a.id} className="card appointment-card" style={{ opacity: 0.7 }}>
                  <div className="appt-info">
                    <strong>{format(new Date(a.start_time), "MMM d, yyyy 'at' h:mm a")}</strong>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
