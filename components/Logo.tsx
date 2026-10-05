import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "light" | "dark";
  scrolled?: boolean;
}

export function Logo({ variant: _variant = "dark", scrolled: _scrolled = false }: LogoProps) {
  return (
    <Link
      href="/rooms"
      aria-label="RoomKhoj"
      className="group inline-flex items-center"
    >
      <Image
        src="/roomkhoj-logo.png"
        alt="RoomKhoj"
        width={40}
        height={40}
        priority
        className="h-9 w-9 rounded-lg object-contain transition-transform duration-300 group-hover:scale-[1.04] sm:h-10 sm:w-10"
      />
      <span className="sr-only">RoomKhoj</span>
    </Link>
  );
}
