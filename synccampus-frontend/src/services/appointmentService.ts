import axiosClient from '../api/axiosClient';
import type {
  ApiResponse,
  FacultyDirectoryEntry,
  AvailableSlot,
  Appointment,
  AppointmentStatus,
  FacultyAvailability,
  DayOfWeek,
} from '../api/types';

export interface CreateAppointmentPayload {
  facultyId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  purpose: string;
}

export interface RespondAppointmentPayload {
  decision: 'confirmed' | 'rejected';
  facultyNotes?: string;
}

export interface CreateAvailabilityPayload {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export const appointmentService = {
  // --- Student: Browse + Book ---
  async getFacultyDirectory(): Promise<FacultyDirectoryEntry[]> {
    const res = await axiosClient.get<ApiResponse<FacultyDirectoryEntry[]>>('/faculty-directory');
    return res.data.data;
  },

  async getAvailableSlots(facultyId: string): Promise<AvailableSlot[]> {
    const res = await axiosClient.get<ApiResponse<AvailableSlot[]>>(`/faculty/${facultyId}/available-slots`);
    return res.data.data;
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    const res = await axiosClient.post<ApiResponse<Appointment>>('/appointments', payload);
    return res.data.data;
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const res = await axiosClient.get<ApiResponse<Appointment[]>>('/appointments/my');
    return res.data.data;
  },

  async cancelAppointment(id: string): Promise<Appointment> {
    const res = await axiosClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`);
    return res.data.data;
  },

  // --- Faculty: Tab A — Incoming requests ---
  async getIncomingAppointments(status?: AppointmentStatus): Promise<Appointment[]> {
    const res = await axiosClient.get<ApiResponse<Appointment[]>>('/appointments/incoming', {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  },

  async respondToAppointment(id: string, payload: RespondAppointmentPayload): Promise<Appointment> {
    const res = await axiosClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/respond`, payload);
    return res.data.data;
  },

  // --- Faculty: Tab B — Manage recurring weekly availability ---
  async getMyAvailability(): Promise<FacultyAvailability[]> {
    const res = await axiosClient.get<ApiResponse<FacultyAvailability[]>>('/availability/my');
    return res.data.data;
  },

  async createAvailability(payload: CreateAvailabilityPayload): Promise<FacultyAvailability> {
    const res = await axiosClient.post<ApiResponse<FacultyAvailability>>('/availability', payload);
    return res.data.data;
  },

  async deleteAvailability(id: string): Promise<FacultyAvailability> {
    const res = await axiosClient.delete<ApiResponse<FacultyAvailability>>(`/availability/${id}`);
    return res.data.data;
  },
};
