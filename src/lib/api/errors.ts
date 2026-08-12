export interface ApiErrorDetail {
  path: string;
  message: string;
}

// The backend's error shape is inconsistent by design: Zod validation failures
// return `error: "validation_error"` (a stable code) with a `details` array,
// but every other thrown ApiError returns `error: <human-readable message>`
// with no separate `message` field (see mansello-backend's errorHandler.ts).
// So `error` is sometimes a code, sometimes the message itself — callers
// should branch on HTTP status, not on the `error` string, except for the
// one genuinely stable code (`validation_error`).
export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isConflict(err: unknown): err is ApiRequestError {
  return err instanceof ApiRequestError && err.status === 409;
}

export function isValidationError(err: unknown): err is ApiRequestError {
  return err instanceof ApiRequestError && err.status === 400 && err.code === "validation_error";
}
