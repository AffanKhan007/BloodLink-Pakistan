import { Calendar, Clock, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const initialForm = {
  slot_date: "",
  start_time: "",
  end_time: "",
  max_donors: 10,
};

export default function BloodBankAppointmentsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/blood-banks/me/slots", { token });
      setSlots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/v1/blood-banks/me/slots", {
        method: "POST",
        token,
        body: {
          ...form,
          max_donors: Number(form.max_donors),
        },
      });
      setMessage("Slot created successfully.");
      setForm(initialForm);
      setFormOpen(false);
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBookingUpdate = async (slotId, bookingId, status) => {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/blood-banks/me/slots/${slotId}/bookings/${bookingId}`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setMessage(`Booking marked as ${status}.`);
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  };

  const groupedSlots = useMemo(() => {
    const groups = {};
    (slots || []).forEach((slot) => {
      const key = slot.slot_date || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    });
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [slots]);

  if (loading) return <LoadingState label="Loading appointment slots" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Appointments"
          title="Slot management"
          description="Create and manage donation appointment slots."
          actions={
            <button className="button button-primary" onClick={() => setFormOpen((prev) => !prev)}>
              <Plus size={14} /> Create slot
            </button>
          }
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>

      {formOpen && (
        <section className="content-card">
          <SectionIntro eyebrow="New slot" title="Create appointment slot" description="Set date, time, and donor capacity." compact />
          <form className="grid-form" onSubmit={handleCreate}>
            <label className="field-required">
              Slot date
              <input type="date" value={form.slot_date} onChange={(e) => setForm((prev) => ({ ...prev, slot_date: e.target.value }))} required />
            </label>
            <label className="field-required">
              Start time
              <input type="time" value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} required />
            </label>
            <label className="field-required">
              End time
              <input type="time" value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} required />
            </label>
            <label className="field-required">
              Max donors
              <input type="number" min="1" value={form.max_donors} onChange={(e) => setForm((prev) => ({ ...prev, max_donors: e.target.value }))} required />
            </label>
            <div className="form-span">
              <button className="button button-primary">Create slot</button>
            </div>
          </form>
        </section>
      )}

      {slots.length === 0 ? (
        <EmptyState title="No slots yet" description="Create appointment slots to manage donor scheduling." />
      ) : (
        groupedSlots.map(([date, dateSlots]) => (
          <section className="content-card" key={date}>
            <SectionIntro
              eyebrow="Appointments"
              title={new Date(date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              description={`${dateSlots.length} slot${dateSlots.length === 1 ? "" : "s"}`}
              compact
            />
            <div className="card-list">
              {dateSlots.map((slot) => (
                <div className="info-card" key={slot.id}>
                  <div className="list-row">
                    <div>
                      <strong>
                        {slot.start_time
                          ? new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "N/A"}{" "}
                        -{" "}
                        {slot.end_time
                          ? new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "N/A"}
                      </strong>
                      <p>
                        <Users size={12} /> {slot.booked_count ?? 0} / {slot.max_donors} booked
                      </p>
                    </div>
                    <StatusBadge value={slot.status || "available"} />
                  </div>
                  {(slot.bookings || []).length > 0 && (
                    <div className="stacked-cards" style={{ marginTop: "0.5rem" }}>
                      {(slot.bookings || []).map((booking) => (
                        <div className="info-card" key={booking.id} style={{ padding: "0.5rem" }}>
                          <div className="list-row">
                            <div>
                              <strong>{booking.donor_name || `Donor #${booking.donor_id}`}</strong>
                              <p>Status: {booking.status}</p>
                            </div>
                            <div className="card-actions">
                              {booking.status !== "checked_in" && (
                                <button
                                  className="button button-tertiary"
                                  onClick={() => handleBookingUpdate(slot.id, booking.id, "checked_in")}
                                >
                                  Check In
                                </button>
                              )}
                              {booking.status !== "completed" && (
                                <button
                                  className="button button-primary"
                                  onClick={() => handleBookingUpdate(slot.id, booking.id, "completed")}
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
