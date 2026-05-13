import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, isOwner } = useAuth();
  const targetId = userId ? parseInt(userId) : user?.id;
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [clinicalForm, setClinicalForm] = useState<any>({});
  const [editingClinical, setEditingClinical] = useState(false);
  const [noteForm, setNoteForm] = useState({ appointmentId: "", content: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!targetId) return;
    api.get(`/profiles/${targetId}`).then((res) => {
      setProfile(res.data);
      setEditForm({
        fullName: res.data.full_name || "",
        phone: res.data.phone || "",
        dob: res.data.dob?.slice(0, 10) || "",
        emergencyContactName: res.data.emergency_contact_name || "",
        emergencyContactPhone: res.data.emergency_contact_phone || "",
        insuranceProvider: res.data.insurance_provider || "",
        address: res.data.address || "",
      });
      if (res.data.clinical) {
        setClinicalForm({
          diagnosisCodes: res.data.clinical.diagnosis_codes || "",
          diagnosisNotes: res.data.clinical.diagnosis_notes || "",
          treatmentGoals: res.data.clinical.treatment_goals || "",
          medications: res.data.clinical.medications || "",
          notes: res.data.clinical.notes || "",
        });
      }
    });
  }, [targetId]);

  const saveProfile = async () => {
    await api.patch(`/profiles/${targetId}`, editForm);
    setEditing(false);
    setMessage("Profile saved!");
    setTimeout(() => setMessage(""), 3000);
    // Refresh
    const res = await api.get(`/profiles/${targetId}`);
    setProfile(res.data);
  };

  const saveClinical = async () => {
    await api.put(`/profiles/${targetId}/clinical`, clinicalForm);
    setEditingClinical(false);
    setMessage("Clinical profile saved!");
    setTimeout(() => setMessage(""), 3000);
    const res = await api.get(`/profiles/${targetId}`);
    setProfile(res.data);
  };

  const addSessionNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.appointmentId || !noteForm.content) return;
    await api.post(`/profiles/${targetId}/session-notes`, {
      appointmentId: parseInt(noteForm.appointmentId),
      content: noteForm.content,
    });
    setNoteForm({ appointmentId: "", content: "" });
    const res = await api.get(`/profiles/${targetId}`);
    setProfile(res.data);
  };

  if (!profile) return <div className="container section">Loading...</div>;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">{profile.full_name.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{profile.full_name}</h1>
            <p>{profile.email}</p>
            {profile.role === "client" && (
              <span className="badge badge-confirmed">Client since {format(new Date(profile.created_at), "MMM yyyy")}</span>
            )}
          </div>
        </div>

        {message && <div className="card" style={{ color: "var(--color-success)", marginBottom: "var(--space-4)" }}>{message}</div>}

        {/* Basic Info */}
        <section className="profile-section">
          <div className="section-header">
            <h2>Personal Information</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="card">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-input" value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-input" value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input className="form-input" type="date" value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <select className="form-input" value={editForm.insuranceProvider}
                    onChange={(e) => setEditForm({ ...editForm, insuranceProvider: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Aetna</option>
                    <option>BlueCross BlueShield</option>
                    <option>Carolina Complete</option>
                    <option>Vaya Health</option>
                    <option>Alliance Health</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input className="form-input" value={editForm.emergencyContactName}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input className="form-input" value={editForm.emergencyContactPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Address</label>
                  <input className="form-input" value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: "var(--space-4)" }} onClick={saveProfile}>
                Save Changes
              </button>
            </div>
          ) : (
            <div className="card info-grid">
              <div className="info-item"><label>Phone</label><span>{profile.phone || "—"}</span></div>
              <div className="info-item"><label>Date of Birth</label><span>{profile.dob ? format(new Date(profile.dob), "MMM d, yyyy") : "—"}</span></div>
              <div className="info-item"><label>Insurance</label><span>{profile.insurance_provider || "—"}</span></div>
              <div className="info-item"><label>Address</label><span>{profile.address || "—"}</span></div>
              <div className="info-item"><label>Emergency Contact</label><span>{profile.emergency_contact_name || "—"} {profile.emergency_contact_phone ? `(${profile.emergency_contact_phone})` : ""}</span></div>
            </div>
          )}
        </section>

        {/* Clinical Profile — Owner Only */}
        {isOwner() && (
          <section className="profile-section">
            <div className="section-header">
              <h2>Clinical Profile</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingClinical(!editingClinical)}>
                {editingClinical ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingClinical ? (
              <div className="card">
                <div className="form-group">
                  <label>Diagnosis Codes (ICD-10)</label>
                  <input className="form-input" value={clinicalForm.diagnosisCodes} placeholder="e.g., F41.1, F32.1"
                    onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosisCodes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Diagnosis Notes</label>
                  <textarea className="form-input" value={clinicalForm.diagnosisNotes}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosisNotes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Treatment Goals</label>
                  <textarea className="form-input" value={clinicalForm.treatmentGoals}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, treatmentGoals: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Medications</label>
                  <textarea className="form-input" value={clinicalForm.medications}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, medications: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>General Notes</label>
                  <textarea className="form-input" value={clinicalForm.notes} style={{ minHeight: 120 }}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, notes: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={saveClinical}>Save Clinical Profile</button>
              </div>
            ) : (
              <div className="card">
                {profile.clinical ? (
                  <div className="clinical-grid">
                    <div><label>Diagnosis Codes</label><p>{profile.clinical.diagnosis_codes || "—"}</p></div>
                    <div><label>Diagnosis Notes</label><p>{profile.clinical.diagnosis_notes || "—"}</p></div>
                    <div><label>Treatment Goals</label><p>{profile.clinical.treatment_goals || "—"}</p></div>
                    <div><label>Medications</label><p>{profile.clinical.medications || "—"}</p></div>
                    <div><label>General Notes</label><p>{profile.clinical.notes || "—"}</p></div>
                  </div>
                ) : (
                  <p className="empty-state">No clinical profile yet. Click Edit to add one.</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Session Notes — Owner Only */}
        {isOwner() && (
          <section className="profile-section">
            <h2>Session Notes</h2>

            <form className="card" onSubmit={addSessionNote} style={{ marginBottom: "var(--space-4)" }}>
              <div className="form-group">
                <label>Appointment</label>
                <select className="form-input" value={noteForm.appointmentId}
                  onChange={(e) => setNoteForm({ ...noteForm, appointmentId: e.target.value })}>
                  <option value="">Select appointment...</option>
                  {profile.appointments?.filter((a: any) => a.status === "confirmed").map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {format(new Date(a.start_time), "MMM d, yyyy h:mm a")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea className="form-input" value={noteForm.content} style={{ minHeight: 100 }}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Session notes..." />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Add Note</button>
            </form>

            {profile.sessionNotes?.length > 0 ? (
              <div className="notes-list">
                {profile.sessionNotes.map((note: any) => (
                  <div key={note.id} className="card note-card">
                    <div className="note-date">
                      {format(new Date(note.start_time), "MMM d, yyyy h:mm a")}
                    </div>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No session notes yet.</p>
            )}
          </section>
        )}

        {/* Message History */}
        {profile.messages && (
          <section className="profile-section">
            <div className="section-header">
              <h2>Messages</h2>
              <Link to="/messages" className="btn btn-outline btn-sm">Open Full Chat</Link>
            </div>

            {profile.messages.length > 0 ? (
              <div className="card profile-messages">
                <div className="profile-messages-list">
                  {profile.messages.map((msg: any) => {
                    const isFromViewer = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`profile-msg ${isFromViewer ? "from-owner" : "from-client"}`}>
                        <div className="profile-msg-header">
                          <span className="profile-msg-sender">{msg.sender_name}</span>
                          <span className="profile-msg-time">
                            {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p>{msg.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="empty-state">No messages yet.</p>
            )}
          </section>
        )}

        {/* Appointment History */}
        {isOwner() && profile.appointments && (
          <section className="profile-section">
            <h2>Appointment History</h2>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Insurance</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.appointments.map((a: any) => (
                    <tr key={a.id}>
                      <td>{format(new Date(a.start_time), "MMM d, yyyy h:mm a")}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      <td>{a.booking_type}</td>
                      <td>{a.fee ? `$${a.fee}` : "—"}</td>
                      <td>{a.insurance_billed || "—"}</td>
                      <td><span className={`badge badge-${a.payment_status}`}>{a.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
