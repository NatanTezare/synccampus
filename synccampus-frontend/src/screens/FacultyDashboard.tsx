import React, { useState, useEffect, useMemo } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, FacultyAvailability, DayOfWeek } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { tint } from '../theme/tint';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function addHour(time: string) {
  const [h] = time.split(':').map(Number);
  return `${(h + 1).toString().padStart(2, '0')}:00`;
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function FacultyDashboard() {
  const C = useTheme();

  const inputStyle = { background: C.aliceLight, color: C.dark };
  const inputClass = 'w-full rounded-xl px-3.5 py-3 outline-none text-[13px] border-2 border-transparent focus:border-[#2B3990] transition-all disabled:opacity-50';
  const labelClass = 'text-[11px] font-[700] uppercase tracking-[0.05em]';

  const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: tint('#F59E0B', 18), text: '#B45309', label: 'Pending' },
    confirmed: { bg: tint(C.success, 15), text: C.success, label: 'Confirmed' },
    rejected: { bg: tint(C.danger, 12), text: C.danger, label: 'Rejected' },
    cancelled: { bg: C.aliceLight, text: C.charcoal, label: 'Cancelled' },
    completed: { bg: C.aliceLight, text: C.charcoal, label: 'Completed' },
  };

  const [tab, setTab] = useState<'overview' | 'availability' | 'appointments'>('overview');

  const [incomingRequests, setIncomingRequests] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<FacultyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridBusyKey, setGridBusyKey] = useState<string | null>(null);

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [appointmentsView, setAppointmentsView] = useState<'pending' | 'reviewed'>('pending');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedRequests, fetchedAvailability] = await Promise.all([
        appointmentService.getIncomingAppointments(),
        appointmentService.getMyAvailability(),
      ]);
      setIncomingRequests(fetchedRequests);
      setAvailability(fetchedAvailability);
    } catch (error) {
      console.error("Failed to load faculty dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const openCellKeys = useMemo(
    () => new Set(availability.map((a) => `${a.day_of_week}-${a.start_time.slice(0, 5)}`)),
    [availability]
  );

  const confirmedCellKeys = useMemo(() => {
    const keys = new Set<string>();
    incomingRequests.forEach((req) => {
      if (req.status === 'confirmed') {
        const dayName = new Date(`${req.appointment_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        keys.add(`${dayName}-${req.start_time.slice(0, 5)}`);
      }
    });
    return keys;
  }, [incomingRequests]);

  const pendingCellKeys = useMemo(() => {
    const keys = new Set<string>();
    incomingRequests.forEach((req) => {
      if (req.status === 'pending') {
        const dayName = new Date(`${req.appointment_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        keys.add(`${dayName}-${req.start_time.slice(0, 5)}`);
      }
    });
    return keys;
  }, [incomingRequests]);

  const toggleCell = async (day: DayOfWeek, hour: string) => {
    const key = `${day}-${hour}`;
    if (confirmedCellKeys.has(key) || pendingCellKeys.has(key)) return;

    setGridBusyKey(key);
    try {
      const existing = availability.find((a) => a.day_of_week === day && a.start_time.slice(0, 5) === hour);
      if (existing) {
        await appointmentService.deleteAvailability(existing.id);
      } else {
        await appointmentService.createAvailability({ dayOfWeek: day, startTime: hour, endTime: addHour(hour) });
      }
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle availability cell', err);
    } finally {
      setGridBusyKey(null);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!window.confirm('Remove this availability slot?')) return;
    try {
      await appointmentService.deleteAvailability(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to delete availability', err);
    }
  };

  const handleRespond = async (id: string, decision: 'confirmed' | 'rejected') => {
    try {
      const facultyNotes = notes[id] || '';
      await appointmentService.respondToAppointment(id, { decision, facultyNotes });
      setNotes((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || `Failed to ${decision} request.`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold text-lg" style={{ color: C.blue }}>Loading Faculty Dashboard...</div>;
  }

  const pendingRequests = incomingRequests.filter((r) => r.status === 'pending');
  const reviewedRequests = incomingRequests.filter((r) => r.status !== 'pending');
  const todaysConfirmed = incomingRequests.filter((r) => r.appointment_date === TODAY_ISO && r.status === 'confirmed');
  const confirmedThisWeek = incomingRequests.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-sm" style={{ background: C.aliceLight }}>
      {/* Banner */}
      <div className="p-5" style={{ background: C.blue }}>
        <div className="text-center">
          <h2 className="text-[18px] font-[800] text-white tracking-[0.005em]">Faculty Dashboard</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(232,244,255,0.65)' }}>Manage your availability and student requests</p>
        </div>
      </div>

      <div className="p-4 md:p-5 flex flex-col gap-5">
        <div className="flex p-1 rounded-[10px] w-full max-w-md" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.06)' }}>
          {([
            ['overview', 'Overview'],
            ['availability', 'Availability'],
            ['appointments', `Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}`],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-2 text-[13px] font-[700] rounded-lg transition-all border-none cursor-pointer"
              style={{
                background: tab === id ? C.blue : 'transparent',
                color: tab === id ? '#fff' : C.charcoal,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---------------- OVERVIEW ---------------- */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5" style={{ background: C.surface, borderTop: `3px solid ${C.danger}`, boxShadow: '0 2px 12px rgba(43,57,144,0.07)' }}>
                <p className="text-[28px] font-[900] leading-none" style={{ color: C.dark }}>{pendingRequests.length}</p>
                <p className="text-xs font-medium mt-2" style={{ color: C.charcoal }}>Pending Requests</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: C.surface, borderTop: `3px solid ${C.success}`, boxShadow: '0 2px 12px rgba(43,57,144,0.07)' }}>
                <p className="text-[28px] font-[900] leading-none" style={{ color: C.dark }}>{confirmedThisWeek}</p>
                <p className="text-xs font-medium mt-2" style={{ color: C.charcoal }}>Confirmed Appointments</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: C.surface, borderTop: `3px solid ${C.blue}`, boxShadow: '0 2px 12px rgba(43,57,144,0.07)' }}>
                <p className="text-[28px] font-[900] leading-none" style={{ color: C.dark }}>{availability.length}</p>
                <p className="text-xs font-medium mt-2" style={{ color: C.charcoal }}>Open Availability Blocks</p>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
              <h3 className="text-[15px] font-[800] mb-1" style={{ color: C.dark }}>Today's Confirmed Appointments</h3>
              <p className="text-xs mb-4" style={{ color: C.charcoal }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {todaysConfirmed.length === 0 ? (
                <p className="text-sm" style={{ color: C.charcoal }}>No confirmed appointments today.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todaysConfirmed
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.aliceLight }}>
                        <span className="text-sm font-bold shrink-0" style={{ color: C.blue }}>{formatTime(req.start_time.slice(0, 5))}</span>
                        <span className="text-sm" style={{ color: C.dark }}>{req.student_name}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- AVAILABILITY ---------------- */}
        {tab === 'availability' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[15px] font-[800]" style={{ color: C.dark }}>Weekly Template</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: C.charcoal }}>
                Click cells to manage. "Closed" toggles to "Open". Clicking "Booked" jumps to the appointment details.
              </p>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {[
                  ['Open', tint(C.success, 15), C.success],
                  ['Booked', tint(C.blue, 12), C.blue],
                  ['Closed', C.aliceLight, C.charcoal],
                ].map(([label, bg, border]) => (
                  <div key={label as string} className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded" style={{ background: bg as string, border: `1.5px solid ${border}` }} />
                    <span className="text-xs font-semibold" style={{ color: C.charcoal }}>{label}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
                    <div />
                    {DAYS.map((d) => (
                      <div key={d} className="text-center text-xs font-bold py-2" style={{ color: '#fff', background: C.blue }}>
                        {DAY_LABELS[d]}
                      </div>
                    ))}
                  </div>
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
                      <div className="flex items-center justify-end pr-2 text-[11px] font-bold" style={{ color: C.charcoal, background: C.aliceLight }}>
                        {hour}
                      </div>
                      {DAYS.map((day) => {
                        const key = `${day}-${hour}`;
                        const isConfirmed = confirmedCellKeys.has(key);
                        const isPending = pendingCellKeys.has(key);
                        const isOpen = openCellKeys.has(key);
                        const isBusy = gridBusyKey === key;
                        
                        let bg = C.aliceLight;
                        let border = C.border;
                        let color = C.charcoal;
                        let label = 'Closed';

                        if (isConfirmed || isPending) {
                          bg = tint(C.blue, 12); border = C.blue; color = C.blue; label = 'Booked';
                        } else if (isOpen) {
                          bg = tint(C.success, 15); border = C.success; color = C.success; label = 'Open';
                        }

                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (isConfirmed) {
                                setAppointmentsView('reviewed');
                                setTab('appointments');
                              } else if (isPending) {
                                setAppointmentsView('pending');
                                setTab('appointments');
                              } else {
                                toggleCell(day, hour);
                              }
                            }}
                            disabled={isBusy}
                            className="h-11 text-[10px] font-bold transition-colors"
                            style={{
                              background: bg,
                              borderTop: `2px solid ${border}`,
                              borderLeft: `1px solid ${C.border}`,
                              color: color,
                              opacity: isBusy ? 0.5 : 1,
                              cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
              <h3 className="text-[13px] font-[800] uppercase tracking-wide mb-3" style={{ color: C.charcoal }}>Current Schedule (List View)</h3>
              {availability.length === 0 ? (
                <p className="text-sm" style={{ color: C.charcoal }}>No availability set. Students cannot book you yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availability.map((slot) => {
                    const key = `${slot.day_of_week}-${slot.start_time.slice(0, 5)}`;
                    const isConfirmed = confirmedCellKeys.has(key);
                    const isPending = pendingCellKeys.has(key);
                    const isBooked = isConfirmed || isPending;

                    return (
                      <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl transition-all" style={{ background: C.aliceLight, border: isBooked ? `1px solid ${tint(C.blue, 30)}` : '1px solid transparent' }}>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-bold capitalize" style={{ color: C.blue }}>{slot.day_of_week}</p>
                            <p className="text-xs" style={{ color: C.charcoal }}>
                              {formatTime(slot.start_time.slice(0, 5))} – {formatTime(slot.end_time.slice(0, 5))}
                            </p>
                          </div>
                          {isBooked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide" style={{ background: tint(C.blue, 12), color: C.blue }}>
                              Booked
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAvailability(slot.id)}
                          disabled={isBooked}
                          className="text-lg font-bold px-2 transition-opacity"
                          style={{ color: C.danger, opacity: isBooked ? 0.3 : 1, cursor: isBooked ? 'not-allowed' : 'pointer' }}
                          title={isBooked ? "Cannot remove a slot with an active request" : "Remove slot"}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- APPOINTMENTS ---------------- */}
        {tab === 'appointments' && (
          <div className="flex flex-col gap-4">
            <div className="flex p-1 rounded-[10px] w-full max-w-xs" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.06)' }}>
              {(['pending', 'reviewed'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAppointmentsView(v)}
                  className="flex-1 py-2 text-[13px] font-[700] rounded-lg transition-all border-none cursor-pointer"
                  style={{ background: appointmentsView === v ? C.blue : 'transparent', color: appointmentsView === v ? '#fff' : C.charcoal }}
                >
                  {v === 'pending' ? `Pending (${pendingRequests.length})` : `Reviewed (${reviewedRequests.length})`}
                </button>
              ))}
            </div>

            {appointmentsView === 'pending' ? (
              pendingRequests.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)' }}>
                  <p className="text-sm font-semibold" style={{ color: C.charcoal }}>No pending student requests.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="rounded-2xl p-5" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <p className="text-sm font-[800]" style={{ color: C.dark }}>{req.student_name}</p>
                          <p className="text-xs" style={{ color: C.charcoal }}>{req.student_email} · {req.student_id_no}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: C.blue }}>{req.appointment_date}</p>
                          <p className="text-xs" style={{ color: C.charcoal }}>{formatTime(req.start_time.slice(0, 5))} – {formatTime(req.end_time.slice(0, 5))}</p>
                        </div>
                      </div>

                      <div className="rounded-xl p-3 mb-3" style={{ background: C.aliceLight }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: C.charcoal }}>Purpose</p>
                        <p className="text-sm" style={{ color: C.dark }}>{req.purpose}</p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                        <div className="flex-1">
                          <label className={labelClass} style={{ color: C.charcoal }}>Note to student (optional)</label>
                          <input
                            type="text"
                            placeholder="E.g., Please bring your laptop."
                            className={inputClass}
                            style={inputStyle}
                            value={notes[req.id] || ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(req.id, 'confirmed')}
                            className="flex-1 md:flex-none px-5 rounded-xl text-sm font-bold min-h-[44px]"
                            style={{ background: C.success, color: '#fff', boxShadow: '0 2px 8px rgba(16,178,27,0.3)' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'rejected')}
                            className="flex-1 md:flex-none px-5 rounded-xl text-sm font-bold min-h-[44px]"
                            style={{ background: C.danger, color: '#fff', boxShadow: '0 2px 8px rgba(227,24,24,0.3)' }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : reviewedRequests.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)' }}>
                <p className="text-sm font-semibold" style={{ color: C.charcoal }}>No reviewed requests yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviewedRequests.map((req) => {
                  const s = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
                  return (
                    <div key={req.id} className="rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-2" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: C.dark }}>{req.student_name}</p>
                        <p className="text-xs" style={{ color: C.charcoal }}>
                          {req.appointment_date} ({formatTime(req.start_time.slice(0, 5))} – {formatTime(req.end_time.slice(0, 5))})
                        </p>
                        {req.faculty_notes && <p className="text-xs mt-1" style={{ color: C.blue }}>Note: {req.faculty_notes}</p>}
                      </div>
                      <span
                        className="text-[10px] font-[800] px-2.5 py-1 rounded-full uppercase tracking-wide self-start md:self-center"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {req.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}