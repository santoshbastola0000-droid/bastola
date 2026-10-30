import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";

interface LogoProps {
  variant?: "light" | "dark";
  scrolled?: boolean;
}

export function Logo(_props: LogoProps) {
  return (
    <Link href="/rooms" aria-label="RoomKhoj" className="group inline-flex items-center">
      <BrandImage priority className="transition-transform duration-300 group-hover:scale-[1.04]" />
    </Link>
  );
}
