import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Appointment } from "../../types";
import { format } from "date-fns";
import "./AppointmentDetail.css";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: (updated: Appointment) => void;
}

export default function AppointmentDetail({ appointment, onClose, onUpdate }: Props) {
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [billingForm, setBillingForm] = useState({
    fee: appointment.fee || "",
    paymentStatus: (appointment as any).payment_status || "pending",
  });

  useEffect(() => {
    // Load client profile
    api.get(`/profiles/${appointment.client_id}`).then((res) => {
      setClientProfile(res.data);
      // Extract session notes for this appointment
      if (res.data.sessionNotes) {
        setSessionNotes(
          res.data.sessionNotes.filter((n: any) => n.appointment_id === appointment.id)
        );
      }
    });
  }, [appointment.client_id, appointment.id]);

  const handleStatus = async (status: string) => {
    setSaving(true);
    try {
      const res = await api.patch(`/appointments/${appointment.id}/status`, {
        status,
        ownerResponse: responseText || undefined,
      });
      onUpdate(res.data);
    } catch (err) {
      console.error("Status update failed:", err);
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/appointments/${appointment.id}/cancel`);
      onUpdate(res.data);
    } catch (err) {
      console.error("Cancel failed:", err);
    }
    setSaving(false);
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/profiles/${appointment.client_id}/session-notes`, {
        appointmentId: appointment.id,
        content: newNote.trim(),
      });
      setSessionNotes((prev) => [...prev, res.data]);
      setNewNote("");
    } catch (err) {
      console.error("Save note failed:", err);
    }
    setSaving(false);
  };

  const saveBilling = async () => {
    setSaving(true);
    try {
      await api.patch(`/profiles/appointments/${appointment.id}/billing`, {
        fee: billingForm.fee ? parseFloat(billingForm.fee as string) : undefined,
        paymentStatus: billingForm.paymentStatus,
      });
    } catch (err) {
      console.error("Billing update failed:", err);
    }
    setSaving(false);
  };

  const durationMin = Math.round(
    (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="appt-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Header */}
        <div className="detail-header">
          <div>
            <h2>Appointment Details</h2>
            <span className={`badge badge-${appointment.status}`}>{appointment.status}</span>
            <span className="badge" style={{ background: "#E0E7FF", color: "#3730A3", marginLeft: 4 }}>
              {appointment.booking_type}
            </span>
          </div>
        </div>

        <div className="detail-body">
          {/* Schedule Info */}
          <section className="detail-section">
            <h3>Schedule</h3>
            <div className="detail-grid">
              <div>
                <label>Date</label>
                <span>{format(new Date(appointment.start_time), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div>
                <label>Time</label>
                <span>
                  {format(new Date(appointment.start_time), "h:mm a")} — {format(new Date(appointment.end_time), "h:mm a")}
                </span>
              </div>
              <div>
                <label>Duration</label>
                <span>{durationMin} minutes</span>
              </div>
              {appointment.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Client Notes</label>
                  <span>{appointment.notes}</span>
                </div>
              )}
            </div>
          </section>

          {/* Client Info */}
          <section className="detail-section">
            <div className="section-row">
              <h3>Client</h3>
              <Link to={`/profile/${appointment.client_id}`} className="btn btn-outline btn-sm" onClick={onClose}>
                Full Profile
              </Link>
            </div>

            {clientProfile ? (
              <div className="client-card">
                <div className="client-avatar">
                  {clientProfile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="client-info-grid">
                  <div>
                    <label>Name</label>
                    <span>{clientProfile.full_name}</span>
                  </div>
                  <div>
                    <label>Email</label>
                    <span>{clientProfile.email}</span>
                  </div>
                  <div>
                    <label>Phone</label>
                    <span>{clientProfile.phone || "—"}</span>
                  </div>
                  <div>
                    <label>DOB</label>
                    <span>{clientProfile.dob ? format(new Date(clientProfile.dob), "MMM d, yyyy") : "—"}</span>
                  </div>
                  <div>
                    <label>Insurance</label>
                    <span>{clientProfile.insurance_provider || "—"}</span>
                  </div>
                  <div>
                    <label>Emergency Contact</label>
                    <span>
                      {clientProfile.emergency_contact_name
                        ? `${clientProfile.emergency_contact_name} (${clientProfile.emergency_contact_phone || "—"})`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Clinical snapshot */}
                {clientProfile.clinical && (
                  <div className="clinical-snapshot">
                    <h4>Clinical Summary</h4>
                    <div className="clinical-mini-grid">
                      <div>
                        <label>Diagnosis</label>
                        <span>{clientProfile.clinical.diagnosis_codes || "—"}</span>
                        {clientProfile.clinical.diagnosis_notes && (
                          <p className="clinical-note-text">{clientProfile.clinical.diagnosis_notes}</p>
                        )}
                      </div>
                      <div>
                        <label>Treatment Goals</label>
                        <p className="clinical-note-text">{clientProfile.clinical.treatment_goals || "—"}</p>
                      </div>
                      <div>
                        <label>Medications</label>
                        <span>{clientProfile.clinical.medications || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading client info...</p>
            )}
          </section>

          {/* Session Notes */}
          <section className="detail-section">
            <h3>Session Notes</h3>

            {sessionNotes.length > 0 && (
              <div className="existing-notes">
                {sessionNotes.map((note: any) => (
                  <div key={note.id} className="note-entry">
                    <span className="note-timestamp">
                      {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="note-form">
              <textarea
                className="form-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add session notes..."
                rows={4}
              />
              <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={saving || !newNote.trim()}>
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </section>

          {/* Billing */}
          {(appointment.status === "completed" || appointment.status === "confirmed") && (
            <section className="detail-section">
              <h3>Billing</h3>
              <div className="billing-row">
                <div className="form-group">
                  <label>Fee ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={billingForm.fee}
                    onChange={(e) => setBillingForm({ ...billingForm, fee: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    className="form-input"
                    value={billingForm.paymentStatus}
                    onChange={(e) => setBillingForm({ ...billingForm, paymentStatus: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-end" }}
                  onClick={saveBilling} disabled={saving}>
                  Update Billing
                </button>
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="detail-section detail-actions">
            {appointment.status === "pending" && (
              <>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Response to Client (optional)</label>
                  <input className="form-input" value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Note to client..." />
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={() => handleStatus("confirmed")} disabled={saving}>
                    Approve
                  </button>
                  <button className="btn btn-danger" onClick={() => handleStatus("denied")} disabled={saving}>
                    Deny
                  </button>
                </div>
              </>
            )}
            {appointment.status === "confirmed" && (
              <div className="action-buttons">
                <button className="btn btn-accent" onClick={() => handleStatus("completed")} disabled={saving}>
                  Mark Complete
                </button>
                <button className="btn btn-danger" onClick={handleCancel} disabled={saving}>
                  Cancel Appointment
                </button>
              </div>
            )}
            {appointment.status === "completed" && (
              <p className="completed-label">
                This appointment has been completed.
                {(appointment as any).fee && ` Fee: $${parseFloat((appointment as any).fee).toFixed(2)}`}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
