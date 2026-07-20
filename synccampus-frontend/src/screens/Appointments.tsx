import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { CreateAppointmentPayload } from '../services/appointmentService';
import type { Appointment, FacultyDirectoryEntry, AvailableSlot } from '../api/types';

export default function Appointments() {
  const [facultyList, setFacultyList] = useState<FacultyDirectoryEntry[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  const [facultyId, setFacultyId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedFaculty, fetchedAppointments] = await Promise.all([
        appointmentService.getFacultyDirectory(),
        appointmentService.getMyAppointments()
      ]);
      setFacultyList(fetchedFaculty);
      setMyAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Failed to load appointment data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!facultyId) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        const slots = await appointmentService.getAvailableSlots(facultyId);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to fetch slots", error);
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [facultyId]);

  const validateBooking = () => {
    if (!appointmentDate || !startTime || !endTime) return "Please fill in all date and time fields.";
    if (startTime >= endTime) return "End time must be after start time.";
    
    if (availableSlots.length === 0) return "This faculty member has no available slots.";

    const selectedDate = new Date(appointmentDate);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const validSlot = availableSlots.find((slot: any) => 
      slot.day_of_week === dayName && 
      startTime >= slot.start_time && 
      endTime <= slot.end_time
    );

    if (!validSlot) {
      return `Invalid time. Please ensure your date falls on an available day, and the time is strictly within their allowed hours.`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateBooking();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const payload: CreateAppointmentPayload = {
        facultyId,
        appointmentDate,
        startTime,
        endTime,
        purpose
      };
      
      await appointmentService.createAppointment(payload);
      
      setFacultyId('');
      setAppointmentDate('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      setAvailableSlots([]);
      
      const freshAppointments = await appointmentService.getMyAppointments();
      setMyAppointments(freshAppointments);
    } catch (err: any) {
      setFormError(err.message || err.response?.data?.message || 'Failed to book appointment.');
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

  if (loading) return <div className="p-8 text-white">Loading Appointments...</div>;

  return (
    <div className="p-8 text-white max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <div>
        <h1 className="text-3xl font-bold mb-8">Book Appointment</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">New Request</h2>
          {formError && <div className="text-red-400 mb-4 bg-red-900/30 p-3 rounded">{formError}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Select Faculty</label>
              <select 
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                value={facultyId} 
                onChange={(e) => setFacultyId(e.target.value)}
                required
              >
                <option value="">Choose a lecturer or staff member</option>
                {facultyList.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.full_name} ({faculty.department || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {facultyId && availableSlots.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-lg mb-4">
                <p className="text-sm font-semibold text-blue-300 mb-2">Allowed Availability:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {availableSlots.map((slot: any, idx) => (
                    <li key={idx} className="capitalize">
                      {slot.day_of_week}s from {slot.start_time} to {slot.end_time}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {facultyId && availableSlots.length === 0 && (
              <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-300">This faculty member has not set any available slots yet.</p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 disabled:opacity-50" 
                value={appointmentDate} 
                onChange={e => setAppointmentDate(e.target.value)} 
                disabled={!facultyId || availableSlots.length === 0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Start Time</label>
                <input 
                  type="time" 
                  required 
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 disabled:opacity-50" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)}
                  disabled={!facultyId || availableSlots.length === 0}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">End Time</label>
                <input 
                  type="time" 
                  required 
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 disabled:opacity-50" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  disabled={!facultyId || availableSlots.length === 0}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Purpose of Visit</label>
              <textarea 
                required 
                rows={3}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 disabled:opacity-50" 
                value={purpose} 
                onChange={e => setPurpose(e.target.value)}
                disabled={!facultyId || availableSlots.length === 0}
                placeholder="Briefly describe what you need to discuss..."
              />
            </div>

            <button 
              type="submit" 
              disabled={!facultyId || availableSlots.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded transition-colors"
            >
              Request Appointment
            </button>
          </form>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-8 invisible md:visible">History</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">My Requests</h2>
          {myAppointments.length === 0 ? (
            <p className="text-gray-400 text-sm">You have not booked any appointments.</p>
          ) : (
            <div className="space-y-4">
              {myAppointments.map(app => (
                <div key={app.id} className="p-4 bg-gray-700 rounded-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{app.faculty_name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      app.status === 'confirmed' ? 'bg-green-900 text-green-300' : 
                      app.status === 'rejected' ? 'bg-red-900 text-red-300' : 
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{app.appointment_date} at {app.start_time}</p>
                  
                  {app.faculty_notes && (
                    <div className="mt-3 bg-gray-800 p-2 rounded border border-gray-600">
                      <p className="text-xs text-blue-300 font-semibold">Note from faculty:</p>
                      <p className="text-sm text-gray-300">{app.faculty_notes}</p>
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <button 
                      onClick={() => handleCancel(app.id)}
                      className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}