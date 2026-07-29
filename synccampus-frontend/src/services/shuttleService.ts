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
  listRoutes: async () => {
    const response = await axiosClient.get('/shuttle/routes');
    return response.data.data; // Added .data to unwrap the array
  },

  listSchedules: async (routeId: string, travelDate: string) => {
    const response = await axiosClient.get(`/shuttle/routes/${routeId}/schedules?date=${travelDate}`);
    return response.data.data; // Added .data to unwrap the array
  },

  createBooking: async (bookingData: { scheduleId: string; travelDate: string }) => {
    const response = await axiosClient.post('/shuttle/bookings', bookingData);
    return response.data;
  }
,
  async getSeatAvailability(scheduleId: string, date: string): Promise<SeatAvailability> {
    const res = await axiosClient.get<ApiResponse<SeatAvailability>>(
      `/shuttle/schedules/${scheduleId}/availability`,
      { params: { date } }
    );
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
