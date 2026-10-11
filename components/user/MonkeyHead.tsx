"use client";
import { useEffect, useRef } from "react";

// Friendly smiling monkey avatar for the floating RoomKhoj AI entry point.
export function MonkeyHead() {
  const head = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const rect = head.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(-2, Math.min(2, (event.clientX - rect.left - rect.width / 2) / 200));
      const y = Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 200));
      head.current?.style.setProperty("--look-x", x + "px");
      head.current?.style.setProperty("--look-y", y + "px");
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <span ref={head} className="monkey block h-[54px] w-[54px]" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="presentation">
        <g stroke="#34201b" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="15" cy="49" rx="14" ry="22" fill="#f6c6a7"/>
          <ellipse cx="85" cy="49" rx="14" ry="22" fill="#f6c6a7"/>
          <path d="M21 38Q9 35 9 54M79 38Q91 35 91 54" fill="none" stroke="#ac725c" strokeWidth="3"/>
          <path d="M19 47Q17 17 42 12L40 5L50 11L61 4L61 13Q80 15 81 48L77 72Q68 90 50 92Q32 90 23 72Z" fill="#754632"/>
          <path d="M25 35Q27 14 40 18L50 20L65 15L60 24Q77 27 75 43L76 60Q70 74 50 77Q30 74 24 60Z" fill="#a56b4e" stroke="none"/>
          <path d="M25 47Q20 30 34 28Q43 23 50 33Q58 23 67 28Q81 34 75 50L71 63Q63 79 50 79Q37 79 29 63Z" fill="#ffcfaa"/>
          <g className="eyes">
            <ellipse cx="38" cy="46" rx="14.2" ry="17.5" fill="white"/>
            <ellipse cx="62" cy="46" rx="14.2" ry="17.5" fill="white"/>
            <g className="pupils" fill="#17151b" stroke="none">
              <ellipse cx="41" cy="48" rx="4.2" ry="6.3"/>
              <ellipse cx="59" cy="48" rx="4.2" ry="6.3"/>
            </g>
          </g>
          <path d="M33 59Q30 55 29 63Q19 65 27 75Q32 82 50 84Q68 82 73 75Q81 65 71 63Q70 55 67 59Q60 65 50 65Q40 65 33 59Z" fill="#ffd5b7"/>
          <path d="M42 59Q50 53 58 59Q55 64 50 64Q45 64 42 59Z" fill="#d78b78"/>
          <path d="M31 70Q50 80 69 70Q65 88 50 90Q35 88 31 70Z" fill="#211821"/>
          <path d="M35 72Q50 78 65 72L63 78Q50 81 37 78Z" fill="white" stroke="none"/>
          <path d="M47 86Q56 79 64 82Q56 88 50 88Z" fill="#f0768d" stroke="none"/>
          <path d="M25 63Q31 59 36 64M64 64Q69 59 75 63" fill="none" stroke="#8e5242" strokeWidth="2"/>
        </g>
      </svg>
      <style jsx>{`
        .monkey { animation: monkey-bob 4s ease-in-out infinite; }
        .eyes { transform-origin: 50px 46px; animation: monkey-blink 5.7s infinite; }
        .pupils { transform: translate(var(--look-x, 0px), var(--look-y, 0px)); }
        @keyframes monkey-blink { 0%,43%,47%,100% { transform:scaleY(1) } 45% { transform:scaleY(.08) } }
        @keyframes monkey-bob { 0%,100% { transform:rotate(-3deg) } 50% { transform:rotate(3deg) translateY(-2px) } }
        @media (prefers-reduced-motion: reduce) { .monkey,.eyes { animation:none } .pupils { transform:none } }
      `}</style>
    </span>
  );
}
