import React, { useState, useEffect, useMemo } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { CreateAppointmentPayload } from '../services/appointmentService';
import type { Appointment, FacultyDirectoryEntry, AvailableSlot } from '../api/types';

const C = {
  blue: "#2B3990",
  amber: "#FFCB05",
  alice: "#E8F4FF",
  aliceLight: "#F3F9FF",
  charcoal: "#54566A",
  dark: "#1a1c2e",
  success: "#10B21B",
  danger: "#E31818",
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const inputStyle = { background: C.aliceLight, color: C.dark };
const inputClass =
  'w-full rounded-xl px-3.5 py-3 outline-none text-[13px] border-2 border-transparent focus:border-[#2B3990] transition-all disabled:opacity-50';
const labelClass = 'text-[11px] font-[700] uppercase tracking-[0.05em]';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FFF9E6', text: '#B45309', label: 'Pending' },
  confirmed: { bg: '#E6F9E8', text: C.success, label: 'Confirmed' },
  rejected: { bg: '#FFF0F0', text: C.danger, label: 'Rejected' },
  cancelled: { bg: C.aliceLight, text: C.charcoal, label: 'Cancelled' },
  completed: { bg: C.aliceLight, text: C.charcoal, label: 'Completed' },
};

export default function Appointments() {
  const [facultyList, setFacultyList] = useState<FacultyDirectoryEntry[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [facultyId, setFacultyId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedFaculty, fetchedAppointments] = await Promise.all([
        appointmentService.getFacultyDirectory(),
        appointmentService.getMyAppointments(),
      ]);
      setFacultyList(fetchedFaculty);
      setMyAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Failed to load appointment data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (id: string) => {
    setSlotsLoading(true);
    try {
      const slots = await appointmentService.getAvailableSlots(id);
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to fetch slots", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSlot(null);
    if (!facultyId) {
      setAvailableSlots([]);
      return;
    }
    fetchSlots(facultyId);
  }, [facultyId]);

  const slotsByDate = useMemo(() => {
    const groups = new Map<string, AvailableSlot[]>();
    for (const slot of availableSlots) {
      if (!groups.has(slot.date)) groups.set(slot.date, []);
      groups.get(slot.date)!.push(slot);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSlot) {
      setFormError('Please select an available time slot.');
      return;
    }
    if (purpose.trim().length < 10) {
      setFormError('Please provide a brief purpose (at least 10 characters) so the faculty member has context.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateAppointmentPayload = {
        facultyId,
        appointmentDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        purpose,
      };

      await appointmentService.createAppointment(payload);

      setSelectedSlot(null);
      setPurpose('');
      await Promise.all([
        appointmentService.getMyAppointments().then(setMyAppointments),
        fetchSlots(facultyId),
      ]);
    } catch (err: any) {
      const message = err.message || err.response?.data?.message || 'Failed to book appointment.';
      setFormError(message);
      setSelectedSlot(null);
      fetchSlots(facultyId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentService.cancelAppointment(id);
      const freshAppointments = await appointmentService.getMyAppointments();
      setMyAppointments(freshAppointments);
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || "Failed to cancel appointment.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold text-lg" style={{ color: C.blue }}>Loading Appointments...</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-sm" style={{ background: C.aliceLight }}>
      {/* Banner */}
      <div className="p-5" style={{ background: C.blue }}>
        <div className="text-center">
          <h2 className="text-[18px] font-[800] text-white tracking-[0.005em]">Book Appointment</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(232,244,255,0.65)" }}>Faculty & staff directory</p>
        </div>
      </div>

      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* New Request */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: '1px solid rgba(43,57,144,0.06)' }}>
          <h3 className="text-[15px] font-[800] mb-4" style={{ color: C.dark }}>New Request</h3>

          {formError && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold text-center" style={{ background: '#FFF0F0', color: C.danger, border: '1px solid rgba(227,24,24,0.2)' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: C.charcoal }}>Select Faculty</label>
              <select className={inputClass} style={inputStyle} value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required>
                <option value="">Choose a lecturer or staff member</option>
                {facultyList.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.full_name} ({faculty.department || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {/* Slot picker — booked times simply never appear here */}
            {facultyId && (
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={{ color: C.charcoal }}>Available Time Slots</label>

                {slotsLoading ? (
                  <p className="text-xs" style={{ color: C.charcoal }}>Checking availability...</p>
                ) : slotsByDate.length === 0 ? (
                  <div className="rounded-xl p-3" style={{ background: '#FFF0F0', border: '1px solid rgba(227,24,24,0.2)' }}>
                    <p className="text-xs" style={{ color: C.danger }}>
                      No open slots for this faculty member right now — either they haven't set their
                      weekly availability, or every upcoming slot is already booked.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                    {slotsByDate.map(([date, slots]) => (
                      <div key={date}>
                        <p className="text-[11px] font-bold mb-1.5" style={{ color: C.charcoal }}>{formatDateLabel(date)}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map((slot) => {
                            const isSelected = selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime;
                            return (
                              <button
                                key={`${slot.date}-${slot.startTime}`}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className="min-h-[40px] rounded-xl text-xs font-bold transition-all"
                                style={{
                                  background: isSelected ? C.blue : '#fff',
                                  color: isSelected ? '#fff' : C.dark,
                                  border: `2px solid ${isSelected ? C.blue : 'rgba(43,57,144,0.1)'}`,
                                  boxShadow: isSelected ? '0 4px 12px rgba(43,57,144,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: C.charcoal }}>Purpose of Visit</label>
              <textarea
                required
                rows={3}
                className={inputClass}
                style={inputStyle}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={!selectedSlot}
                placeholder="Briefly describe what you need to discuss..."
              />
            </div>

            <button
              type="submit"
              disabled={!selectedSlot || submitting}
              className="w-full rounded-xl p-[13px] text-[14px] font-[800] transition-all"
              style={{
                background: !selectedSlot || submitting ? '#c8d4e8' : C.dark,
                color: '#fff',
                cursor: !selectedSlot || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? 'Requesting...'
                : selectedSlot
                ? `Request ${formatTime(selectedSlot.startTime)} on ${formatDateLabel(selectedSlot.date)}`
                : 'Select a time slot above'}
            </button>
          </form>
        </div>

        {/* History */}
        <div>
          <h3 className="text-[13px] font-[800] uppercase tracking-wide mb-3" style={{ color: C.charcoal }}>My Requests</h3>

          {myAppointments.length === 0 ? (
            <p className="text-sm" style={{ color: C.charcoal }}>You have not booked any appointments.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myAppointments.map((app) => {
                const s = STATUS_STYLES[app.status] ?? STATUS_STYLES.pending;
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl p-4"
                    style={{ boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: '1px solid rgba(43,57,144,0.06)' }}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <p className="text-sm font-[800]" style={{ color: C.dark }}>{app.faculty_name}</p>
                      <span className="text-[10px] font-[800] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0" style={{ background: s.bg, color: s.text }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: C.charcoal }}>
                      {formatDateLabel(app.appointment_date)} at {formatTime(app.start_time.slice(0, 5))}
                    </p>

                    {app.faculty_notes && (
                      <div className="mt-2 p-2.5 rounded-lg" style={{ background: C.aliceLight }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: C.blue }}>Note from faculty</p>
                        <p className="text-xs" style={{ color: C.dark }}>{app.faculty_notes}</p>
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="mt-3 text-[11px] font-bold underline"
                        style={{ color: C.danger }}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}