// Decodes (does NOT verify) a JWT payload — safe for reading claims for UI
// purposes only (e.g. which property a villa_manager is scoped to). The
// backend still independently verifies the signature on every request.
export function decodeJwtPayload<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
