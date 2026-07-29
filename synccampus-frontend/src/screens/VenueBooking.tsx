import React, { useState, useEffect, useMemo } from 'react';
import { venueService } from '../services/venueService';
import type { CreateVenueBookingPayload } from '../services/venueService';
import type { Venue, VenueBooking, VenueBusyWindow } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { tint } from '../theme/tint';

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

export default function VenueBooking() {
  const C = useTheme();

  const inputStyle = { background: C.aliceLight, color: C.dark };
  const inputClass =
    'w-full rounded-xl px-3.5 py-3 outline-none text-[13px] border-2 border-transparent focus:border-[#2B3990] transition-all';
  const labelClass = 'text-[11px] font-[700] uppercase tracking-[0.05em]';

  const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: tint('#F59E0B', 18), text: '#B45309', label: 'Pending' },
    approved: { bg: tint(C.success, 15), text: C.success, label: 'Approved' },
    rejected: { bg: tint(C.danger, 12), text: C.danger, label: 'Rejected' },
    cancelled: { bg: C.aliceLight, text: C.charcoal, label: 'Cancelled' },
  };

  const [venues, setVenues] = useState<Venue[]>([]);
  const [myBookings, setMyBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [venueId, setVenueId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const [busyWindows, setBusyWindows] = useState<VenueBusyWindow[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedVenues, fetchedBookings] = await Promise.all([
        venueService.listVenues(),
        venueService.getMyBookings(),
      ]);
      setVenues(fetchedVenues);
      setMyBookings(fetchedBookings);
    } catch (error) {
      console.error("Failed to load venue data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBusyWindows([]);
    if (!venueId || !bookingDate) return;

    let cancelled = false;
    setBusyLoading(true);
    venueService
      .getVenueAvailability(venueId, bookingDate)
      .then((windows) => {
        if (!cancelled) setBusyWindows(windows);
      })
      .catch(() => {
        if (!cancelled) setBusyWindows([]);
      })
      .finally(() => {
        if (!cancelled) setBusyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [venueId, bookingDate]);

  const clientConflict = useMemo(() => {
    if (!startTime || !endTime || startTime >= endTime) return null;
    return busyWindows.find((w) => rangesOverlap(startTime, endTime, w.start_time.slice(0, 5), w.end_time.slice(0, 5))) ?? null;
  }, [busyWindows, startTime, endTime]);

  const selectedVenueName = venues.find((v) => v.id === venueId)?.name ?? 'This venue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (clientConflict) {
      setSubmitError(
        `${selectedVenueName} is already ${clientConflict.status === 'approved' ? 'booked' : 'pending review'} from ${formatTime(clientConflict.start_time.slice(0, 5))} to ${formatTime(clientConflict.end_time.slice(0, 5))} that day. Please pick a different time.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateVenueBookingPayload = { venueId, bookingDate, startTime, endTime, purpose };
      await venueService.createBooking(payload);

      setVenueId('');
      setBookingDate('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      setBusyWindows([]);
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold text-lg" style={{ color: C.blue }}>Loading USIU Venues...</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm" style={{ background: C.aliceLight }}>
      {/* Banner */}
      <div className="p-5" style={{ background: C.blue }}>
        <div className="text-center">
          <h2 className="text-[18px] font-[800] text-white tracking-[0.005em]">Venue Booking</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(232,244,255,0.65)" }}>Request a space for your event</p>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-5 flex flex-col gap-5">
        {/* Request form */}
        <div className="rounded-2xl p-5" style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}>
          <h3 className="text-[15px] font-[800] mb-4" style={{ color: C.dark }}>Request a Space</h3>

          {submitError && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold text-center" style={{ background: tint(C.danger, 10), color: C.danger, border: `1px solid ${tint(C.danger, 30)}` }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: C.charcoal }}>Select Venue</label>
              <select className={inputClass} style={inputStyle} value={venueId} onChange={(e) => setVenueId(e.target.value)} required>
                <option value="">-- Choose a location --</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: C.charcoal }}>Date</label>
                <input type="date" required min={new Date().toISOString().slice(0, 10)} className={inputClass} style={inputStyle} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: C.charcoal }}>Start Time</label>
                <input
                  type="time"
                  required
                  className={inputClass}
                  style={{ ...inputStyle, border: clientConflict ? `2px solid ${C.danger}` : undefined }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: C.charcoal }}>End Time</label>
                <input
                  type="time"
                  required
                  className={inputClass}
                  style={{ ...inputStyle, border: clientConflict ? `2px solid ${C.danger}` : undefined }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {venueId && bookingDate && (
              <div className="rounded-xl p-3.5" style={{ background: C.aliceLight, border: `1px solid ${C.border}` }}>
                {busyLoading ? (
                  <p className="text-xs" style={{ color: C.charcoal }}>Checking existing bookings...</p>
                ) : busyWindows.length === 0 ? (
                  <p className="text-xs font-semibold" style={{ color: C.success }}>✓ {selectedVenueName} has no bookings yet on this date.</p>
                ) : (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: C.charcoal }}>Already reserved on this date:</p>
                    <ul className="space-y-1.5">
                      {busyWindows.map((w, i) => {
                        const s = w.status === 'approved' ? STATUS_STYLES.approved : STATUS_STYLES.pending;
                        return (
                          <li key={i} className="text-xs flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: s.bg, color: s.text }}>
                              {s.label}
                            </span>
                            <span style={{ color: C.dark }}>
                              {formatTime(w.start_time.slice(0, 5))} – {formatTime(w.end_time.slice(0, 5))}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {clientConflict && (
                  <p className="text-xs font-bold mt-2" style={{ color: C.danger }}>
                    ⚠ Your selected time overlaps an existing reservation. Pick a time outside the windows above.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: C.charcoal }}>Purpose of Booking</label>
              <textarea
                required
                rows={3}
                className={inputClass}
                style={inputStyle}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="E.g., Club meeting, study group..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !!clientConflict || !venueId || !bookingDate || !startTime || !endTime || !purpose.trim()}
              className="w-full rounded-xl p-[13px] text-[14px] font-[800] transition-all"
              style={{
                background: (submitting || !!clientConflict || !venueId || !bookingDate || !startTime || !endTime || !purpose.trim()) ? '#c8d4e8' : C.blue,
                color: '#fff',
                cursor: (submitting || !!clientConflict || !venueId || !bookingDate || !startTime || !endTime || !purpose.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : clientConflict ? 'Time unavailable' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div>
          <h3 className="text-[13px] font-[800] uppercase tracking-wide mb-3" style={{ color: C.charcoal }}>My Requests</h3>

          {myBookings.length === 0 ? (
            <p className="text-sm" style={{ color: C.charcoal }}>You haven't made any booking requests yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myBookings.map((booking) => {
                const s = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl p-4"
                    style={{ background: C.surface, boxShadow: '0 1px 6px rgba(43,57,144,0.05)', border: `1px solid ${C.border}` }}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <p className="text-sm font-[800]" style={{ color: C.dark }}>{booking.venue_name}</p>
                      <span className="text-[10px] font-[800] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0" style={{ background: s.bg, color: s.text }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: C.charcoal }}>
                      {formatDate(booking.booking_date)} · {formatTime(booking.start_time.slice(0, 5))} – {formatTime(booking.end_time.slice(0, 5))}
                    </p>
                    <p className="text-xs" style={{ color: C.charcoal }}>{booking.purpose}</p>

                    {booking.status === 'rejected' && booking.rejection_reason && (
                      <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: tint(C.danger, 10), color: C.danger }}>
                        "{booking.rejection_reason}"
                      </p>
                    )}
                    {booking.reviewed_by_name && booking.status !== 'pending' && (
                      <p className="text-[11px] mt-2" style={{ color: C.charcoal }}>Reviewed by {booking.reviewed_by_name}</p>
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