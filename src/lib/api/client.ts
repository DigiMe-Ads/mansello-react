import { ApiRequestError } from "./errors";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set — add it to .env.local");
  // Every call through here carries guest PII, and the admin calls carry a
  // bearer token. A build accidentally pointed at an http:// origin would ship
  // all of that in plaintext and do it silently, so fail loudly instead.
  // localhost is exempt so `npm run dev` against a local backend still works.
  if (!/^https:\/\//i.test(url) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url)) {
    throw new Error(`NEXT_PUBLIC_API_URL must use https:// (got "${url}")`);
  }
  return url;
}

// Ceiling on any single request. Without one, a stalled connection (mobile
// dead-zone, hung backend) never settles the promise, so the `finally` that
// re-enables a submit button never runs and the form sits on "Sending…"
// forever with no error and no way to retry short of reloading. Generous
// enough not to trip on a slow upload on a poor connection.
const REQUEST_TIMEOUT_MS = 30000;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies (file uploads) must NOT get a manual Content-Type — the
  // browser sets its own multipart boundary. Every other call sends JSON.
  const isFormData = init?.body instanceof FormData;

  // Respect a caller-supplied signal (used for cancel-on-unmount) rather than
  // replacing it — combine the two so whichever fires first wins.
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      signal,
      headers: isFormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (err) {
    // A timeout surfaces as a TimeoutError DOMException. Convert it into the
    // same ApiRequestError shape every caller's error UI already renders, so
    // a hung request shows a message instead of an unhandled rejection.
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiRequestError(
        408,
        "request_timeout",
        "That took too long to respond. Please check your connection and try again."
      );
    }
    throw err;
  }

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
