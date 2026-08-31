"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic2, Square, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiCallService } from "@/http/services/ai-call.service";

type Props = {
  activeVoiceId?: string | null;
  activeProvider?: string | null;
  onCreated?: () => void | Promise<void>;
};

export function AiVoiceCloneRecorder({
  activeVoiceId,
  activeProvider,
  onCreated,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("RoomKhoj Staff Voice");
  const [consent, setConsent] = useState(false);
  const [creating, setCreating] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  const clearSample = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setSeconds(0);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        toast.error("यो browser मा voice recording support छैन");
        return;
      }

      clearSample();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const sample = new Blob(chunksRef.current, { type: mimeType });
        setBlob(sample);
        setPreviewUrl(URL.createObjectURL(sample));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start(250);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(
        () => setSeconds((value) => value + 1),
        1000,
      );
    } catch (error: any) {
      toast.error(error?.message || "Microphone access दिन सकिएन");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const createClone = async () => {
    if (!blob) {
      toast.error("पहिले voice sample record गर्नुहोस्");
      return;
    }
    if (!consent) {
      toast.error("Voice owner को explicit consent confirm गर्नुहोस्");
      return;
    }
    if (seconds > 0 && seconds < 20) {
      toast.error("कम्तीमा 20 seconds को clear voice sample record गर्नुहोस्");
      return;
    }

    try {
      setCreating(true);
      await aiCallService.createVoiceClone({
        audio: blob,
        name: voiceName.trim() || "RoomKhoj Staff Voice",
        consentConfirmed: true,
      });
      toast.success("Voice clone created and selected");
      await onCreated?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Voice clone create गर्न सकिएन",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <p className="font-semibold">Record & Clone Staff Voice</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Voice owner को स्पष्ट अनुमति लिएर 30–60 seconds clean sample record गर्नुहोस्। Clone बनेपछि AI ले यही authorized voice प्रयोग गर्छ।
        </p>
      </div>

      <Input
        value={voiceName}
        onChange={(e) => setVoiceName(e.target.value)}
        placeholder="Voice name"
      />

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button type="button" onClick={startRecording}>
            <Mic2 className="mr-2 h-4 w-4" />
            Record Voice
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            <Square className="mr-2 h-4 w-4" />
            Stop ({seconds}s)
          </Button>
        )}

        {blob && !recording && (
          <Button type="button" variant="outline" onClick={clearSample}>
            <Trash2 className="mr-2 h-4 w-4" />
            Re-record
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="h-4 w-4" /> Recorded sample
          </p>
          <audio controls src={previewUrl} className="w-full" />
        </div>
      )}

      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          म पुष्टि गर्छु कि voice owner ले AI voice clone बनाउन स्पष्ट अनुमति दिएको छ।
        </span>
      </label>

      <Button
        type="button"
        onClick={createClone}
        disabled={!blob || !consent || creating}
        className="w-full"
      >
        {creating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mic2 className="mr-2 h-4 w-4" />
        )}
        Create & Use Voice Clone
      </Button>

      <p className="text-xs text-muted-foreground">
        Active: {activeProvider || "twilio"}
        {activeVoiceId ? ` · Voice ID: ${activeVoiceId}` : " · No clone selected"}
      </p>
    </div>
  );
}
