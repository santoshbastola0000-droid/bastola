"use client";

import { Mic, MicOff, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  status: string;
  isRecording: boolean;
  onMuteToggle: () => void;
  onClose: () => void;
};

export function LiveRoomKhojVoiceOverlay({
  open,
  status,
  isRecording,
  onMuteToggle,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-950 dark:bg-[#111] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[31%] h-[34vh] w-[34vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_38%_34%,rgba(255,255,255,0.96),rgba(182,190,255,0.9)_38%,rgba(109,104,245,0.95)_68%,rgba(64,58,218,0.98)_100%)] blur-[0.2px] shadow-[0_0_90px_rgba(99,102,241,0.22)] dark:opacity-95" />
        <div className="absolute left-1/2 top-[38%] h-[17vh] w-[26vh] -translate-x-1/2 rounded-full bg-white/65 blur-3xl dark:bg-white/20" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 pt-[max(28px,env(safe-area-inset-top))] sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/88 text-slate-900 shadow-[0_12px_36px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur-xl dark:bg-white/10 dark:text-white dark:ring-white/10"
          aria-label="Close live RoomKhoj AI voice"
        >
          <X className="h-7 w-7" />
        </button>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-semibold tracking-tight">RoomKhoj AI</span>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/55">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500", isRecording && "animate-pulse")} />
            Live voice
          </span>
        </div>

        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/88 text-slate-900 shadow-[0_12px_36px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur-xl dark:bg-white/10 dark:text-white dark:ring-white/10"
          aria-label="Voice settings"
          title="Voice settings"
        >
          <SlidersHorizontal className="h-6 w-6" />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28 text-center">
        <div className="mb-7 min-h-6 text-sm font-medium text-slate-500 dark:text-white/55">
          {status || "सुन्दैछु..."}
        </div>
        <div className="h-[34vh] w-[34vh] max-h-[360px] max-w-[360px] min-h-[210px] min-w-[210px] rounded-full" aria-hidden="true" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[760px] px-5 pb-[max(22px,env(safe-area-inset-bottom))] sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-[72px] flex-1 items-center rounded-full bg-white/92 px-5 shadow-[0_16px_50px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur-2xl dark:bg-white/10 dark:ring-white/10">
            <span className="text-[17px] text-slate-400 dark:text-white/45">Ask RoomKhoj AI</span>
          </div>

          <button
            type="button"
            onClick={onMuteToggle}
            className={cn(
              "flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full shadow-[0_16px_50px_rgba(15,23,42,0.12)] ring-1 backdrop-blur-2xl transition",
              isRecording
                ? "bg-white text-slate-950 ring-black/5 dark:bg-white dark:text-black dark:ring-white/10"
                : "bg-white/92 text-slate-500 ring-black/5 dark:bg-white/10 dark:text-white/70 dark:ring-white/10",
            )}
            aria-label={isRecording ? "Mute microphone" : "Resume microphone"}
          >
            {isRecording ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#171717] text-white shadow-[0_16px_50px_rgba(15,23,42,0.22)] transition hover:bg-black"
            aria-label="End live RoomKhoj AI voice"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
