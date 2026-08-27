"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-current/20 bg-white/10 p-1 text-xs font-semibold backdrop-blur"
    >
      <Languages className="ml-1.5 h-3.5 w-3.5" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`ml-1 rounded-full px-2 py-1 ${language === "en" ? "bg-white text-slate-900" : ""}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ne")}
        className={`rounded-full px-2 py-1 ${language === "ne" ? "bg-white text-slate-900" : ""}`}
      >
        ने
      </button>
    </div>
  );
}
