"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import { MonkeyHead } from "./user/MonkeyHead";

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
  const pathname = usePathname();
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
    return () => window.removeEventListener("resize", handleResize);
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
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
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
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    localStorage.setItem(
      POSITION_KEY,
      JSON.stringify(drag.lastPosition),
    );

    const shouldOpen = openWhenNotMoved && !drag.moved;
    dragRef.current = null;
    if (shouldOpen) openChatbot();
  };

  const buttonStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {
        right: "16px",
        bottom: "120px",
      };

  if (pathname?.startsWith("/messages")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open or move RoomKhoj AI"
        title="Drag to move RoomKhoj AI"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event, true)}
        onPointerCancel={(event) => finishPointer(event, false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openChatbot();
          }
        }}
        style={buttonStyle}
        className="group fixed z-40 flex h-[62px] w-[62px] touch-none select-none cursor-grab items-center justify-center transition-transform active:cursor-grabbing active:scale-95"
      >
        <span className="relative z-10"><MonkeyHead /></span>
        <span className="absolute bottom-[3px] right-[3px] z-20 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      </button>
    </>
  );
}
