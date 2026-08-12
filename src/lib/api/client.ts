import { ApiRequestError } from "./errors";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set — add it to .env.local");
  return url;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies (file uploads) must NOT get a manual Content-Type — the
  // browser sets its own multipart boundary. Every other call sends JSON.
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: isFormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiRequestError(
      res.status,
      body?.error ?? "unknown_error",
      body?.message ?? body?.error ?? "Something went wrong. Please try again.",
      body?.details
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
