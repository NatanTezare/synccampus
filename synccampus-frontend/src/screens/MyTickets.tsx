import React, { useState, useEffect } from 'react';
import { shuttleService } from '../services/shuttleService';
import type { BusBooking, MyBookingsResponse } from '../api/types';

const C = {
  blue: "#2B3990",
  amber: "#FFCB05",
  alice: "#E8F4FF",
  aliceLight: "#F3F9FF",
  charcoal: "#54566A",
  success: "#10B21B",
  danger: "#E31818",
};

export default function Tickets() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [bookings, setBookings] = useState<MyBookingsResponse>({ active: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await shuttleService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      console.error("Failed to load tickets", err);
      setError("Unable to load your digital tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this ticket?")) return;
    try {
      await shuttleService.cancelBooking(id);
      await loadBookings(); // Reload to move it to history or remove it
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || 'Failed to cancel ticket.');
    }
  };

  const displayedTickets = activeTab === "active" ? bookings.active : bookings.history;

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm relative" style={{ background: C.aliceLight, minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Top Banner (Integrated with Layout) */}
      <div className="relative z-10 p-5 rounded-b-[0px] shadow-sm flex flex-col gap-2" style={{ background: C.blue }}>
        <div className="text-center">
          <h2 className="text-[18px] font-[800] text-white tracking-[0.005em]">My Digital Tickets</h2>
        </div>
      </div>

      {error && (
        <div className="m-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-semibold text-center z-10">
          {error}
        </div>
      )}

      {/* Segmented Tab Bar */}
      <div className="p-3 border-b shrink-0" style={{ background: "#fff", borderColor: "rgba(43,57,144,0.07)" }}>
        <div className="flex p-1 rounded-[10px] w-full" style={{ background: C.aliceLight }}>
          <button
            onClick={() => setActiveTab("active")}
            className="flex-1 py-2 text-[13px] font-[700] rounded-lg transition-all border-none cursor-pointer"
            style={{
              background: activeTab === "active" ? "#fff" : "transparent",
              color: activeTab === "active" ? C.blue : C.charcoal,
              boxShadow: activeTab === "active" ? "0 2px 6px rgba(43,57,144,0.08)" : "none",
            }}
          >
            Active Tickets
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className="flex-1 py-2 text-[13px] font-[700] rounded-lg transition-all border-none cursor-pointer"
            style={{
              background: activeTab === "history" ? "#fff" : "transparent",
              color: activeTab === "history" ? C.blue : C.charcoal,
              boxShadow: activeTab === "history" ? "0 2px 6px rgba(43,57,144,0.08)" : "none",
            }}
          >
            Past History
          </button>
        </div>
      </div>

      {/* Ticket Container Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5">
        {loading ? (
          <div className="text-center mt-10 font-bold" style={{ color: C.blue }}>Loading Tickets...</div>
        ) : displayedTickets.length === 0 ? (
          <div className="text-center mt-10 text-[13px]" style={{ color: C.charcoal }}>
            No tickets found in this section.
          </div>
        ) : (
          displayedTickets.map((ticketRecord) => {
            // Bypass strict typing safely in case backend field names vary slightly
            const t: any = ticketRecord;
            
            // Safely map fields
            const id = t.id || t.booking_id || 'TK-UNKNOWN';
            const routeName = t.route_name || t.schedule?.route?.route_name || 'Campus Route';
            const travelDate = t.travel_date || t.date || 'Date N/A';
            const departureTime = t.departure_time || t.time || t.schedule?.departure_time || 'Time N/A';
            const status = t.status || (activeTab === 'active' ? 'Active' : 'Used');
            const vehicle = t.vehicle || t.bus || 'USIU-BUS';

            return (
              <div
                key={id}
                className="flex flex-col overflow-hidden rounded-[20px] bg-white border"
                style={{
                  boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                  borderColor: "rgba(43,57,144,0.06)",
                }}
              >
                {/* Top Section of Ticket */}
                <div className="p-4 md:p-5 bg-white relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-[800] px-2.5 py-1 rounded-md uppercase tracking-[0.03em]" style={{ background: C.aliceLight, color: C.blue }}>
                      Shuttle Bus
                    </span>
                    <span className="text-[12px] font-[700]" style={{ color: status.toLowerCase() === "active" || status.toLowerCase() === "confirmed" ? C.success : C.charcoal }}>
                      ● {status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[16px] font-[800] mb-1" style={{ color: "#1a1c2e" }}>
                    {routeName}
                  </div>
                  <div className="text-[12px]" style={{ color: C.charcoal }}>
                    {travelDate}
                  </div>

                  <div className="flex flex-wrap gap-6 mt-4 pt-3.5 border-t border-dashed" style={{ borderColor: "rgba(43,57,144,0.1)" }}>
                    <div>
                      <div className="text-[10px] uppercase mb-0.5" style={{ color: C.charcoal }}>Departure</div>
                      <div className="text-[14px] font-[800]" style={{ color: C.blue }}>{departureTime}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase mb-0.5" style={{ color: C.charcoal }}>Vehicle</div>
                      <div className="text-[14px] font-[700]" style={{ color: "#1a1c2e" }}>{vehicle}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase mb-0.5" style={{ color: C.charcoal }}>Fare</div>
                      <div className="text-[14px] font-[700]" style={{ color: "#1a1c2e" }}>Paid</div>
                    </div>
                  </div>
                  
                  {activeTab === 'active' && (
                    <button 
                      onClick={() => handleCancel(id)}
                      className="absolute bottom-4 right-4 text-[10px] font-bold text-red-500 hover:text-red-700 underline"
                    >
                      Cancel Ticket
                    </button>
                  )}
                </div>

                {/* Ticket Jagged Cut / Separator Line */}
                <div className="relative h-5 flex items-center" style={{ background: C.aliceLight }}>
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full" style={{ background: C.aliceLight, boxShadow: "inset -3px 0 4px rgba(0,0,0,0.03)" }} />
                  <div className="w-full border-b-2 border-dashed" style={{ borderColor: "rgba(43,57,144,0.12)" }} />
                  <div className="absolute -right-3 top-0 w-6 h-6 rounded-full" style={{ background: C.aliceLight, boxShadow: "inset 3px 0 4px rgba(0,0,0,0.03)" }} />
                </div>

                {/* Bottom Section (Barcode Container) */}
                <div className="px-5 pt-3.5 pb-5 bg-white flex flex-col items-center justify-center">
                  {/* CSS Barcode */}
                  <div 
                    className="w-full h-[54px] transition-opacity"
                    style={{ 
                      background: "repeating-linear-gradient(90deg, #1a1c2e, #1a1c2e 2px, transparent 2px, transparent 6px, #1a1c2e 6px, #1a1c2e 9px, transparent 9px, transparent 11px)",
                      opacity: status.toLowerCase() === "active" || status.toLowerCase() === "confirmed" ? 1 : 0.25 
                    }} 
                  />
                  <div className="text-[11px] font-[700] mt-2 tracking-[0.2em]" style={{ color: C.charcoal }}>
                    {id.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}