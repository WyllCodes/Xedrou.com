import { Router } from "express";
import { supabaseAdmin, supabaseAnon, supabaseForToken } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

/**
 * FULL AUTH PROXY — the frontend never talks to Supabase directly. It only ever
 * calls these Express endpoints (see frontend/src/api/base44Client.js). Express
 * is the sole backend the client depends on; Supabase here is just the auth/data
 * provider Express happens to be built on, exactly like it would be for any other
 * database. This is what makes the stack independent of Base44 end-to-end: no
 * Base44 SDK, no Base44-hosted endpoints, no direct Base44/Supabase calls from
 * the browser — everything routes through this Express API.
 */

function sessionPayload(session: any) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

// POST /api/auth/register   { email, password }
router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const { data, error } = await supabaseAnon.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // If email confirmation is off, Supabase returns an active session immediately.
  if (data.session) {
    await supabaseAdmin.from("user_profiles").upsert({ id: data.user!.id, role: "user" }, { onConflict: "id" });
  }
  res.status(201).json({ session: sessionPayload(data.session), requiresVerification: !data.session });
});

// POST /api/auth/login   { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  res.json({ session: sessionPayload(data.session) });
});

// POST /api/auth/refresh   { refresh_token }
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: "refresh_token is required" });

  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: error.message });

  res.json({ session: sessionPayload(data.session) });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  // Revokes the refresh token server-side via the admin API; the client discards
  // its local copy of the access token regardless (see base44Client.js).
  try {
    await supabaseAdmin.auth.admin.signOut(req.accessToken!, "global");
  } catch {
    // Best-effort — token may already be expired/invalid, which is fine for a logout.
  }
  res.status(204).send();
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  let { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", req.user!.id)
    .maybeSingle();

  // Auto-provision a default profile the first time we see this user — covers
  // sign-ups that skip the OTP step (e.g. email confirmation disabled in Supabase).
  if (!profile) {
    const { data: created } = await supabaseAdmin
      .from("user_profiles")
      .upsert({ id: req.user!.id, role: "user" }, { onConflict: "id" })
      .select()
      .single();
    profile = created;
  }

  res.json({
    id: req.user!.id,
    email: req.user!.email,
    role: profile?.role ?? "user",
    ...profile,
  });
});

// POST /api/auth/verify-otp   { email, otpCode }
router.post("/verify-otp", async (req, res) => {
  const { email, otpCode } = req.body || {};
  if (!email || !otpCode) return res.status(400).json({ error: "email and otpCode are required" });

  const { data, error } = await supabaseAnon.auth.verifyOtp({ email, token: otpCode, type: "signup" });
  if (error) return res.status(400).json({ error: error.message });

  if (data.user) {
    await supabaseAdmin.from("user_profiles").upsert({ id: data.user.id, role: "user" }, { onConflict: "id" });
  }
  res.json({ session: sessionPayload(data.session) });
});

// POST /api/auth/resend-otp   { email }
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  const { error } = await supabaseAnon.auth.resend({ type: "signup", email });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// POST /api/auth/reset-password-request   { email }
router.post("/reset-password-request", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  const redirectTo = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/reset-password`;
  const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// POST /api/auth/reset-password   { recoveryAccessToken, newPassword }
// recoveryAccessToken is the access_token Supabase puts in the URL fragment of the
// password-reset email link; the frontend's ResetPassword page reads it out of the
// URL and passes it here (see src/screens/ResetPassword.jsx).
router.post("/reset-password", async (req, res) => {
  const { recoveryAccessToken, newPassword } = req.body || {};
  if (!recoveryAccessToken || !newPassword) {
    return res.status(400).json({ error: "recoveryAccessToken and newPassword are required" });
  }

  const scoped = supabaseForToken(recoveryAccessToken);
  const { error } = await scoped.auth.updateUser({ password: newPassword });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// GET /api/auth/oauth-url?provider=google&redirect_path=/dashboard
// Returns the URL to send the browser to; Supabase handles the provider handshake
// and redirects back to FRONTEND_ORIGIN/auth/callback with tokens in the URL hash.
router.get("/oauth-url", (req, res) => {
  const provider = String(req.query.provider || "google");
  const redirectPath = String(req.query.redirect_path || "/dashboard");
  const callbackUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(
    redirectPath
  )}`;
  const authorizeUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(
    provider
  )}&redirect_to=${encodeURIComponent(callbackUrl)}`;
  res.json({ url: authorizeUrl });
});

// POST /api/auth/complete-registration  { role? }
// Called after OAuth login on first sign-in, to create the matching user_profiles row.
router.post("/complete-registration", requireAuth, async (req: AuthedRequest, res) => {
  const role = req.body?.role === "admin" ? "user" : req.body?.role || "user"; // never trust client to self-assign admin
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .upsert({ id: req.user!.id, role }, { onConflict: "id" })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
