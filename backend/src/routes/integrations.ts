import { Router } from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

// POST /api/integrations/upload-file   (multipart/form-data, field name "file")
// Mirrors base44.integrations.Core.UploadFile({ file }) -> { file_url }
router.post("/upload-file", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided (field name must be 'file')" });

  const path = `${req.user!.id}/${Date.now()}-${req.file.originalname}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: publicUrl } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  res.json({ file_url: publicUrl.publicUrl });
});

// POST /api/integrations/invoke-llm   { prompt, system?, response_json_schema? }
// Mirrors base44.integrations.Core.InvokeLLM(...): returns plain text by default, or a JSON
// object matching response_json_schema when one is provided (frontend shim unwraps `response`
// so callers get exactly what the old SDK gave them).
router.post("/invoke-llm", requireAuth, async (req: AuthedRequest, res) => {
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });

  const { prompt, system, response_json_schema } = req.body || {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "prompt (string) is required" });

  try {
    if (response_json_schema) {
      // Use tool-calling to force well-formed structured output matching the caller's schema.
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: system || undefined,
        messages: [{ role: "user", content: prompt }],
        tools: [{ name: "respond", description: "Return the answer", input_schema: response_json_schema }],
        tool_choice: { type: "tool", name: "respond" },
      });
      const toolUse = message.content.find((b: any) => b.type === "tool_use") as any;
      return res.json({ response: toolUse?.input ?? {} });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.map((block: any) => (block.type === "text" ? block.text : "")).join("\n");
    res.json({ response: text });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "LLM request failed" });
  }
});

// POST /api/integrations/send-email   { to, subject, body }
// Mirrors base44.integrations.Core.SendEmail(...)
router.post("/send-email", requireAuth, async (req: AuthedRequest, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !subject) return res.status(400).json({ error: "to and subject are required" });

  if (!process.env.SMTP_HOST) {
    // eslint-disable-next-line no-console
    console.warn("[send-email] SMTP not configured; logging instead of sending", { to, subject });
    return res.json({ status: "skipped_no_smtp_configured" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html: body });
    res.json({ status: "sent" });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Email send failed" });
  }
});

// POST /api/integrations/transcribe-audio   { audio_url }
// Mirrors base44.integrations.Core.TranscribeAudio(...).
// No ASR provider is wired in by default — plug in your provider of choice
// (e.g. OpenAI Whisper API, Deepgram, AssemblyAI) here.
router.post("/transcribe-audio", requireAuth, async (req: AuthedRequest, res) => {
  const { audio_url } = req.body || {};
  if (!audio_url) return res.status(400).json({ error: "audio_url is required" });

  if (!process.env.TRANSCRIPTION_PROVIDER_API_KEY) {
    return res.status(503).json({
      error:
        "No transcription provider configured. Set TRANSCRIPTION_PROVIDER_API_KEY and implement the provider " +
        "call in backend/src/routes/integrations.ts (transcribe-audio handler).",
    });
  }

  // TODO: call your ASR provider with audio_url and return its transcript.
  res.status(501).json({ error: "Transcription provider call not implemented — see TODO in this handler." });
});

export default router;
