"use client";

import { Bot, Sparkles } from "lucide-react";

export function AIAssistantAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-800 text-white shadow-lg shadow-rose-900/20 ${compact ? "h-10 w-10" : "h-14 w-14"}`}
    >
      <span className="absolute -left-3 -top-4 h-10 w-10 rounded-full bg-rose-500/20 blur-lg" />
      <span className="absolute -bottom-4 -right-3 h-10 w-10 rounded-full bg-red-500/25 blur-lg" />
      <Bot className={`relative z-10 ${compact ? "h-6 w-6" : "h-8 w-8"}`} strokeWidth={1.8} />
      <Sparkles className="absolute right-1 top-1 h-3 w-3 text-rose-300" strokeWidth={2} />
    </span>
  );
}
