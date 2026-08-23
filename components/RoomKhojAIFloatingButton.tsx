"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Sparkles } from "lucide-react";

const BUTTON_SIZE = 62;
const EDGE_SPACE = 12;
const POSITION_KEY = "roomkhoj_ai_button_position";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  lastPosition: Position;
};

export function RoomKhojAIFloatingButton() {
  const [position, setPosition] = useState<Position | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const openChatbot = () => {
    window.dispatchEvent(
      new CustomEvent("open-roomkhoj-chatbot"),
    );
  };

  const clampPosition = (next: Position): Position => {
    const isMobile = window.innerWidth < 768;
    const bottomReserved = isMobile ? 82 : EDGE_SPACE;

    const maxX = Math.max(
      EDGE_SPACE,
      window.innerWidth - BUTTON_SIZE - EDGE_SPACE,
    );

    const maxY = Math.max(
      EDGE_SPACE,
      window.innerHeight - BUTTON_SIZE - bottomReserved,
    );

    return {
      x: Math.min(Math.max(next.x, EDGE_SPACE), maxX),
      y: Math.min(Math.max(next.y, EDGE_SPACE), maxY),
    };
  };

  const getDefaultPosition = (): Position => {
    const isMobile = window.innerWidth < 768;

    return clampPosition({
      x: window.innerWidth - BUTTON_SIZE - 16,
      // Mobile navbar भन्दा अलि माथि।
      y:
        window.innerHeight -
        BUTTON_SIZE -
        (isMobile ? 120 : 24),
    });
  };

  useEffect(() => {
    let initialPosition: Position | null = null;

    try {
      const saved = localStorage.getItem(POSITION_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Number.isFinite(parsed?.x) &&
          Number.isFinite(parsed?.y)
        ) {
          initialPosition = {
            x: Number(parsed.x),
            y: Number(parsed.y),
          };
        }
      }
    } catch {
      localStorage.removeItem(POSITION_KEY);
    }

    setPosition(
      clampPosition(
        initialPosition || getDefaultPosition(),
      ),
    );

    const handleResize = () => {
      setPosition((current) =>
        clampPosition(current || getDefaultPosition()),
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!position) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
      lastPosition: position,
    };
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (
      Math.abs(deltaX) > 4 ||
      Math.abs(deltaY) > 4
    ) {
      drag.moved = true;
    }

    const next = clampPosition({
      x: drag.originX + deltaX,
      y: drag.originY + deltaY,
    });

    drag.lastPosition = next;
    setPosition(next);
  };

  const finishPointer = (
    event: ReactPointerEvent<HTMLButtonElement>,
    openWhenNotMoved: boolean,
  ) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    localStorage.setItem(
      POSITION_KEY,
      JSON.stringify(drag.lastPosition),
    );

    const shouldOpen =
      openWhenNotMoved && !drag.moved;

    dragRef.current = null;

    if (shouldOpen) {
      openChatbot();
    }
  };

  return (
    <button
      type="button"
      aria-label="Open or move RoomKhoj AI"
      title="Drag to move RoomKhoj AI"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) =>
        finishPointer(event, true)
      }
      onPointerCancel={(event) =>
        finishPointer(event, false)
      }
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openChatbot();
        }
      }}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : {
              right: "16px",
              bottom: "120px",
            }
      }
      className="
        group
        fixed
        z-[9998]
        flex
        h-[62px]
        w-[62px]
        touch-none
        select-none
        cursor-grab
        items-center
        justify-center
        rounded-full
        transition-transform
        active:cursor-grabbing
        active:scale-95
      "
    >
      <span
        className="
          absolute inset-[-6px] rounded-full
          bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500
          opacity-60 blur-xl animate-pulse
        "
      />

      <span
        className="
          absolute inset-0 rounded-full
          bg-[conic-gradient(from_0deg,#22d3ee,#8b5cf6,#ec4899,#3b82f6,#22d3ee)]
          animate-[spin_4s_linear_infinite]
        "
      />

      <span
        className="
          absolute inset-[3px] rounded-full
          bg-black/90 backdrop-blur-xl
          shadow-[inset_0_0_18px_rgba(255,255,255,0.15)]
        "
      />

      <span
        className="
          absolute inset-[9px] rounded-full
          bg-gradient-to-br
          from-cyan-400/30 via-violet-500/30 to-fuchsia-500/30
          blur-sm
        "
      />

      <Sparkles
        className="
          relative z-10 h-7 w-7 text-white
          drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]
          transition-transform duration-300
          group-hover:scale-110
        "
        strokeWidth={2}
      />

      <span
        className="
          absolute bottom-[3px] right-[3px] z-20
          h-3 w-3 rounded-full border-2 border-white bg-green-500
        "
      />
    </button>
  );
}
