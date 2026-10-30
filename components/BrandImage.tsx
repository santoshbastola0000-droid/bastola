import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandImageProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

/** Frames the supplied square artwork without stretching the wordmark. */
export function BrandImage({ className, compact = false, priority = false }: BrandImageProps) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-lg bg-white align-middle", compact ? "h-9 w-9" : "h-12 w-40 sm:w-44", className)}>
      <Image
        src="/roomkhoj-logo-20261030.png"
        alt="RoomKhoj"
        fill
        sizes={compact ? "36px" : "(max-width: 639px) 160px, 176px"}
        priority={priority}
        className={compact ? "object-contain" : "object-cover object-[center_48%]"}
      />
    </span>
  );
}
