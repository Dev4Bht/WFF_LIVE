import { timingSafeEqual } from "node:crypto";

export const ADMIN_TOKEN_HEADER = "x-admin-token";

/**
 * Full authentication is deferred (see CLAUDE.md), but the story editor
 * writes to the public database, so its API can't be open. This is a single
 * shared secret in `ADMIN_TOKEN`, not a user system.
 *
 * With no ADMIN_TOKEN set the editor stays usable on localhost with zero
 * setup, but is refused in production — failing closed there matters more
 * than convenience, since an unset variable is exactly the mistake that
 * would leave the deployed route world-writable.
 */
export function isAuthorizedAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";

  const provided = request.headers.get(ADMIN_TOKEN_HEADER);
  if (!provided) return false;

  // Compare in constant time so the endpoint doesn't leak the token's prefix
  // byte-by-byte. Lengths must match first — timingSafeEqual throws otherwise.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminUnauthorizedResponse(): Response {
  return Response.json(
    {
      error: process.env.ADMIN_TOKEN
        ? "Invalid admin token."
        : "ADMIN_TOKEN is not configured on the server, so editing is disabled in production.",
    },
    { status: 401 }
  );
}
