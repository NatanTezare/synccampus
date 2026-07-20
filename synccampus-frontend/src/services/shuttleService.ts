import axiosClient from '../api/axiosClient';
import type {
  ApiResponse,
  BusRoute,
  BusSchedule,
  SeatAvailability,
  BusBooking,
  MyBookingsResponse,
} from '../api/types';

export interface CreateShuttleBookingPayload {
  scheduleId: string;
  travelDate: string; // YYYY-MM-DD
}

export const shuttleService = {
  async listRoutes(): Promise<BusRoute[]> {
    const res = await axiosClient.get<ApiResponse<BusRoute[]>>('/shuttle/routes');
    return res.data.data;
  },

  async listSchedules(routeId: string): Promise<BusSchedule[]> {
    const res = await axiosClient.get<ApiResponse<BusSchedule[]>>('/shuttle/schedules', {
      params: { routeId },
    });
    return res.data.data;
  },

  async getSeatAvailability(scheduleId: string, date: string): Promise<SeatAvailability> {
    const res = await axiosClient.get<ApiResponse<SeatAvailability>>(
      `/shuttle/schedules/${scheduleId}/availability`,
      { params: { date } }
    );
    return res.data.data;
  },

  async createBooking(payload: CreateShuttleBookingPayload): Promise<BusBooking> {
    const res = await axiosClient.post<ApiResponse<BusBooking>>('/shuttle/bookings', payload);
    return res.data.data;
  },

  // Maps directly onto Screen3Ticket.tsx: { active, history }
  async getMyBookings(): Promise<MyBookingsResponse> {
    const res = await axiosClient.get<ApiResponse<MyBookingsResponse>>('/shuttle/bookings/my');
    return res.data.data;
  },

  async cancelBooking(id: string): Promise<BusBooking> {
    const res = await axiosClient.patch<ApiResponse<BusBooking>>(`/shuttle/bookings/${id}/cancel`);
    return res.data.data;
  },
};
