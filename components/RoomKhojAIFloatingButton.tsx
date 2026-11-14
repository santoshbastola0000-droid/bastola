"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { AIAssistantAvatar } from "./user/AIAssistantAvatar";

const SIZE = 72;
const EDGE = 12;
const KEY = "roomkhoj_ai_button_position";
type Position = { x: number; y: number };
type DragState = { pointerId: number; startX: number; startY: number; origin: Position; moved: boolean; last: Position };

export function RoomKhojAIFloatingButton() {
  const pathname = usePathname();
  const [position, setPosition] = useState<Position | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const openChatbot = () => window.dispatchEvent(new CustomEvent("open-roomkhoj-chatbot"));
  const bounds = () => ({
    maxX: Math.max(EDGE, window.innerWidth - SIZE - EDGE),
    maxY: Math.max(EDGE, window.innerHeight - SIZE - (window.innerWidth < 768 ? 90 : EDGE)),
  });
  const clamp = (next: Position): Position => {
    const { maxX, maxY } = bounds();
    return { x: Math.max(EDGE, Math.min(maxX, next.x)), y: Math.max(EDGE, Math.min(maxY, next.y)) };
  };
  const snapToCorner = (next: Position): Position => {
    const { maxX, maxY } = bounds();
    return { x: next.x + SIZE / 2 < window.innerWidth / 2 ? EDGE : maxX,
      y: next.y + SIZE / 2 < window.innerHeight / 2 ? EDGE : maxY };
  };
  const saveCorner = (next: Position) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };
  useEffect(() => {
    const defaultCorner = () => {
      const { maxX } = bounds();
      return { x: maxX, y: EDGE };
    };
    let initial = defaultCorner();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) initial = snapToCorner(saved);
    } catch {}
    setPosition(initial);
    const resize = () => setPosition(current => current ? snapToCorner(current) : defaultCorner());
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const onDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: position ?? { x: EDGE, y: EDGE }, moved: false, last: position ?? { x: EDGE, y: EDGE } };
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
    const destination = snapToCorner(drag.last);
    setPosition(destination);
    saveCorner(destination);
  };
  if (pathname?.startsWith("/messages") || pathname?.startsWith("/admin")) return null;
  return (
    <button
      type="button"
      aria-label="Open RoomKhoj AI assistant; drag to a screen corner"
      title="Chat with RoomKhoj AI"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={event => onFinish(event, true)}
      onPointerCancel={event => onFinish(event, false)}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openChatbot(); } }}
      style={position ? { left: position.x, top: position.y } : { right: EDGE, top: EDGE }}
      className="fixed z-40 flex h-[72px] w-[72px] touch-none select-none flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-200/70 bg-white/90 p-1 shadow-xl shadow-slate-900/20 backdrop-blur-sm transition-shadow hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:cursor-grabbing"
    >
      <span className="relative">
        <AIAssistantAvatar compact />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      </span>
      <span className="text-[10px] font-bold leading-tight tracking-wide text-slate-800">RoomKhoj AI</span>
    </button>
  );
}
