"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { HangingMonkey } from "./user/HangingMonkey";

const WIDTH = 78;
const HEIGHT = 126;
const EDGE = 8;
const KEY = "roomkhoj_ai_button_position";
type Position = { x: number; y: number };
type DragState = { pointerId: number; startX: number; startY: number; origin: Position; moved: boolean; last: Position };
type Animation = "idle" | "fall" | "climb";

export function RoomKhojAIFloatingButton() {
  const pathname = usePathname();
  const [position, setPosition] = useState<Position | null>(null);
  const [animation, setAnimation] = useState<Animation>("idle");
  const dragRef = useRef<DragState | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const openChatbot = () => window.dispatchEvent(new CustomEvent("open-roomkhoj-chatbot"));
  const corner = (): Position => ({
    x: Math.max(EDGE, window.innerWidth - WIDTH - EDGE),
    y: EDGE,
  });
  const clamp = (next: Position): Position => ({
    x: Math.max(EDGE, Math.min(window.innerWidth - WIDTH - EDGE, next.x)),
    y: Math.max(EDGE, Math.min(window.innerHeight - HEIGHT - (window.innerWidth < 768 ? 82 : EDGE), next.y)),
  });
  useEffect(() => {
    // Always return to the screen corner, including after reload.
    try { localStorage.removeItem(KEY); } catch {}
    setPosition(corner());
    const resize = () => setPosition(corner());
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);
  const rescue = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPosition(corner());
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimation("idle");
      return;
    }
    setAnimation("fall");
    timers.current.push(setTimeout(() => setAnimation("climb"), 680));
    timers.current.push(setTimeout(() => setAnimation("idle"), 1980));
  };
  const onDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!position || animation !== "idle") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: position, moved: false, last: position };
  };
  const onMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    drag.last = clamp({ x: drag.origin.x + dx, y: drag.origin.y + dy });
    setPosition(drag.last);
  };
  const onFinish = (event: ReactPointerEvent<HTMLButtonElement>, open: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (!drag.moved) { if (open) openChatbot(); return; }
    // Dragging into the middle startles the monkey; always climb back to safety.
    rescue();
  };
  if (pathname?.startsWith("/messages")) return null;
  return <button
    type="button"
    aria-label="Open RoomKhoj AI; drag monkey to see it fall and climb back"
    title="Tap for RoomKhoj AI, drag for monkey animation"
    onPointerDown={onDown}
    onPointerMove={onMove}
    onPointerUp={event => onFinish(event, true)}
    onPointerCancel={event => onFinish(event, false)}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openChatbot(); } }}
    style={position ? { left: position.x, top: position.y } : { right: EDGE, top: EDGE }}
    className="fixed z-40 flex h-[126px] w-[78px] cursor-grab touch-none select-none items-center justify-center border-0 bg-transparent p-0 shadow-none active:cursor-grabbing"
  ><HangingMonkey scared={animation === "fall" || animation === "climb"} motion={animation}/></button>;
}
