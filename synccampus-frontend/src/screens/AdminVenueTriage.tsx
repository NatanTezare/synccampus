import React, { useState, useEffect } from 'react';
import { venueService } from '../services/venueService';
import type { VenueBooking } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { tint } from '../theme/tint';

const VENUE_COLOR_HEXES = ["#8B5CF6", "#F97316", "#EC4899", "#06B6D4"];

function parseHour(timeStr: string | undefined): number {
  if (!timeStr) return 9;
  return parseInt(timeStr.split(':')[0], 10);
}

function calculateSpan(start: string | undefined, end: string | undefined): number {
  const s = parseHour(start);
  const e = parseHour(end);
  return Math.max(1, e - s);
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminVenueTriage() {
  const C = useTheme();
  const VENUE_COLORS = [C.blue, ...VENUE_COLOR_HEXES, C.danger];

  function RoleBadge({ role }: { role?: string }) {
    if (!role) return null;
    const isFaculty = role === 'faculty_leadership';
    const label = isFaculty ? 'Faculty' : role === 'admin' ? 'Admin' : 'Student';
    return (
      <span
        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
        style={{ background: isFaculty ? tint(C.blue, 12) : C.aliceLight, color: isFaculty ? C.blue : C.charcoal }}
      >
        {label}
      </span>
    );
  }

  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await venueService.getAllBookings();
      setBookings(allBookings);
    } catch (error) {
      console.error("Failed to load all venue bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    setConflictWarning(null);
    const target = bookings.find((b) => b.id === id);
    if (!target) return;

    if (decision === 'rejected') {
      const reason = rejectionReasons[id]?.trim();
      if (!reason) {
        setFieldErrors((prev) => ({ ...prev, [id]: 'Add a reason before rejecting this request.' }));
        return;
      }
    }

    if (decision === 'approved') {
      const targetStart = parseHour(target.start_time);
      const targetEnd = parseHour(target.end_time);

      const conflict = bookings.some(
        (b) =>
          b.id !== id &&
          b.status === 'approved' &&
          b.venue_name === target.venue_name &&
          b.booking_date === target.booking_date &&
          !(targetEnd <= parseHour(b.start_time) || targetStart >= parseHour(b.end_time))
      );

      if (conflict) {
        setConflictWarning(`Action blocked: scheduling overlap caught for ${target.venue_name} on ${target.booking_date}.`);
        return;
      }
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const previousStatus = target.status;
    setBusyId(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: decision } : b)));

    try {
      await venueService.reviewBooking(id, {
        decision,
        rejectionReason: decision === 'rejected' ? rejectionReasons[id] : undefined,
      });

      if (decision !== 'rejected') {
        setRejectionReasons((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      loadBookings();
    } catch (err: any) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: previousStatus } : b)));
      setFieldErrors((prev) => ({
        ...prev,
        [id]: err.message || err.response?.data?.message || 'Failed to process this request. Please try again.',
      }));
    } finally {
      setBusyId(null);
    }
  };

  const handleUndo = async (id: string) => {
    setConflictWarning(null);
    const target = bookings.find((b) => b.id === id);
    if (!target) return;
    const previousStatus = target.status;

    setBusyId(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'pending', reviewed_by: null, reviewed_at: null, rejection_reason: null } : b))
    );

    try {
      await venueService.resetBooking(id);
      loadBookings();
    } catch (err: any) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: previousStatus } : b)));
      setFieldErrors((prev) => ({
        ...prev,
        [id]: err.message || err.response?.data?.message || 'Could not undo this decision. Please try again.',
      }));
    } finally {
      setBusyId(null);
    }
  };

  const dynamicDates = Array.from(new Set(bookings.map((b) => b.booking_date).filter(Boolean))).sort();
  const dynamicVenues = Array.from(new Set(bookings.map((b) => b.venue_name).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-bold" style={{ color: C.blue }}>
        Loading Triage Module...
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;

  const filteredRequests = bookings.filter((b) => {
    if (filter === "Pending") return b.status === 'pending';
    if (filter === "Approved") return b.status === 'approved';
    if (filter === "Rejected") return b.status === 'rejected';
    return true;
  });

  const today = todayIso();

  return (
    <div
      className="fixed top-16 bottom-[76px] md:bottom-0 right-0 left-0 md:left-64 z-20 flex flex-col shadow-2xl"
      style={{ background: C.aliceLight, color: C.charcoal }}
    >
      {conflictWarning && (
        <div className="p-3 text-sm font-bold text-center text-white shadow-md z-30" style={{ background: C.danger }}>
          ⚠ {conflictWarning}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Triage Queue */}
        <div className="w-[360px] lg:w-[440px] shrink-0 flex flex-col z-20 shadow-lg" style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
          <div className="p-5 flex flex-col gap-3 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex justify-between items-baseline">
              <h2 className="text-lg font-black tracking-tight" style={{ color: C.dark }}>Triage Queue</h2>
              {pendingCount > 0 && (
                <span className="text-xs font-extrabold text-white px-2.5 py-1 rounded-full" style={{ background: C.danger }}>
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: C.charcoal }}>Review and action system venue reservation requests</p>

            <div className="flex gap-2 mt-1 overflow-x-auto">
              {["All", "Pending", "Approved", "Rejected"].map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="min-h-[36px] border-none rounded-lg px-3.5 text-sm font-bold cursor-pointer transition-colors shrink-0"
                    style={{ background: isActive ? C.blue : C.aliceLight, color: isActive ? "#fff" : C.charcoal }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {filteredRequests.length === 0 ? (
              <p className="text-center text-sm mt-10" style={{ color: C.charcoal }}>
                No requests match this category.
              </p>
            ) : (
              filteredRequests.map((req) => {
                const vIdx = dynamicVenues.indexOf(req.venue_name || '');
                const colorCode = VENUE_COLORS[vIdx >= 0 ? vIdx % VENUE_COLORS.length : 0];
                const isPending = req.status === 'pending';
                const isHovered = hoveredCardId === req.id;
                const isBusy = busyId === req.id;

                return (
                  <div
                    key={req.id}
                    onMouseEnter={() => {
                      setHoveredVenue(req.venue_name || null);
                      setHoveredCardId(req.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredVenue(null);
                      setHoveredCardId(null);
                    }}
                    className="shrink-0 rounded-2xl border-2 flex flex-col overflow-hidden transition-all duration-150"
                    style={{
                      background: C.surface,
                      borderColor:
                        req.status === 'approved'
                          ? C.success
                          : req.status === 'rejected'
                          ? C.danger
                          : isHovered
                          ? C.blue
                          : C.border,
                      boxShadow: isHovered && isPending ? '0 4px 16px rgba(43,57,144,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
                      opacity: isBusy ? 0.6 : !isPending ? 0.92 : 1,
                    }}
                  >
                    <div className="h-1.5" style={{ background: colorCode }} />
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold truncate" style={{ color: C.dark }}>
                            {req.venue_name || 'Unknown Venue'}
                          </h4>
                          <p className="text-xs mt-0.5 truncate" style={{ color: C.charcoal }}>
                            {req.requester_name || 'Academic User'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-xs font-extrabold px-2 py-1 rounded" style={{ background: C.aliceLight, color: C.blue }}>
                            {req.id.substring(0, 7).toUpperCase()}
                          </span>
                          <RoleBadge role={req.requester_role} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-sm p-3 rounded-xl" style={{ background: C.aliceLight }}>
                        <div>
                          <span className="block text-xs uppercase tracking-wide" style={{ color: C.charcoal }}>Date</span>
                          <span className="font-bold" style={{ color: C.dark }}>{formatShortDate(req.booking_date)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-wide" style={{ color: C.charcoal }}>Hours</span>
                          <span className="font-bold" style={{ color: C.dark }}>{req.start_time} – {req.end_time}</span>
                        </div>
                        <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: C.border }}>
                          <span className="block text-xs uppercase tracking-wide" style={{ color: C.charcoal }}>Purpose</span>
                          <span className="font-bold line-clamp-2" style={{ color: C.dark }}>{req.purpose}</span>
                        </div>
                      </div>

                      {isPending ? (
                        <div className="flex flex-col gap-2">
                          <div>
                            <input
                              type="text"
                              placeholder="Reason (required if rejecting)"
                              value={rejectionReasons[req.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setRejectionReasons((prev) => ({ ...prev, [req.id]: value }));
                                setFieldErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[req.id];
                                  return next;
                                });
                              }}
                              className="w-full text-sm px-3.5 py-3 rounded-xl border-2 outline-none transition-colors placeholder:text-gray-400"
                              style={{
                                background: C.aliceLight,
                                color: C.dark,
                                borderColor: fieldErrors[req.id] ? C.danger : C.border,
                              }}
                            />
                            {fieldErrors[req.id] && (
                              <p className="text-xs font-bold mt-1.5" style={{ color: C.danger }}>{fieldErrors[req.id]}</p>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleReview(req.id, 'approved')}
                              disabled={isBusy}
                              style={{
                                flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 10, padding: "10px",
                                fontSize: 13, fontWeight: 900, cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                boxShadow: "0 2px 8px rgba(16,178,27,0.3)", transition: "all 0.15s", opacity: isBusy ? 0.6 : 1
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReview(req.id, 'rejected')}
                              disabled={isBusy}
                              style={{
                                flex: 1, background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "10px",
                                fontSize: 13, fontWeight: 900, cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                boxShadow: "0 2px 8px rgba(227,24,24,0.3)", transition: "all 0.15s", opacity: isBusy ? 0.6 : 1
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 10, background: req.status === "approved" ? tint(C.success, 15) : tint(C.danger, 12), color: req.status === "approved" ? C.success : C.danger, fontWeight: 900, fontSize: 13 }}>
                            {req.status === "approved" ? "✓ Approved" : "✕ Rejected"}
                            <button
                              onClick={() => handleUndo(req.id)}
                              disabled={isBusy}
                              style={{ background: "none", border: "none", cursor: isBusy ? "not-allowed" : "pointer", fontSize: 11, color: "inherit", opacity: 0.7, marginLeft: 4 }}
                            >
                              (undo)
                            </button>
                          </div>
                          {fieldErrors[req.id] && (
                            <p className="text-xs font-bold px-1" style={{ color: C.danger }}>{fieldErrors[req.id]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Live summary footer */}
          <div className="p-4 flex gap-6 shrink-0" style={{ borderTop: `1px solid ${C.border}`, background: C.aliceLight }}>
            {[
              { label: "Pending", val: pendingCount, color: C.danger },
              { label: "Approved", val: approvedCount, color: C.success },
              { label: "Rejected", val: rejectedCount, color: C.charcoal },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-lg font-black" style={{ color: s.color }}>{s.val}</span>
                <span className="text-xs" style={{ color: C.charcoal }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — Master Grid Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden z-10" style={{ background: C.surface }}>
          <div className="p-5 md:px-6 flex justify-between items-center shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div>
              <h3 className="text-lg font-black" style={{ color: C.dark }}>Master Reservation Matrix</h3>
              <p className="text-sm mt-0.5" style={{ color: C.charcoal }}>
                {dynamicDates.length > 0
                  ? `${formatShortDate(dynamicDates[0])} – ${formatShortDate(dynamicDates[dynamicDates.length - 1])} · ${dynamicVenues.length} venue${dynamicVenues.length === 1 ? '' : 's'}`
                  : 'No scheduled dates yet'}
              </p>
            </div>
            <div className="hidden md:flex gap-4">
              <span className="flex items-center gap-2 text-xs font-bold" style={{ color: C.charcoal }}>
                <div className="w-3.5 h-2.5 rounded-sm" style={{ background: C.blue }} /> Approved
              </span>
              <span className="flex items-center gap-2 text-xs font-bold" style={{ color: C.charcoal }}>
                <div className="w-3.5 h-2.5 rounded-sm border-2 border-dashed" style={{ borderColor: C.blue }} /> Pending
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {dynamicDates.length === 0 ? (
              <div className="text-center mt-20 font-bold" style={{ color: C.charcoal }}>
                No venue requests yet — approved and pending bookings will appear here.
              </div>
            ) : (
              <div className="min-w-[920px]">
                <div
                  className="grid border-b-2 sticky top-0 z-10 shadow-sm"
                  style={{ gridTemplateColumns: `160px repeat(${dynamicDates.length}, minmax(130px, 1fr))`, borderColor: C.border, background: C.surface }}
                >
                  <div className="p-3 text-xs font-extrabold tracking-wide uppercase border-r" style={{ color: C.charcoal, borderColor: C.border }}>
                    Venue
                  </div>
                  {dynamicDates.map((dateStr, idx) => {
                    const isToday = dateStr === today;
                    return (
                      <div
                        key={idx}
                        className="p-3 text-center text-sm border-r"
                        style={{
                          fontWeight: isToday ? 900 : 700,
                          color: isToday ? C.blue : C.charcoal,
                          background: isToday ? tint(C.blue, 10) : "transparent",
                          borderColor: C.border,
                        }}
                      >
                        {formatShortDate(dateStr)}
                      </div>
                    );
                  })}
                </div>

                {dynamicVenues.map((venueName, vi) => {
                  const colorCode = VENUE_COLORS[vi % VENUE_COLORS.length];
                  const isTargetRow = hoveredVenue === venueName;

                  return (
                    <div
                      key={vi}
                      className="grid border-b min-h-[96px] transition-colors"
                      style={{
                        gridTemplateColumns: `160px repeat(${dynamicDates.length}, minmax(130px, 1fr))`,
                        borderColor: C.border,
                        background: isTargetRow ? tint(C.blue, 6) : "transparent",
                      }}
                    >
                      <div className="p-3 flex gap-2.5 border-r" style={{ borderColor: C.border, background: C.surface }}>
                        <div className="w-1.5 rounded-sm shrink-0" style={{ background: colorCode }} />
                        <div className="min-w-0 flex items-center">
                          <div className="text-sm font-bold leading-tight break-words" style={{ color: C.dark }}>{venueName}</div>
                        </div>
                      </div>

                      {dynamicDates.map((dateStr, di) => {
                        const dayAllocations = bookings.filter(
                          (b) => (b.venue_name || '') === venueName && b.booking_date === dateStr && b.status !== 'rejected'
                        );

                        return (
                          <div key={di} className="p-2 flex flex-col gap-2 border-r" style={{ borderColor: C.border }}>
                            {dayAllocations.map((allocation) => {
                              const isApproved = allocation.status === 'approved';
                              const start = parseHour(allocation.start_time);
                              const duration = calculateSpan(allocation.start_time, allocation.end_time);

                              return (
                                <div
                                  key={allocation.id}
                                  className="rounded-lg p-2 text-xs font-bold leading-tight flex flex-col justify-between gap-1"
                                  style={{
                                    background: isApproved ? colorCode : "transparent",
                                    border: isApproved ? "none" : `2px dashed ${colorCode}`,
                                    color: isApproved ? "#fff" : colorCode,
                                  }}
                                >
                                  <span className="truncate">{allocation.purpose}</span>
                                  <span className="text-[11px] opacity-90 font-bold tracking-tight">
                                    {start}:00–{start + duration}:00
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}