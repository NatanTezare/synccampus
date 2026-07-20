import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, FacultyAvailability, DayOfWeek } from '../api/types';

export default function FacultyDashboard() {
  const [incomingRequests, setIncomingRequests] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<FacultyAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability Form State
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  // Respond Form State (Inline notes)
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedRequests, fetchedAvailability] = await Promise.all([
        appointmentService.getIncomingAppointments(),
        appointmentService.getMyAvailability()
      ]);
      setIncomingRequests(fetchedRequests);
      setAvailability(fetchedAvailability);
    } catch (error) {
      console.error("Failed to load faculty dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvailabilityError('');

    try {
      await appointmentService.createAvailability({ dayOfWeek, startTime, endTime });
      setStartTime('');
      setEndTime('');
      await loadDashboardData();
    } catch (err: any) {
      setAvailabilityError(err.message || err.response?.data?.message || 'Failed to add availability.');
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!window.confirm("Remove this availability slot?")) return;
    try {
      await appointmentService.deleteAvailability(id);
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to delete availability", err);
    }
  };

  const handleRespond = async (id: string, decision: 'confirmed' | 'rejected') => {
    try {
      const facultyNotes = notes[id] || '';
      await appointmentService.respondToAppointment(id, { decision, facultyNotes });
      
      // Clear note and reload
      setNotes(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || `Failed to ${decision} request.`);
    }
  };

  const handleNoteChange = (id: string, text: string) => {
    setNotes(prev => ({ ...prev, [id]: text }));
  };

  if (loading) return <div className="p-8 text-white">Loading Faculty Dashboard...</div>;

  const pendingRequests = incomingRequests.filter(req => req.status === 'pending');
  const pastRequests = incomingRequests.filter(req => req.status !== 'pending');

  return (
    <div className="p-8 text-white max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Manage Availability */}
      <div className="lg:col-span-1 space-y-6">
        <h1 className="text-3xl font-bold mb-6">My Availability</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Add Weekly Slot</h2>
          {availabilityError && <div className="text-red-400 mb-4 text-sm">{availabilityError}</div>}
          
          <form onSubmit={handleAddAvailability} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Day of Week</label>
              <select 
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 capitalize"
                value={dayOfWeek} 
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              >
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Start Time</label>
                <input type="time" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">End Time</label>
                <input type="time" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Add Slot
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Current Schedule</h2>
          {availability.length === 0 ? (
            <p className="text-gray-400 text-sm">No availability set. Students cannot book you.</p>
          ) : (
            <div className="space-y-2">
              {availability.map(slot => (
                <div key={slot.id} className="p-3 bg-gray-700 rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold capitalize text-blue-300">{slot.day_of_week}</p>
                    <p className="text-xs text-gray-300">{slot.start_time} - {slot.end_time}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAvailability(slot.id)}
                    className="text-red-400 hover:text-red-300 text-xl font-bold"
                    title="Remove slot"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Student Visits */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Student Visits</h1>
        
        {/* Pending Requests */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-yellow-500">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Action Required</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-400">No pending student requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="p-5 bg-gray-700 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{req.student_name}</h3>
                      <p className="text-sm text-gray-400">{req.student_email} | ID: {req.student_id_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-300">{req.appointment_date}</p>
                      <p className="text-sm">{req.start_time} - {req.end_time}</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded mb-4 mt-2 border border-gray-600">
                    <p className="text-sm font-semibold text-gray-400 mb-1">Purpose:</p>
                    <p className="text-sm">{req.purpose}</p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs text-gray-400 mb-1">Note to student (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Please bring your laptop."
                        className="w-full p-2 bg-gray-600 rounded border border-gray-500 text-sm focus:outline-none focus:border-blue-500"
                        value={notes[req.id] || ''}
                        onChange={(e) => handleNoteChange(req.id, e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleRespond(req.id, 'confirmed')}
                        className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => handleRespond(req.id, 'rejected')}
                        className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
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

        {/* History / Responded */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg opacity-90">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Reviewed Requests</h2>
          {pastRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviewed requests.</p>
          ) : (
            <div className="space-y-3">
              {pastRequests.map(req => (
                <div key={req.id} className="p-4 bg-gray-700 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <p className="font-semibold">{req.student_name}</p>
                    <p className="text-xs text-gray-400">{req.appointment_date} ({req.start_time} - {req.end_time})</p>
                    {req.faculty_notes && <p className="text-xs text-blue-300 mt-1">Note: {req.faculty_notes}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    req.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}