import React, { useState, useEffect } from 'react';
import { venueService } from '../services/venueService';
import type { CreateVenueBookingPayload } from '../services/venueService';
import type { Venue, VenueBooking } from '../api/types';

export default function VenueBooking() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [myBookings, setMyBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  // Form State (kept as camelCase for local component tracking)
  const [venueId, setVenueId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedVenues, fetchedBookings] = await Promise.all([
        venueService.listVenues(),
        venueService.getMyBookings()
      ]);
      setVenues(fetchedVenues);
      setMyBookings(fetchedBookings);
    } catch (error) {
      console.error("Failed to load venue data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    try {
      const payload: CreateVenueBookingPayload = {
        venueId,
        bookingDate,
        startTime,
        endTime,
        purpose
      };
      
      await venueService.createBooking(payload);
      
      // Clear form and reload data to show the new pending request
      setVenueId('');
      setPurpose('');
      await loadData(); 
    } catch (err: any) {
      // Check err.message first, since your axiosClient intercepts and formats it
      setSubmitError(err.message || err.response?.data?.message || 'Failed to submit request.');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading USIU Venues...</div>;

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Venue Booking & Triage</h1>
      
      {/* Booking Form */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Request a Space</h2>
        {submitError && <div className="text-red-400 mb-4">{submitError}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Select Venue</label>
            <select 
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              value={venueId} 
              onChange={(e) => setVenueId(e.target.value)}
              required
            >
              <option value="">-- Choose a location --</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Start Time</label>
              <input type="time" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">End Time</label>
              <input type="time" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Purpose of Booking</label>
            <textarea required rows={3} className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="E.g., Club meeting, study group..."></textarea>
          </div>

          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors">
            Submit Request
          </button>
        </form>
      </div>

      {/* Booking History */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">My Requests</h2>
        {myBookings.length === 0 ? (
          <p className="text-gray-400">You haven't made any booking requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myBookings.map(booking => (
              <div key={booking.id} className="p-4 bg-gray-700 rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{booking.booking_date} ({booking.start_time} - {booking.end_time})</p>
                  <p className="text-sm text-gray-300">Purpose: {booking.purpose}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-bold ${
                  booking.status === 'approved' ? 'bg-green-900 text-green-300' : 
                  booking.status === 'rejected' ? 'bg-red-900 text-red-300' : 
                  'bg-yellow-900 text-yellow-300'
                }`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}