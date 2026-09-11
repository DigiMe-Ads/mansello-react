import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  ContactMessage,
  CreateContactMessageInput,
  CreateCustomOrderRequestInput,
  CreateTransportRequestInput,
  CustomOrderRequest,
  LeadStatus,
  NewsletterSubscriber,
  Site,
  SubscribeNewsletterInput,
  TransportRequest,
} from "./types";

// --- Public ---

export function submitContactMessage(input: CreateContactMessageInput) {
  return apiFetch<ContactMessage>("/api/leads/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitTransportRequest(input: CreateTransportRequestInput) {
  return apiFetch<TransportRequest>("/api/leads/transport-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES.md. Safe to
// call now: the API client surfaces a normal ApiRequestError (404) until
// the backend adds the route, which callers already handle.
export function subscribeToNewsletter(input: SubscribeNewsletterInput) {
  return apiFetch<NewsletterSubscriber>("/api/leads/newsletter", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_MARKETPLACE_CUSTOM_ORDERS.md. Safe to call now: the API
// client surfaces a normal ApiRequestError (404) until the backend adds the
// route, which the form already handles.
export function submitCustomOrderRequest(input: CreateCustomOrderRequestInput) {
  return apiFetch<CustomOrderRequest>("/api/leads/custom-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Admin ---

export function listContactMessages(fetcher: AuthedFetch, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetcher<ContactMessage[]>(`/api/leads/contact${query}`);
}

export function updateContactMessageStatus(fetcher: AuthedFetch, id: string, status: LeadStatus) {
  return fetcher<ContactMessage>(`/api/leads/contact/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listTransportRequests(fetcher: AuthedFetch, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetcher<TransportRequest[]>(`/api/leads/transport-requests${query}`);
}

export function updateTransportRequestStatus(fetcher: AuthedFetch, id: string, status: LeadStatus) {
  return fetcher<TransportRequest>(`/api/leads/transport-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listNewsletterSubscribers(fetcher: AuthedFetch, site?: Site) {
  const query = site ? `?site=${encodeURIComponent(site)}` : "";
  return fetcher<NewsletterSubscriber[]>(`/api/leads/newsletter${query}`);
}

export function listCustomOrderRequests(fetcher: AuthedFetch, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetcher<CustomOrderRequest[]>(`/api/leads/custom-orders${query}`);
}

export function updateCustomOrderRequestStatus(fetcher: AuthedFetch, id: string, status: LeadStatus) {
  return fetcher<CustomOrderRequest>(`/api/leads/custom-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
