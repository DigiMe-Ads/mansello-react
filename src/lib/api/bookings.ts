import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  Booking,
  CancelBookingInput,
  CreateBookingInput,
  CreateBookingResponse,
  CreateOfflineBookingInput,
} from "./types";

export function createBooking(input: CreateBookingInput) {
  return apiFetch<CreateBookingResponse>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getBooking(id: string) {
  return apiFetch<Booking>(`/api/bookings/${id}`);
}

export function listBookingsForProperty(fetcher: AuthedFetch, propertyId: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetcher<Booking[]>(`/api/bookings/property/${propertyId}${query}`);
}

export function createOfflineBooking(fetcher: AuthedFetch, input: CreateOfflineBookingInput) {
  return fetcher<Booking>("/api/bookings/offline", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelBooking(fetcher: AuthedFetch, bookingId: string, input: CancelBookingInput) {
  return fetcher<Booking>(`/api/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
