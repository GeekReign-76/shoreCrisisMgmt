import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { OpenSlot } from "../types";
import { format } from "date-fns";
import "./BookingPage.css";

export default function BookingPage() {
  const [mode, setMode] = useState<"slot" | "request">("slot");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState({ date: "", startTime: "", endTime: "", notes: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (mode !== "slot") return;
    setLoading(true);
    api.get(`/availability/open?date=${date}`)
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, mode]);

  const bookSlot = async (slot: OpenSlot) => {
    setError("");
    try {
      await api.post("/appointments/book", { startTime: slot.start, endTime: slot.end });
      setSuccess("Appointment booked successfully!");
      setTimeout(() => navigate("/client"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Booking failed");
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const start = new Date(`${requestData.date}T${requestData.startTime}`);
    const end = new Date(`${requestData.date}T${requestData.endTime}`);
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }
    try {
      await api.post("/appointments/request", {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: requestData.notes,
      });
      setSuccess("Request submitted! You'll be notified when it's reviewed.");
      setTimeout(() => navigate("/client"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Request failed");
    }
  };

  return (
    <div className="booking-page">
      <div className="page-header">
        <div className="container">
          <h1>Book an Appointment</h1>
          <p>Choose an available time or request a specific slot</p>
        </div>
      </div>

      <div className="container section">
        {success && <div className="card" style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <p style={{ color: "var(--color-success)", fontWeight: 600 }}>{success}</p>
        </div>}

        <div className="booking-tabs">
          <button className={`tab ${mode === "slot" ? "active" : ""}`} onClick={() => setMode("slot")}>
            Available Slots
          </button>
          <button className={`tab ${mode === "request" ? "active" : ""}`} onClick={() => setMode("request")}>
            Request a Time
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {mode === "slot" ? (
          <div className="card">
            <div className="form-group">
              <label>Select Date</label>
              <input className="form-input" type="date" value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)} />
            </div>

            {loading ? (
              <p>Loading available slots...</p>
            ) : slots.length === 0 ? (
              <p className="empty-state">No available slots for this date. Try another day or request a custom time.</p>
            ) : (
              <div className="slots-grid">
                {slots.map((slot) => (
                  <button key={slot.start} className="slot-btn" onClick={() => bookSlot(slot)}>
                    {format(new Date(slot.start), "h:mm a")} — {format(new Date(slot.end), "h:mm a")}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form className="card" onSubmit={submitRequest}>
            <div className="form-group">
              <label>Preferred Date *</label>
              <input className="form-input" type="date" required
                min={format(new Date(), "yyyy-MM-dd")}
                value={requestData.date}
                onChange={(e) => setRequestData({ ...requestData, date: e.target.value })} />
            </div>
            <div className="time-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input className="form-input" type="time" required value={requestData.startTime}
                  onChange={(e) => setRequestData({ ...requestData, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input className="form-input" type="time" required value={requestData.endTime}
                  onChange={(e) => setRequestData({ ...requestData, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea className="form-input" value={requestData.notes}
                onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                placeholder="Any details about your request" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
