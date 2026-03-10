import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthButtonsProps {
  variant?: "desktop" | "mobile";
  scrolled?: boolean;
}

export function AuthButtons({
  variant = "desktop",
  scrolled,
}: AuthButtonsProps) {
  if (variant === "mobile") {
    return (
      <div className="space-y-3">
        <Link href="/auth/login" className="block">
          <Button
            variant="outline"
            className="w-full rounded-xl border-2 py-6 text-base font-medium gap-2 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)] transition-all"
          >
            <LogIn className="w-5 h-5" />
            Log in
          </Button>
        </Link>
        <Link href="/auth/register" className="block">
          <Button className="w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-6 text-base font-medium gap-2 hover:shadow-lg hover:scale-[1.02] transition-all">
            <UserPlus className="w-5 h-5" />
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/auth/login">
        <Button
          variant="ghost"
          className={`rounded-full px-5 relative group cursor-pointer ${
            scrolled
              ? "text-slate-600 hover:text-slate-900"
              : "text-white/80 hover:text-white"
          }`}
        >
          <span className="relative z-10">Log in</span>
          <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-all" />
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button className="rounded-full px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden group cursor-pointer">
          <span className="relative z-10">Sign up</span>
          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Button>
      </Link>
    </div>
  );
}
