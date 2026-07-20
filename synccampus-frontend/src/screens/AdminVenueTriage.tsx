import React, { useState, useEffect } from 'react';
import { venueService } from '../services/venueService';
import type { VenueBooking } from '../api/types';

export default function AdminVenueTriage() {
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to hold rejection reasons (keyed by booking ID)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');

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
    setActionError('');
    const reason = rejectionReasons[id]?.trim();

    if (decision === 'rejected' && !reason) {
      setActionError('You must provide a reason for rejecting a venue request.');
      return;
    }

    try {
      await venueService.reviewBooking(id, {
        decision,
        rejectionReason: decision === 'rejected' ? reason : undefined,
      });

      // Clear the reason input for this specific ID and reload
      setRejectionReasons(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      await loadBookings();
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || `Failed to ${decision} request.`);
    }
  };

  const handleReasonChange = (id: string, text: string) => {
    setRejectionReasons(prev => ({ ...prev, [id]: text }));
    setActionError(''); // clear errors when typing
  };

  if (loading) return <div className="p-8 text-white">Loading Venue Requests...</div>;

  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const pastRequests = bookings.filter(b => b.status !== 'pending');

  return (
    <div className="p-8 text-white max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Admin Triage: Venues</h1>

      {actionError && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg font-semibold">
          {actionError}
        </div>
      )}

      {/* Action Required Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-yellow-500">
        <h2 className="text-2xl font-semibold mb-6 text-yellow-400">Pending Approvals</h2>
        
        {pendingRequests.length === 0 ? (
          <p className="text-gray-400">No pending venue requests in the queue.</p>
        ) : (
          <div className="space-y-6">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-5 bg-gray-700 rounded-lg shadow border border-gray-600">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                  <div>
                    <h3 className="font-bold text-xl text-blue-300">{req.venue_name}</h3>
                    <p className="text-sm text-gray-300">
                      Requested by: <span className="font-semibold text-white">{req.requester_name}</span> ({req.requester_role?.replace('_', ' ')})
                    </p>
                    <p className="text-xs text-gray-400">{req.requester_email}</p>
                  </div>
                  <div className="text-left md:text-right bg-gray-900 p-3 rounded border border-gray-700">
                    <p className="font-bold text-gold">{req.booking_date}</p>
                    <p className="text-sm">{req.start_time} - {req.end_time}</p>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded mb-4 border border-gray-600">
                  <p className="text-sm font-semibold text-gray-400 mb-1">Purpose of Booking:</p>
                  <p className="text-sm">{req.purpose}</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-gray-400 mb-1">Rejection Reason (Required if rejecting)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Venue is closed for maintenance."
                      className="w-full p-2.5 bg-gray-600 rounded border border-gray-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
                      value={rejectionReasons[req.id] || ''}
                      onChange={(e) => handleReasonChange(req.id, e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleReview(req.id, 'approved')}
                      className="flex-1 md:flex-none bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReview(req.id, 'rejected')}
                      className="flex-1 md:flex-none bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Triage History Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg opacity-90">
        <h2 className="text-xl font-semibold mb-6 text-gray-300">Triage History</h2>
        
        {pastRequests.length === 0 ? (
          <p className="text-gray-400 text-sm">No requests have been reviewed yet.</p>
        ) : (
          <div className="space-y-4">
            {pastRequests.map(req => (
              <div key={req.id} className="p-4 bg-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-gray-500">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-lg">{req.venue_name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      req.status === 'approved' ? 'bg-green-900 text-green-300' : 
                      req.status === 'rejected' ? 'bg-red-900 text-red-300' : 
                      'bg-gray-900 text-gray-300'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {req.booking_date} ({req.start_time} - {req.end_time}) • Req by {req.requester_name}
                  </p>
                  {req.rejection_reason && (
                    <p className="text-xs text-red-300 mt-2 bg-red-900/20 p-2 rounded inline-block border border-red-900/50">
                      <span className="font-semibold">Reason:</span> {req.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-500 uppercase">Reviewed By</p>
                  <p className="text-sm font-semibold text-gray-300">{req.reviewed_by_name || 'Admin'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}