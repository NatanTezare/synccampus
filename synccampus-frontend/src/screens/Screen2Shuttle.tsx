import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shuttleService } from '../services/shuttleService';
import type { BusRoute, BusSchedule } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { tint } from '../theme/tint';

function seatColor(seats: number, total: number, danger: string, success: string) {
  const pct = seats / total;
  if (pct <= 0.1) return danger;
  if (pct <= 0.4) return "#F59E0B";
  return success;
}

function seatLabel(seats: number) {
  if (seats === 0) return "Full";
  if (seats <= 3) return `${seats} Left — Hurry!`;
  if (seats <= 8) return `${seats} Seats Left`;
  return `${seats} Seats Available`;
}

function generateMockCapacity(scheduleId: string, maxSeats: number) {
  const hash = scheduleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seats = hash % (maxSeats + 1);
  return { seats, total: maxSeats };
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
}

export default function Shuttle() {
  const navigate = useNavigate();
  const C = useTheme();

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);

  const [routesLoading, setRoutesLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setRoutesLoading(true);
        const fetchedRoutes = await shuttleService.listRoutes();
        setRoutes(fetchedRoutes);
        if (fetchedRoutes.length > 0) {
          setSelectedRouteId(fetchedRoutes[0].id);
        }
      } catch (err) {
        console.error("Failed to load routes", err);
        setError("Unable to load shuttle routes.");
      } finally {
        setRoutesLoading(false);
      }
    };
    loadRoutes();
  }, []);

  // 2. Load Schedules whenever the selected route changes
  useEffect(() => {
    if (!selectedRouteId) return;

    const loadSchedules = async () => {
      try {
        setSchedulesLoading(true);
        setSelectedScheduleId(null); 
        // Pass todayDate here!
        const fetchedSchedules = await shuttleService.listSchedules(selectedRouteId, todayDate);
        setSchedules(fetchedSchedules);
      } catch (err) {
        console.error("Failed to load schedules", err);
      } finally {
        setSchedulesLoading(false);
      }
    };
    
    loadSchedules();
  }, [selectedRouteId, todayDate]); // Added todayDate as dependency

  const handleBook = async () => {
    if (!selectedScheduleId) return;

    try {
      setBookingLoading(true);
      setError('');
      await shuttleService.createBooking({
        scheduleId: selectedScheduleId,
        travelDate: todayDate,
      });
      navigate('/tickets');
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Failed to book shuttle.');
      setBookingLoading(false);
    }
  };

  if (routesLoading) return <div className="p-8 text-center font-bold text-lg" style={{ color: C.blue }}>Loading Shuttle Data...</div>;

  const activeRoute = routes.find((r) => r.id === selectedRouteId);
  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId);

  return (
    <div
      className="flex flex-col h-full w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm relative"
      style={{ background: C.aliceLight, minHeight: 'calc(100vh - 120px)' }}
    >
      {/* Top Banner */}
      <div className="relative z-10 p-5 shadow-sm flex flex-col gap-2" style={{ background: C.blue }}>
        <div className="text-center">
          <h2 className="text-[18px] font-[800] text-white tracking-[0.005em]">Book Campus Shuttle</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(232,244,255,0.65)" }}>{displayDate}</p>
        </div>
      </div>

      {error && (
        <div
          className="m-4 p-3 rounded-xl text-xs font-semibold text-center z-10"
          style={{ background: tint(C.danger, 10), color: C.danger, border: `1px solid ${tint(C.danger, 30)}` }}
        >
          {error}
        </div>
      )}

      {/* Route Filter */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto border-b items-center shrink-0" style={{ background: C.surface, borderColor: C.border }}>
        <span className="text-[12px] font-[700] whitespace-nowrap pr-2" style={{ color: C.charcoal }}>Route:</span>
        {routes.map((route) => {
          const isActive = selectedRouteId === route.id;
          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-[12px] font-[700] rounded-full transition-colors border-[1.5px]"
              style={{
                background: isActive ? C.amber : C.aliceLight,
                borderColor: isActive ? C.amber : C.border,
                color: isActive ? '#1a1c2e' : C.blue,
              }}
            >
              {route.route_name}
            </button>
          );
        })}
      </div>

      {/* Slot List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 pb-[100px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-[700] uppercase tracking-[0.06em]" style={{ color: C.charcoal }}>
            {schedulesLoading ? 'Loading Schedules...' : `${schedules.length} Departures Available`}
          </span>
        </div>

        {!schedulesLoading && schedules.length === 0 ? (
          <div className="text-center mt-10 text-[13px] font-semibold" style={{ color: C.charcoal }}>
            No shuttles scheduled for this route today.
          </div>
        ) : (
          schedules.map((schedule) => {
            const isSelected = selectedScheduleId === schedule.id;
            const capacity = generateMockCapacity(schedule.id, schedule.total_seats);
            const color = seatColor(capacity.seats, capacity.total, C.danger, C.success);
            const isFull = capacity.seats === 0;
            const pctFilled = ((capacity.total - capacity.seats) / capacity.total) * 100;
            const formattedTime = formatTime(schedule.departure_time);

            return (
              <button
                key={schedule.id}
                onClick={() => !isFull && setSelectedScheduleId(schedule.id)}
                disabled={isFull}
                className="w-full text-left rounded-[16px] p-4 relative transition-all shrink-0 border-2 flex flex-col gap-3"
                style={{
                  background: C.surface,
                  borderColor: isSelected ? C.blue : C.border,
                  boxShadow: isSelected ? '0 4px 20px rgba(43,57,144,0.16)' : '0 1px 4px rgba(0,0,0,0.04)',
                  opacity: isFull ? 0.6 : 1,
                  cursor: isFull ? 'not-allowed' : 'pointer',
                }}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: C.blue }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="rounded-[10px] px-3 py-2 text-center min-w-[70px] transition-colors" style={{ background: isSelected ? C.blue : C.aliceLight }}>
                    <div className="text-[18px] font-[900] leading-none" style={{ color: isSelected ? '#fff' : C.blue }}>
                      {formattedTime}
                    </div>
                  </div>
                  <div className="flex-1 pr-6">
                    <div className="text-[14px] font-[700] leading-[1.2]" style={{ color: C.dark }}>
                      {activeRoute?.route_name}
                    </div>
                    <div className="flex gap-2.5 mt-1.5 flex-wrap">
                      <span className="text-[11px]" style={{ color: C.charcoal }}>🚌 {activeRoute?.origin} &rarr; {activeRoute?.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="h-[7px] rounded-full overflow-hidden" style={{ background: tint(C.blue, 10) }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctFilled}%`, background: color }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-[700]" style={{ color }}>{seatLabel(capacity.seats)}</span>
                    <span className="text-[11px]" style={{ color: C.charcoal }}>{capacity.total - capacity.seats}/{capacity.total} booked</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Floating Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t z-20 shrink-0" style={{ background: C.surface, borderColor: C.border }}>
        <button
          onClick={handleBook}
          disabled={!selectedScheduleId || bookingLoading}
          className="w-full border-none rounded-xl p-[15px] text-[15px] font-[800] tracking-[0.01em] flex items-center justify-center gap-2 transition-all shadow-sm"
          style={{
            background: selectedScheduleId ? C.blue : '#c8d4e8',
            color: '#fff',
            cursor: selectedScheduleId && !bookingLoading ? 'pointer' : 'not-allowed',
          }}
        >
          {bookingLoading ? 'Processing...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2l1.5 4h4l-3.5 2.5 1.5 4L9 10l-3.5 2.5 1.5-4L3.5 6h4L9 2z" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
              Confirm Booking
              {selectedScheduleId && (
                <span className="ml-1 rounded-md px-2 py-0.5 text-[12px] font-[900]" style={{ background: C.amber, color: '#1a1c2e' }}>
                  Ksh 450
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}