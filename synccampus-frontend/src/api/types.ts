// ============================================
// Shared API envelope — every backend response follows this shape
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================
// Auth / Users
// ============================================
export type UserRole = 'student' | 'faculty_leadership' | 'admin';
export type FacultyTitle = 'lecturer' | 'hod' | 'vc' | 'staff';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  title: FacultyTitle | null;
  department: string | null;
  student_id_no: string | null;
  phone_number: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

// ============================================
// Venue Booking & Triage
// ============================================
export type VenueType = 'auditorium' | 'lab' | 'classroom' | 'conference_room' | 'outdoor';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Venue {
  id: string;
  name: string;
  building: string | null;
  venue_type: VenueType;
  capacity: number;
}

export interface VenueBusyWindow {
  start_time: string;
  end_time: string;
  status: RequestStatus;
}

export interface VenueBooking {
  id: string;
  requester_id: string;
  venue_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM:SS
  end_time: string;
  purpose: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  venue_name?: string;
  building?: string;
  venue_type?: VenueType;
  capacity?: number;
  reviewed_by_name?: string;
  requester_name?: string;
  requester_email?: string;
  requester_role?: UserRole;
}

// ============================================
// Appointments
// ============================================
export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface FacultyDirectoryEntry {
  id: string;
  full_name: string;
  title: FacultyTitle;
  department: string | null;
  email: string;
}

export interface AvailableSlot {
  date: string;       // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  startTime: string;  // HH:MM
  endTime: string;
}

export interface FacultyAvailability {
  id: string;
  faculty_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  student_id: string;
  faculty_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: AppointmentStatus;
  faculty_notes: string | null;
  created_at: string;
  updated_at: string;
  // joined fields (student view)
  faculty_name?: string;
  title?: FacultyTitle;
  department?: string;
  // joined fields (faculty view)
  student_name?: string;
  student_email?: string;
  student_id_no?: string;
}

// ============================================
// Shuttle System
// ============================================
export type BusBookingStatus = 'booked' | 'cancelled' | 'completed' | 'no_show';

export interface BusRoute {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
}

export interface BusSchedule {
  id: string;
  route_id: string;
  departure_time: string;
  total_seats: number;
}

export interface SeatAvailability {
  totalSeats: number;
  bookedCount: number;
  seatsLeft: number;
}

export interface BusBooking {
  id: string;
  user_id: string;
  schedule_id: string;
  travel_date: string;
  seat_number: number;
  ticket_code: string;
  status: BusBookingStatus;
  created_at: string;
  // joined fields
  route_name?: string;
  origin?: string;
  destination?: string;
  departure_time?: string;
}

export interface MyBookingsResponse {
  active: BusBooking[];
  history: BusBooking[];
}
