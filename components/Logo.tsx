import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";

interface LogoProps { variant?: "light" | "dark"; scrolled?: boolean; }
export function Logo(_props: LogoProps) {
  return <Link href="/rooms" aria-label="RoomKhoj" className="group inline-flex items-center"><BrandWordmark className="text-[30px]"/></Link>;
}
