import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "light" | "dark";
  scrolled?: boolean;
}

export function Logo({
  variant = "dark",
  scrolled = false,
}: LogoProps) {
  const isLight = variant === "light" && !scrolled;

  return (
    <Link
      href="/rooms"
      aria-label="RoomKhoj"
      className="group inline-flex items-center gap-2"
    >
      <Image
        src="/roomkhoj-logo.png"
        alt="RoomKhoj logo"
        width={64}
        height={64}
        priority
        className="h-12 w-12 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-14 md:w-14"
      />

      <span
className={`text-base font-extrabold tracking-tight sm:text-xl ${
  isLight ? "text-white" : "text-slate-900"
}`}      >
        Room<span className="text-red-600">Khoj</span>
      </span>
    </Link>
  );
}
