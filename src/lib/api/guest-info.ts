import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  BookingInfoRequest,
  BookingInfoRequestPublicView,
  GuestInfoFormTemplate,
  SubmitGuestInfoInput,
  UpdateGuestInfoFormTemplateInput,
} from "./types";

// --- Admin: the shared field template ---

export function getGuestInfoFormTemplate(fetcher: AuthedFetch) {
  return fetcher<GuestInfoFormTemplate>("/api/admin/guest-info-template");
}

export function updateGuestInfoFormTemplate(fetcher: AuthedFetch, input: UpdateGuestInfoFormTemplateInput) {
  return fetcher<GuestInfoFormTemplate>("/api/admin/guest-info-template", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// --- Admin: per-booking requests ---

export function listBookingInfoRequests(fetcher: AuthedFetch, bookingId: string) {
  return fetcher<BookingInfoRequest[]>(`/api/bookings/${bookingId}/info-requests`);
}

export function createBookingInfoRequest(fetcher: AuthedFetch, bookingId: string) {
  return fetcher<BookingInfoRequest>(`/api/bookings/${bookingId}/info-requests`, {
    method: "POST",
  });
}

// --- Public: the guest-facing token link ---

export function getBookingInfoRequestByToken(token: string) {
  return apiFetch<BookingInfoRequestPublicView>(`/api/booking-info-requests/${token}`);
}

export function submitBookingInfoRequest(token: string, input: SubmitGuestInfoInput) {
  return apiFetch<void>(`/api/booking-info-requests/${token}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Guest document uploads (passport scans etc.) for a "file"-type field —
// token-gated the same way the rest of this flow is, no guest account
// needed. Uploaded immediately on file selection, same UX as the admin
// image dropzone, just against a public/token endpoint instead of an
// authed one.
export function uploadGuestInfoFiles(token: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  return apiFetch<{ urls: string[] }>(`/api/booking-info-requests/${token}/uploads`, {
    method: "POST",
    body: formData,
  });
}
