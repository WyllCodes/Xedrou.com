import React, { useState, useRef } from "react";
import { Mic, MicOff, Upload, Loader2, Sparkles, Copy, CheckCheck, StopCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function VoiceSampleTool({ onConsume }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analyzeMode, setAnalyzeMode] = useState("lyrics");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("record"); // record | transcribe | analyze
  const [copied, setCopied] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const transcribe = async () => {
    if (!audioBlob) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });
    const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    setTranscript(text);
    setLoading(false);
    setStep("analyze");
    onConsume?.();
  };

  const analyze = async () => {
    setLoading(true);
    const prompts = {
      lyrics: `Here are transcribed song lyrics or a voice note from an artist:\n\n"${transcript}"\n\nAnalyze the lyrics: identify themes, rhyme scheme, strengths, areas to improve, and suggest a revised/polished version.`,
      feedback: `Here is a vocal/song transcript from an artist:\n\n"${transcript}"\n\nGive detailed creative feedback: vocal performance notes, lyrical content, emotional delivery, suggestions for improvement.`,
      structure: `Analyze this song transcript and suggest a professional song structure (verse/chorus/bridge layout):\n\n"${transcript}"`,
    };
    const res = await base44.integrations.Core.InvokeLLM({ prompt: prompts[analyzeMode] });
    setAnalysis(res);
    setLoading(false);
    onConsume?.();
  };

  const copy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const reset = () => { setAudioBlob(null); setAudioUrl(null); setTranscript(""); setAnalysis(""); setStep("record"); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Record / Upload */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🎙️</span>
          <h3 className="font-semibold">Voice Sample</h3>
        </div>
        <p className="text-sm text-muted-foreground">Record your voice or upload an audio clip — Xedruo AI will transcribe and analyze it.</p>

        {/* Record */}
        <div className="flex gap-3">
          {!recording ? (
            <Button variant="outline" className="flex-1" onClick={startRecording} disabled={!!audioBlob}>
              <Mic className="w-4 h-4 mr-2 text-red-400" /> Start Recording
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1" onClick={stopRecording}>
              <StopCircle className="w-4 h-4 mr-2" /> Stop Recording
            </Button>
          )}
          <Button variant="outline" onClick={() => fileRef.current.click()} disabled={recording}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
        </div>

        {audioUrl && (
          <div className="space-y-3">
            <audio src={audioUrl} controls className="w-full rounded-lg" />
            {step === "record" && (
              <Button className="w-full" onClick={transcribe} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing…</> : <><Sparkles className="w-4 h-4 mr-2" />Transcribe Audio</>}
              </Button>
            )}
          </div>
        )}

        {step === "analyze" && transcript && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Analysis Mode</Label>
              <Select value={analyzeMode} onValueChange={setAnalyzeMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lyrics">Lyric Analysis & Polish</SelectItem>
                  <SelectItem value="feedback">Creative Feedback</SelectItem>
                  <SelectItem value="structure">Song Structure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={analyze} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing…</> : <><Sparkles className="w-4 h-4 mr-2" />Analyze with AI</>}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={reset}>Start Over</Button>
          </div>
        )}
      </div>

      {/* Right: Output */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
        {transcript && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-sm font-semibold text-muted-foreground">Transcript</h4>
              <Button variant="ghost" size="sm" onClick={() => copy(transcript)}>{copied ? <CheckCheck className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}Copy</Button>
            </div>
            <Textarea value={transcript} readOnly className="min-h-28 text-sm bg-muted/50 resize-none" />
          </div>
        )}
        {analysis && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-sm font-semibold text-muted-foreground">AI Analysis</h4>
              <Button variant="ghost" size="sm" onClick={() => copy(analysis)}>{copied ? <CheckCheck className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}Copy</Button>
            </div>
            <Textarea value={analysis} readOnly className="flex-1 min-h-48 text-sm bg-muted/50 resize-none" />
          </div>
        )}
        {!transcript && !analysis && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
            Record or upload audio, then transcribe to see results here.
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}
      </div>
    </div>
  );
}