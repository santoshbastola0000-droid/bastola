"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDown, ArrowLeft as LeftIcon, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from "lucide-react";

const SIZE = 18;
const START = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
const MOVES: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const OPPOSITES: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};
function newFood(snake: Point[]): Point | null {
  const occupied = new Set(snake.map((p) => p.y * SIZE + p.x));
  const empty: Point[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++)
    if (!occupied.has(y * SIZE + x)) empty.push({ x, y });
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}
export default function NokiaSnakePage() {
  const [snake, setSnake] = useState<Point[]>(START);
  const [food, setFood] = useState<Point>({ x: 13, y: 9 });
  const [direction, setDirection] = useState<Direction>("right");
  const [status, setStatus] = useState<"ready" | "playing" | "paused" | "over" | "won">("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const directionRef = useRef<Direction>("right");
  const pendingRef = useRef<Direction | null>(null);
  const snakeRef = useRef<Point[]>(START);
  const foodRef = useRef<Point>({ x: 13, y: 9 });
  const scoreRef = useRef(0);
  useEffect(() => {
    try { setBest(Number(window.localStorage.getItem("rk_nokia_snake_best") || "0") || 0); } catch { /* storage blocked */ }
  }, []);
  const reset = useCallback(() => {
    snakeRef.current = START; foodRef.current = { x: 13, y: 9 };
    directionRef.current = "right"; pendingRef.current = null; scoreRef.current = 0;
    setSnake(START); setFood(foodRef.current); setDirection("right"); setScore(0); setStatus("playing");
  }, []);
  const turn = useCallback((next: Direction) => {
    if (next === OPPOSITES[directionRef.current] || pendingRef.current) return;
    pendingRef.current = next;
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const next = keys[event.key];
      if (next) { event.preventDefault(); turn(next); }
      if (event.key === " " ) {
        event.preventDefault();
        setStatus((old) => old === "playing" ? "paused" : old === "paused" ? "playing" : old);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);
  useEffect(() => {
    if (status !== "playing") return;
    const speed = Math.max(80, 185 - Math.floor(score / 5) * 12);
    const timer = window.setInterval(() => {
      const nextDir = pendingRef.current ?? directionRef.current;
      pendingRef.current = null;
      directionRef.current = nextDir; setDirection(nextDir);
      const move = MOVES[nextDir], old = snakeRef.current;
      const head = { x: old[0].x + move.x, y: old[0].y + move.y };
      const eating = head.x === foodRef.current.x && head.y === foodRef.current.y;
      const body = eating ? old : old.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE ||
        body.some((p) => p.x === head.x && p.y === head.y)) {
        setStatus("over"); return;
      }
      const updated = [head, ...old.slice(0, eating ? undefined : -1)];
      snakeRef.current = updated; setSnake(updated);
      if (eating) {
        scoreRef.current += 10; setScore(scoreRef.current);
        setBest((previous) => {
          const maximum = Math.max(previous, scoreRef.current);
          try { window.localStorage.setItem("rk_nokia_snake_best", String(maximum)); } catch { /* storage blocked */ }
          return maximum;
        });
        const nextFood = newFood(updated);
        if (!nextFood) { setStatus("won"); return; }
        foodRef.current = nextFood; setFood(nextFood);
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [status, score]);
  const cells = new Set(snake.map((p) => p.y * SIZE + p.x));
  const headIndex = snake[0].y * SIZE + snake[0].x;
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-10 md:p-6">
      <Link href="/user/dashboard/referrals" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ArrowLeft className="h-4 w-4" /> Back to Refer & Earn</Link>
      <div className="rounded-[2.5rem] border-[8px] border-zinc-700 bg-zinc-800 p-4 shadow-2xl sm:p-7">
        <div className="mb-3 text-center text-sm font-black tracking-[0.35em] text-zinc-200">NOKIA CLASSIC</div>
        <div className="rounded-xl border-[7px] border-zinc-950 bg-[#a2b68a] p-3 shadow-inner">
          <div className="mb-2 flex items-center justify-between font-mono text-sm font-bold text-[#253723]">
            <span>SCORE {String(score).padStart(4, "0")}</span><span>BEST {String(best).padStart(4, "0")}</span>
          </div>
          <div className="relative grid aspect-square w-full border-4 border-[#33472e] bg-[#a2b68a]" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }} role="img" aria-label={`Snake game board, score ${score}, status ${status}`}>
            {Array.from({ length: SIZE * SIZE }, (_, index) => {
              const isHead = index === headIndex;
              const isSnake = cells.has(index);
              const isFood = index === food.y * SIZE + food.x;
              return <span key={index} className={isHead ? "bg-[#20311e] border border-[#a2b68a]" : isSnake ? "bg-[#30472a] border border-[#a2b68a]" : isFood ? "bg-[#243923] rounded-sm" : "border border-[#94a880]/30"} />;
            })}
            {status !== "playing" && <div className="absolute inset-0 flex items-center justify-center bg-[#a2b68a]/85 p-4 text-center font-mono font-black text-[#21351e]">
              {status === "ready" ? "SNAKE II — PRESS START" : status === "paused" ? "PAUSED" : status === "won" ? "YOU WIN!" : "GAME OVER"}
            </div>}
          </div>
          <div className="mt-2 text-center font-mono text-[10px] font-bold text-[#253723]">◀ ▲ ▼ ▶ MOVE · EAT THE DOTS · DON'T HIT THE WALL</div>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-full bg-zinc-600 px-6 py-2 text-sm font-bold text-white shadow-md active:translate-y-0.5">{status === "ready" ? "START" : "RESTART"} <RotateCcw className="ml-1 inline h-4 w-4" /></button>
          <button type="button" disabled={status !== "playing" && status !== "paused"} onClick={() => setStatus((old) => old === "playing" ? "paused" : "playing")} className="rounded-full bg-zinc-600 px-6 py-2 text-sm font-bold text-white disabled:opacity-40">{status === "paused" ? <Play className="inline h-4 w-4" /> : <Pause className="inline h-4 w-4" />} {status === "paused" ? "RESUME" : "PAUSE"}</button>
        </div>
        <div className="mx-auto mt-6 grid w-52 grid-cols-3 gap-2" aria-label="Directional controls">
          <div /><button type="button" aria-label="Up" onClick={() => turn("up")} className="flex h-14 items-center justify-center rounded-xl bg-zinc-600 text-white shadow-md active:bg-zinc-500"><ArrowUp /></button><div />
          <button type="button" aria-label="Left" onClick={() => turn("left")} className="flex h-14 items-center justify-center rounded-xl bg-zinc-600 text-white shadow-md active:bg-zinc-500"><LeftIcon /></button>
          <div className="flex items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-zinc-400">OK</div>
          <button type="button" aria-label="Right" onClick={() => turn("right")} className="flex h-14 items-center justify-center rounded-xl bg-zinc-600 text-white shadow-md active:bg-zinc-500"><ArrowRight /></button>
          <div /><button type="button" aria-label="Down" onClick={() => turn("down")} className="flex h-14 items-center justify-center rounded-xl bg-zinc-600 text-white shadow-md active:bg-zinc-500"><ArrowDown /></button><div />
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">Play on mobile with the buttons or on computer with arrow/WASD keys. High score is saved on this device. Game scores do not create referral earnings or wallet rewards.</p>
    </div>
  );
}
