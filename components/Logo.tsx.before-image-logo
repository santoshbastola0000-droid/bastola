import Link from "next/link";
import { Home } from "lucide-react";

interface LogoProps {
  variant?: "light" | "dark";
  scrolled?: boolean;
}

export function Logo({ variant = "dark", scrolled }: LogoProps) {
  const isLight = variant === "light" && !scrolled;

  return (
    <Link href="/" className="flex items-center gap-2.5 group relative">
      {/* Animated logo icon */}
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
          <Home className="w-5 h-5 text-white" />
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-[var(--primary)]/20 blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100" />
      </div>

      {/* Logo text with animation */}
      <span
        className={`text-xl font-bold tracking-tight transition-all duration-300 ${
          isLight ? "text-white" : "text-slate-900"
        } group-hover:tracking-wide`}
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        Room
        <span className="text-[var(--primary)] relative">
          Servise
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] group-hover:w-full transition-all duration-300" />
        </span>
      </span>
    </Link>
  );
}
