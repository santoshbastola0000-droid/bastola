"use client";

import { Sparkles } from "lucide-react";

export function RoomKhojAIFloatingButton() {
  const openChatbot = () => {
    window.dispatchEvent(
      new CustomEvent("open-roomkhoj-chatbot"),
    );
  };

  return (
    <button
      type="button"
      onClick={openChatbot}
      aria-label="Open RoomKhoj AI"
      className="
        group
        fixed
        bottom-[88px]
        right-4
        z-[9998]
        flex
        h-[62px]
        w-[62px]
        items-center
        justify-center
        rounded-full
        active:scale-95
        transition-transform
        md:bottom-6
        md:right-6
      "
    >
      {/* outer glow */}
      <span
        className="
          absolute
          inset-[-6px]
          rounded-full
          bg-gradient-to-r
          from-cyan-400
          via-violet-500
          to-fuchsia-500
          opacity-60
          blur-xl
          animate-pulse
        "
      />

      {/* rotating gradient ring */}
      <span
        className="
          absolute
          inset-0
          rounded-full
          bg-[conic-gradient(from_0deg,#22d3ee,#8b5cf6,#ec4899,#3b82f6,#22d3ee)]
          animate-[spin_4s_linear_infinite]
        "
      />

      {/* inner dark orb */}
      <span
        className="
          absolute
          inset-[3px]
          rounded-full
          bg-black/90
          backdrop-blur-xl
          shadow-[inset_0_0_18px_rgba(255,255,255,0.15)]
        "
      />

      {/* inner soft color glow */}
      <span
        className="
          absolute
          inset-[9px]
          rounded-full
          bg-gradient-to-br
          from-cyan-400/30
          via-violet-500/30
          to-fuchsia-500/30
          blur-sm
        "
      />

      <Sparkles
        className="
          relative
          z-10
          h-7
          w-7
          text-white
          drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]
          transition-transform
          duration-300
          group-hover:scale-110
        "
        strokeWidth={2}
      />

      {/* online dot */}
      <span
        className="
          absolute
          bottom-[3px]
          right-[3px]
          z-20
          h-3
          w-3
          rounded-full
          border-2
          border-white
          bg-green-500
        "
      />
    </button>
  );
}
