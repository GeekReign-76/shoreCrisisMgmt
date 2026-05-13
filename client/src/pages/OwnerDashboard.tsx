import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useSocket } from "../contexts/SocketContext";
import { Appointment } from "../types";
import AppointmentDetail from "../components/scheduling/AppointmentDetail";
import { format } from "date-fns";
import "./Dashboard.css";

export default function OwnerDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
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
      // Update the selected appointment if it's the one that changed
      setSelectedAppt((prev) =>
        prev && prev.id === data.appointment.id ? data.appointment : prev
      );
    };
    socket.on("appointment:updated", handler);
    return () => { socket.off("appointment:updated", handler); };
  }, [socket]);

  const handleApptUpdate = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedAppt(updated);
  };

  const pending = appointments.filter((a) => a.status === "pending");
  const today = appointments.filter(
    (a) => a.status === "confirmed" && new Date(a.start_time).toDateString() === new Date().toDateString()
  );
  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" && new Date(a.start_time) > new Date()
  );
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="container">
        <h1>Owner Dashboard</h1>

        <div className="stats-row">
          <div className="card stat-card">
            <span className="stat-number">{today.length}</span>
            <span className="stat-label">Today's Appointments</span>
          </div>
          <div className="card stat-card">
            <span className="stat-number">{pending.length}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
          <div className="card stat-card">
            <span className="stat-number">{upcoming.length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="card stat-card">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <Link to="/messages" className="card stat-card stat-link">
            <span className="stat-label">View Messages</span>
          </Link>
        </div>

        {pending.length > 0 && (
          <section className="dash-section">
            <h2>Pending Requests</h2>
            <div className="appointments-list">
              {pending.map((a) => (
                <div key={a.id} className="card appointment-card clickable" onClick={() => setSelectedAppt(a)}>
                  <div className="appt-info">
                    <strong>{a.client_name}</strong>
                    <span>{format(new Date(a.start_time), "MMM d, yyyy 'at' h:mm a")}</span>
                    <span className="badge badge-pending">{a.booking_type}</span>
                    {a.notes && <p className="appt-notes">{a.notes}</p>}
                  </div>
                  <div className="appt-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => api.patch(`/appointments/${a.id}/status`, { status: "confirmed" })}>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => api.patch(`/appointments/${a.id}/status`, { status: "denied", ownerResponse: "Unable to accommodate this time." })}>
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="dash-section">
          <h2>Today's Schedule</h2>
          {today.length === 0 ? (
            <p className="empty-state">No appointments scheduled for today.</p>
          ) : (
            <div className="appointments-list">
              {today.map((a) => (
                <div key={a.id} className="card appointment-card clickable" onClick={() => setSelectedAppt(a)}>
                  <div className="appt-info">
                    <strong>{a.client_name}</strong>
                    <span>{format(new Date(a.start_time), "h:mm a")} — {format(new Date(a.end_time), "h:mm a")}</span>
                    <span className="badge badge-confirmed">confirmed</span>
                  </div>
                  <div className="appt-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-accent btn-sm"
                      onClick={() => api.patch(`/appointments/${a.id}/status`, { status: "completed" })}>
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dash-section">
          <h2>Upcoming Appointments</h2>
          {upcoming.length === 0 ? (
            <p className="empty-state">No upcoming appointments.</p>
          ) : (
            <div className="appointments-list">
              {upcoming.slice(0, 10).map((a) => (
                <div key={a.id} className="card appointment-card clickable" onClick={() => setSelectedAppt(a)}>
                  <div className="appt-info">
                    <strong>{a.client_name}</strong>
                    <span>{format(new Date(a.start_time), "MMM d, yyyy 'at' h:mm a")}</span>
                    <span className="badge badge-confirmed">{a.status}</span>
                  </div>
                  <div className="appt-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-accent btn-sm"
                      onClick={() => api.patch(`/appointments/${a.id}/status`, { status: "completed" })}>
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <AppointmentDetail
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onUpdate={handleApptUpdate}
        />
      )}
    </div>
  );
}
