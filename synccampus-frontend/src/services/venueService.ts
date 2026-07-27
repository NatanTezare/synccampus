import axiosClient from '../api/axiosClient';
import type { ApiResponse, Venue, VenueBooking, VenueBusyWindow, RequestStatus } from '../api/types';

export interface CreateVenueBookingPayload {
  venueId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  purpose: string;
}

export interface ReviewVenueBookingPayload {
  decision: 'approved' | 'rejected';
  rejectionReason?: string;
}

export const venueService = {
  // --- Shared ---
  async listVenues(): Promise<Venue[]> {
    const res = await axiosClient.get<ApiResponse<Venue[]>>('/venues');
    return res.data.data;
  },

  

  // --- Student/Faculty (Requester) ---
  async createBooking(payload: CreateVenueBookingPayload): Promise<VenueBooking> {
    const res = await axiosClient.post<ApiResponse<VenueBooking>>('/venue-bookings', payload);
    return res.data.data;
  },

  async getVenueAvailability(venueId: string, date: string): Promise<VenueBusyWindow[]> {
    const res = await axiosClient.get<ApiResponse<VenueBusyWindow[]>>(`/venues/${venueId}/availability`, {
      params: { date },
    });
    return res.data.data;
  },

  async getMyBookings(): Promise<VenueBooking[]> {
    const res = await axiosClient.get<ApiResponse<VenueBooking[]>>('/venue-bookings/my');
    return res.data.data;
  },

  async resetBooking(id: string): Promise<VenueBooking> {
    const res = await axiosClient.patch<ApiResponse<VenueBooking>>(`/venue-bookings/${id}/reset`);
    return res.data.data;
  },

  async cancelBooking(id: string): Promise<VenueBooking> {
    const res = await axiosClient.patch<ApiResponse<VenueBooking>>(`/venue-bookings/${id}/cancel`);
    return res.data.data;
  },

  // --- Admin (Triage) ---
  async getAllBookings(status?: RequestStatus): Promise<VenueBooking[]> {
    const res = await axiosClient.get<ApiResponse<VenueBooking[]>>('/venue-bookings', {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  },

  async reviewBooking(id: string, payload: ReviewVenueBookingPayload): Promise<VenueBooking> {
    const res = await axiosClient.patch<ApiResponse<VenueBooking>>(`/venue-bookings/${id}/review`, payload);
    return res.data.data;
  },
};
