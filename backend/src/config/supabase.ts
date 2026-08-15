import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. " +
      "Set them in backend/.env (see .env.example) before starting the server for real."
  );
}

/**
 * Service-role client: bypasses RLS. Only ever used server-side, and only after
 * we've verified the caller's identity via requireAuth / optionalAuth middleware.
 * Row-level authorization (own-record checks, admin checks) is enforced in the
 * route handlers below, in addition to RLS policies on the tables themselves
 * (defense in depth in case this key is ever reused elsewhere).
 */
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Anon-key client: used for the actual sign-in/sign-up/OTP/password-reset calls in
 * routes/auth.ts, so those operations run under the same privilege level a browser
 * client would normally use. Express is the only thing that ever holds this key or
 * talks to Supabase directly — the frontend never imports @supabase/supabase-js.
 */
export const supabaseAnon: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Per-request client scoped to a specific user's access token. Used where we need
 * an operation to run as that user (e.g. completing a password reset from a
 * recovery token) rather than as the service role.
 */
export function supabaseForToken(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
