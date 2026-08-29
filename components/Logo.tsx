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
      className="group inline-flex items-center"
    >
      <span
        className={`relative inline-flex items-baseline text-[22px] font-black tracking-[-0.045em] transition-transform duration-300 group-hover:scale-[1.02] sm:text-[26px] ${
          isLight ? "text-white" : "text-slate-950"
        }`}
      >
        <span>Room</span>
        <span className="text-red-600">Khoj</span>
        <span
          className={`absolute -bottom-1 left-0 h-[3px] w-8 rounded-full ${
            isLight ? "bg-white/90" : "bg-red-600"
          }`}
          aria-hidden
        />
      </span>
    </Link>
  );
}
