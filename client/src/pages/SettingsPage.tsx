import { useState, useEffect } from "react";
import api from "../api/client";
import { AvailabilitySlot } from "../types";
import "./SettingsPage.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDurationMin: 60 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/availability").then((res) => setSlots(res.data));
  }, []);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/availability", newSlot);
      setSlots((prev) => [...prev.filter((s) => s.id !== res.data.id), res.data].sort((a, b) =>
        a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
      ));
      setMessage("Availability saved!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Failed to save");
    }
  };

  const deleteSlot = async (id: number) => {
    await api.delete(`/availability/${id}`);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="settings-page">
      <div className="container">
        <h1>Settings</h1>

        <section className="dash-section">
          <h2>Manage Availability</h2>
          <p style={{ color: "var(--color-text-light)", marginBottom: "var(--space-6)" }}>
            Configure your weekly availability. Clients can book appointments during these times.
          </p>

          {message && <div className="card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", color: "var(--color-success)" }}>{message}</div>}

          <form className="card availability-form" onSubmit={addSlot}>
            <div className="avail-row">
              <div className="form-group">
                <label>Day</label>
                <select className="form-input" value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input className="form-input" type="time" value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input className="form-input" type="time" value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (min)</label>
                <select className="form-input" value={newSlot.slotDurationMin}
                  onChange={(e) => setNewSlot({ ...newSlot, slotDurationMin: parseInt(e.target.value) })}>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Add</button>
            </div>
          </form>

          <div className="slots-table">
            {DAYS.map((day, i) => {
              const daySlots = slots.filter((s) => s.day_of_week === i);
              if (daySlots.length === 0) return null;
              return (
                <div key={i} className="day-group">
                  <h3>{day}</h3>
                  {daySlots.map((s) => (
                    <div key={s.id} className="slot-row">
                      <span>{s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}</span>
                      <span className="slot-duration">{s.slot_duration_min} min blocks</span>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              );
            })}
            {slots.length === 0 && (
              <p className="empty-state">No availability configured yet. Add your first time slot above.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
