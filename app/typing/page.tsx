"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Gauge,
  Gamepad2,
  Heart,
  Keyboard,
  Languages,
  Lock,
  Medal,
  RotateCcw,
  Play,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

type Language = "english" | "nepali";
type Lesson = { title: string; subtitle: string; level: string; text: string; targetWpm: number };

const ENGLISH_PRACTICE = [
  "fff jjj fjf jfj asdf jkl; ask dad fall flask salad",
  "quiet power write type your proper route every time",
  "The room is clean and bright. Practice typing every day.",
  "Keep your fingers relaxed and return them to the home row after every key.",
  "RoomKhoj helps people find suitable rooms and useful jobs across Nepal quickly.",
  "Fast typing grows from accuracy, steady rhythm, correct posture, and daily focused practice.",
  "A skilled typist reads ahead, keeps both hands balanced, and corrects mistakes without losing rhythm.",
  "Speed is useful only when the words remain accurate, clear, and easy for another person to understand.",
];

const NEPALI_PRACTICE = [
  "क ख ग घ ङ च छ ज झ ञ क ख ग घ",
  "घर कोठा पानी बाटो काम नाम साथी राम्रो नेपाल",
  "म नेपाली टाइप गर्न सिक्दै छु र हरेक दिन अभ्यास गर्छु।",
  "सही औँलाले अक्षर थिचेर बिस्तारै आफ्नो गति बढाउनुहोस्।",
  "रुमखोजले नेपालभर कोठा र रोजगारी खोज्न सजिलो बनाउँछ।",
  "छिटो टाइप गर्न शुद्धता, सही आसन र नियमित अभ्यास सबैभन्दा आवश्यक हुन्छ।",
  "दुवै हातलाई सन्तुलित राखेर स्क्रिनमा हेर्दै निरन्तर एउटै लयमा टाइप गर्नुहोस्।",
  "गति बढाउँदा हिज्जे र अक्षर नबिगार्नुहोस् किनकि सही टाइपिङ नै राम्रो सीपको आधार हो।",
];

function buildLessons(language: Language): Lesson[] {
  const samples = language === "english" ? ENGLISH_PRACTICE : NEPALI_PRACTICE;
  return Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    const stage = Math.min(samples.length - 1, Math.floor(index / 13));
    const repetitions = number < 21 ? 1 : number < 51 ? 2 : number < 81 ? 3 : 4;
    const text = Array.from({ length: repetitions }, (__, repeat) => samples[(stage + repeat) % samples.length]).join(" ");
    const targetWpm = language === "english" ? Math.min(80, 12 + Math.floor(index * 0.7)) : Math.min(55, 8 + Math.floor(index * 0.48));
    const level = number <= 25 ? (language === "english" ? "Beginner" : "सुरुवात") : number <= 60 ? (language === "english" ? "Intermediate" : "मध्यम") : number <= 85 ? (language === "english" ? "Advanced" : "उन्नत") : (language === "english" ? "Speed master" : "गति विशेषज्ञ");
    return {
      title: language === "english" ? `Level ${number}` : `स्तर ${number}`,
      subtitle: number <= 20 ? (language === "english" ? "Keys and accuracy" : "अक्षर र शुद्धता") : number <= 60 ? (language === "english" ? "Words and rhythm" : "शब्द र लय") : (language === "english" ? `${targetWpm} WPM speed challenge` : `${targetWpm} WPM गति चुनौती`),
      level,
      text,
      targetWpm,
    };
  });
}

const LESSONS: Record<Language, Lesson[]> = { english: buildLessons("english"), nepali: buildLessons("nepali") };

const KEY_ROWS = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const FINGER_MAP: Record<string, string> = {
  q: "Left little", a: "Left little", z: "Left little", w: "Left ring", s: "Left ring", x: "Left ring",
  e: "Left middle", d: "Left middle", c: "Left middle", r: "Left index", f: "Left index", v: "Left index",
  t: "Left index", g: "Left index", b: "Left index", y: "Right index", h: "Right index", n: "Right index",
  u: "Right index", j: "Right index", m: "Right index", i: "Right middle", k: "Right middle", o: "Right ring",
  l: "Right ring", p: "Right little", ";": "Right little", "'": "Right little",
};

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function TypingPracticePage() {
  const [mode, setMode] = useState<"lessons" | "game">("lessons");
  const [language, setLanguage] = useState<Language>("english");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Record<Language, number[]>>({ english: [], nepali: [] });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lesson = LESSONS[language][lessonIndex];
  const complete = typed === lesson.text;
  const nextCharacter = lesson.text[typed.length] ?? "";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("roomkhoj_typing_progress");
      if (saved) setCompletedLessons(JSON.parse(saved));
    } catch { /* Progress can still work without local storage. */ }
  }, []);

  useEffect(() => {
    if (!startedAt || complete) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [startedAt, complete]);

  const stats = useMemo(() => {
    let correct = 0;
    for (let index = 0; index < typed.length; index += 1) if (typed[index] === lesson.text[index]) correct += 1;
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    const minutes = Math.max(elapsed / 60, 1 / 60);
    return {
      correct,
      errors: Math.max(0, typed.length - correct),
      accuracy,
      wpm: startedAt ? Math.max(0, Math.round(correct / 5 / minutes)) : 0,
      progress: Math.round((Math.min(typed.length, lesson.text.length) / lesson.text.length) * 100),
    };
  }, [elapsed, lesson.text, startedAt, typed]);

  useEffect(() => {
    if (!complete) return;
    setCompletedLessons((current) => {
      if (current[language].includes(lessonIndex)) return current;
      const next = { ...current, [language]: [...current[language], lessonIndex] };
      try { localStorage.setItem("roomkhoj_typing_progress", JSON.stringify(next)); } catch { /* Ignore. */ }
      return next;
    });
  }, [complete, language, lessonIndex]);

  const reset = useCallback(() => {
    setTyped(""); setStartedAt(null); setElapsed(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const chooseLesson = (index: number) => { setLessonIndex(index); reset(); };
  const changeLanguage = (next: Language) => { setLanguage(next); setLessonIndex(0); setTyped(""); setStartedAt(null); setElapsed(0); };
  const nextLesson = () => chooseLesson((lessonIndex + 1) % LESSONS[language].length);

  const playKeySound = () => {
    if (!soundOn) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 360;
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.035);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.035);
    } catch { /* Audio is optional. */ }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to RoomKhoj" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="flex items-center gap-2 font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-red-600 text-white"><Keyboard className="h-5 w-5" /></span><span>RoomKhoj <span className="text-red-600">Typing</span></span></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button onClick={() => setMode("lessons")} className={`rounded-lg px-3 py-2 text-xs font-black transition sm:text-sm ${mode === "lessons" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}><span className="hidden sm:inline">Lessons</span><Keyboard className="h-4 w-4 sm:hidden" /></button>
              <button onClick={() => setMode("game")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition sm:text-sm ${mode === "game" ? "bg-red-600 text-white shadow-sm" : "text-slate-500"}`}><Gamepad2 className="h-4 w-4" /><span className="hidden sm:inline">Typing Game</span></button>
            </div>
            <button onClick={() => setSoundOn((value) => !value)} aria-label="Toggle keyboard sound" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
            <div className="hidden items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 sm:flex"><Trophy className="h-4 w-4" /> {completedLessons[language].length}/{LESSONS[language].length} lessons</div>
          </div>
        </div>
      </header>

      {mode === "game" ? <TypingGame language={language} onLanguageChange={changeLanguage} /> : <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-110px)] lg:overflow-auto">
          <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
            <LanguageButton active={language === "english"} onClick={() => changeLanguage("english")}>English</LanguageButton>
            <LanguageButton active={language === "nepali"} onClick={() => changeLanguage("nepali")}>नेपाली</LanguageButton>
          </div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">Course lessons</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
            {LESSONS[language].map((item, index) => {
              const done = completedLessons[language].includes(index);
              const active = index === lessonIndex;
              return <button key={item.title} onClick={() => chooseLesson(index)} className={`min-w-[220px] rounded-2xl border p-3 text-left transition lg:w-full ${active ? "border-red-200 bg-red-50 shadow-sm" : "border-transparent hover:bg-slate-50"}`}>
                <span className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${done ? "bg-emerald-500 text-white" : active ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`}>{done ? <Check className="h-4 w-4" /> : index + 1}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{item.title}</span><span className="block truncate text-xs text-slate-500">{item.subtitle}</span></span>
                  {active ? <ChevronRight className="ml-auto h-4 w-4 text-red-500" /> : index > completedLessons[language].length ? <Lock className="ml-auto h-3.5 w-3.5 text-slate-300" /> : null}
                </span>
              </button>;
            })}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-5 py-6 text-white shadow-xl sm:px-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-red-400">Lesson {lessonIndex + 1} of 100 · {lesson.level}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{lesson.title}</h1><p className="mt-1 text-sm text-slate-300">{lesson.subtitle} · Target {lesson.targetWpm} WPM · सही अक्षर टाइप गर्दै speed बढाउनुहोस्।</p></div><Languages className="hidden h-16 w-16 text-white/10 sm:block" /></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-500 transition-all duration-200" style={{ width: `${stats.progress}%` }} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat icon={<Gauge className="h-4 w-4" />} label="Words/min" value={String(stats.wpm)} tone="red" />
            <Stat icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${stats.accuracy}%`} tone="emerald" />
            <Stat icon={<Clock3 className="h-4 w-4" />} label="Time" value={formatTime(elapsed)} tone="blue" />
            <Stat icon={<Sparkles className="h-4 w-4" />} label="Errors" value={String(stats.errors)} tone="amber" />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Target WPM" value={String(lesson.targetWpm)} tone="red" />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <div onClick={() => inputRef.current?.focus()} className="relative min-h-40 cursor-text rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 text-2xl font-semibold leading-[1.8] tracking-wide sm:p-7 sm:text-3xl">
              {lesson.text.split("").map((character, index) => {
                const state = index < typed.length ? (typed[index] === character ? "correct" : "wrong") : index === typed.length ? "current" : "pending";
                return <span key={`${character}-${index}`} className={state === "correct" ? "text-emerald-600" : state === "wrong" ? "rounded bg-red-100 text-red-600 underline decoration-red-400" : state === "current" ? "animate-pulse rounded-sm border-b-4 border-red-500 bg-red-50 text-slate-900" : "text-slate-400"}>{character === " " ? "\u00a0" : character}</span>;
              })}
              {!typed && <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-bold text-slate-400">Click here and start typing</span>}
            </div>

            <textarea ref={inputRef} value={typed} aria-label="Typing input" autoFocus autoCorrect="off" autoCapitalize="off" spellCheck={false} className="fixed left-[-9999px] top-0 h-px w-px opacity-0" onPaste={(event) => event.preventDefault()} onChange={(event) => {
              if (complete) return;
              if (!startedAt && event.target.value.length) setStartedAt(Date.now());
              const next = event.target.value.slice(0, lesson.text.length);
              setTyped(next); playKeySound();
            }} />

            {complete ? <div className={`mt-5 rounded-2xl border p-5 ${stats.wpm >= lesson.targetWpm && stats.accuracy >= 90 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-full text-white ${stats.wpm >= lesson.targetWpm && stats.accuracy >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}><Medal className="h-6 w-6" /></span><div><p className="font-black text-slate-900">{stats.wpm >= lesson.targetWpm && stats.accuracy >= 90 ? "Speed target achieved! 🎉" : "Lesson complete—speed फेरि अभ्यास गर्नुहोस्"}</p><p className="text-sm text-slate-600">तपाईंको {stats.wpm} WPM · लक्ष्य {lesson.targetWpm} WPM · {stats.accuracy}% accuracy</p></div></div></div> : <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500"><span className="font-semibold">Next key:</span><kbd className="min-w-9 rounded-lg border border-b-2 border-slate-300 bg-white px-2 py-1 text-center font-black text-slate-900">{nextCharacter === " " ? "Space" : nextCharacter}</kbd>{language === "english" && nextCharacter !== " " ? <span className="hidden sm:inline">· {FINGER_MAP[nextCharacter.toLowerCase()] ?? "Use the nearest finger"}</span> : null}</div>}

            <VirtualKeyboard activeKey={nextCharacter.toLowerCase()} />
            {language === "nepali" && <div className="mt-3 rounded-2xl bg-indigo-50 p-3 text-center text-xs font-semibold text-indigo-800">नेपाली keyboard छान्न Windows मा <kbd className="rounded bg-white px-1.5 py-0.5">Win + Space</kbd> प्रयोग गर्नुहोस्। Keyboard र hand-position guide माथि सधैँ देखिन्छ।</div>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Restart</button><button onClick={nextLesson} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-700">{complete ? "Continue" : "Skip lesson"}<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </section>
      </div>}
    </main>
  );
}

function LanguageButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition ${active ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{children}</button>;
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "red" | "emerald" | "blue" | "amber" }) {
  const colors = { red: "bg-red-50 text-red-600", emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600" };
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><span><span className="block text-lg font-black leading-none sm:text-xl">{value}</span><span className="mt-1 block text-[11px] font-bold text-slate-400">{label}</span></span></div>;
}

function VirtualKeyboard({ activeKey }: { activeKey: string }) {
  return <div className="relative mx-auto mt-6 block max-w-3xl select-none rounded-2xl border border-slate-200 bg-slate-100 p-2 shadow-inner sm:p-3">
    <div className="mb-3 rounded-2xl border border-red-100 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,.10)] sm:p-3"><FingerGuide activeKey={activeKey} overlay /></div>
    <div className="space-y-1 sm:space-y-1.5">{KEY_ROWS.map((row, rowIndex) => <div key={rowIndex} className="flex justify-center gap-0.5 sm:gap-1.5">{row.map((key) => <span key={key} className={`grid h-8 min-w-6 flex-1 place-items-center rounded-md border border-b-2 text-[9px] font-black uppercase transition sm:h-10 sm:min-w-10 sm:flex-none sm:rounded-lg sm:text-xs ${activeKey === key ? "relative z-10 -translate-y-1 border-red-700 bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,.65),0_0_0_4px_rgba(254,202,202,.9)]" : "border-slate-300 bg-white text-slate-600 shadow-[0_2px_0_rgba(100,116,139,.18)]"}`}>{key}</span>)}</div>)}<div className="flex justify-center"><span className={`mt-0.5 grid h-8 w-40 place-items-center rounded-lg border border-b-2 text-[9px] font-black uppercase sm:h-9 sm:w-64 sm:text-[10px] ${activeKey === " " ? "-translate-y-1 border-red-700 bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,.65),0_0_0_4px_rgba(254,202,202,.9)]" : "border-slate-300 bg-white text-slate-500"}`}>Space</span></div></div>
  </div>;
}

function FingerGuide({ activeKey, compact = false, overlay = false }: { activeKey: string; compact?: boolean; overlay?: boolean }) {
  const activeFinger = activeKey === " " ? "Thumbs" : FINGER_MAP[activeKey] || "";
  return <div className={`${overlay ? "" : compact ? "mt-3" : "mt-4 border-t border-slate-200 pt-4"}`}>
    <p className={`${overlay ? "mb-1 rounded-full bg-white/90 px-3 py-1 shadow-sm" : "mb-3"} mx-auto w-fit text-center text-xs font-black text-slate-600`}>{activeKey === " " ? "Space थिच्न बुढी औँला प्रयोग गर्नुहोस्" : activeFinger ? `${activeFinger} finger प्रयोग गर्नुहोस्` : "नजिकको औँला प्रयोग गर्नुहोस्"}</p>
    <div className={`flex items-center justify-center ${overlay ? "gap-8 sm:gap-24" : "gap-3 sm:gap-12"}`}>
      <HandDiagram side="Left" activeFinger={activeFinger} />
      {!overlay && <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-[10px] font-bold text-slate-400 sm:block">HOME ROW<br/><span className="text-slate-700">A S D F&nbsp;&nbsp; J K L ;</span></div>}
      <HandDiagram side="Right" activeFinger={activeFinger} />
    </div>
  </div>;
}

function HandDiagram({ side, activeFinger }: { side: "Left" | "Right"; activeFinger: string }) {
  const isActive = (name: string) => activeFinger === `${side} ${name}` || (name === "thumb" && activeFinger === "Thumbs");
  const fingerClass = (name: string) => isActive(name) ? "fill-red-400 stroke-red-600 drop-shadow-[0_0_5px_rgba(239,68,68,.8)]" : "fill-slate-200 stroke-slate-400";
  return <div className="text-center">
    <svg viewBox="0 0 170 150" className={`h-24 w-28 sm:h-32 sm:w-36 ${side === "Right" ? "-scale-x-100" : ""}`} role="img" aria-label={`${side} hand finger position`}>
      <rect x="49" y="29" width="23" height="76" rx="12" className={`stroke-2 transition-all ${fingerClass("little")}`} />
      <rect x="72" y="13" width="24" height="92" rx="12" className={`stroke-2 transition-all ${fingerClass("ring")}`} />
      <rect x="96" y="5" width="25" height="100" rx="12" className={`stroke-2 transition-all ${fingerClass("middle")}`} />
      <rect x="121" y="18" width="24" height="88" rx="12" className={`stroke-2 transition-all ${fingerClass("index")}`} />
      <rect x="22" y="78" width="59" height="25" rx="13" transform="rotate(38 22 78)" className={`stroke-2 transition-all ${fingerClass("thumb")}`} />
      <path d="M52 89 C43 99 43 130 62 142 L130 142 C145 128 146 102 137 88 Z" className="fill-slate-100 stroke-slate-400 stroke-2" />
      <path d="M68 111 Q96 96 127 112" className="fill-none stroke-slate-300 stroke-2" />
    </svg>
    <p className="-mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{side} hand</p>
  </div>;
}

const GAME_WORDS: Record<Language, string[]> = {
  english: ["room", "home", "rent", "water", "bright", "search", "Nepal", "friend", "typing", "keyboard", "practice", "perfect", "window", "garden", "quickly"],
  nepali: ["घर", "कोठा", "पानी", "बाटो", "साथी", "नेपाल", "काम", "राम्रो", "खोजी", "अभ्यास", "छिटो", "सजिलो", "भाडा", "बसाइ", "परिवार"],
};

function TypingGame({ language, onLanguageChange }: { language: Language; onLanguageChange: (language: Language) => void }) {
  const { user } = useUserStore();
  const [running, setRunning] = useState(false);
  const [word, setWord] = useState("");
  const [input, setInput] = useState("");
  const [position, setPosition] = useState(8);
  const [lane, setLane] = useState(50);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; name: string; score: number; level: number; language: Language }>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const gameInputRef = useRef<HTMLInputElement>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      const response = await api.get("/typing-game/leaderboard");
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setLeaderboard(rows.map((row: any) => ({ ...row, score: Number(row.score || 0), level: Number(row.level || 1) })));
    } catch { setLeaderboard([]); }
    finally { setLeaderboardLoading(false); }
  }, []);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);

  const newWord = useCallback(() => {
    const words = GAME_WORDS[language];
    setWord(words[Math.floor(Math.random() * words.length)]);
    setPosition(8);
    setLane(12 + Math.floor(Math.random() * 70));
    setInput("");
  }, [language]);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(`roomkhoj_typing_game_${language}`) || 0)); } catch { setBest(0); }
    setRunning(false); setScore(0); setLives(3); setInput(""); setPosition(8);
  }, [language]);

  useEffect(() => {
    if (lives !== 0 || score <= 0 || submittedScore === score) return;
    setSubmittedScore(score);
    if (!user) return;
    void privateApi.post("/typing-game/score", { score, language })
      .then(() => loadLeaderboard())
      .catch(() => undefined);
  }, [language, lives, loadLeaderboard, score, submittedScore, user]);

  useEffect(() => {
    if (!running) return;
    const speed = Math.min(4.2, 1.15 + score / 220);
    const timer = window.setInterval(() => setPosition((current) => current + speed), 120);
    return () => window.clearInterval(timer);
  }, [running, score]);

  useEffect(() => {
    if (!running || position < 88) return;
    setLives((current) => {
      const next = current - 1;
      if (next <= 0) setRunning(false);
      return next;
    });
    newWord();
  }, [newWord, position, running]);

  const start = () => {
    setScore(0); setLives(3); setSubmittedScore(null); setRunning(true); newWord();
    window.setTimeout(() => gameInputRef.current?.focus(), 0);
  };

  const handleInput = (value: string) => {
    if (!running) return;
    setInput(value);
    if (value.trim() === word) {
      const points = Math.max(10, Math.round(100 - position));
      const nextScore = score + points;
      setScore(nextScore);
      if (nextScore > best) {
        setBest(nextScore);
        try { localStorage.setItem(`roomkhoj_typing_game_${language}`, String(nextScore)); } catch { /* Game still works. */ }
      }
      newWord();
    }
  };

  const gameOver = !running && lives === 0;
  const winner = leaderboard[0];
  return <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-red-500">Learn while playing</p><h1 className="text-2xl font-black sm:text-3xl">Word Drop Typing Game</h1></div>
      <div className="flex rounded-2xl bg-slate-200/70 p-1"><LanguageButton active={language === "english"} onClick={() => onLanguageChange("english")}>English</LanguageButton><LanguageButton active={language === "nepali"} onClick={() => onLanguageChange("nepali")}>नेपाली</LanguageButton></div>
    </div>

    <div className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 p-[2px] shadow-lg">
      <div className="flex flex-col gap-3 rounded-[22px] bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg"><Trophy className="h-7 w-7" /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">RoomKhoj Typing Winner</p><p className="text-xl font-black">{leaderboardLoading ? "Winner loading..." : winner?.name || "अहिलेसम्म winner छैन"}</p></div></div>
        {winner && <div className="flex gap-5 text-sm"><div><span className="block text-[10px] font-bold uppercase text-slate-400">Score</span><span className="text-lg font-black text-amber-300">{winner.score}</span></div><div><span className="block text-[10px] font-bold uppercase text-slate-400">Level</span><span className="text-lg font-black">{winner.level}/100</span></div><div><span className="block text-[10px] font-bold uppercase text-slate-400">Language</span><span className="text-sm font-black capitalize">{winner.language}</span></div></div>}
      </div>
    </div>

    {leaderboard.length > 1 && <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{leaderboard.slice(1, 6).map((player, index) => <div key={`${player.userId}-${player.language}`} className="min-w-[170px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs font-black text-slate-400">#{index + 2}</p><p className="truncate text-sm font-black">{player.name}</p><p className="mt-1 text-xs font-bold text-red-600">{player.score} pts · Level {player.level}</p></div>)}</div>}

    <div className="mb-3 grid grid-cols-3 gap-3">
      <Stat icon={<Trophy className="h-4 w-4" />} label="Score" value={String(score)} tone="red" />
      <Stat icon={<Medal className="h-4 w-4" />} label="Best · Level" value={`${best} · ${Math.min(100, Math.floor(best / 500) + 1)}`} tone="amber" />
      <div className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label={`${lives} lives left`}>{[0, 1, 2].map((life) => <Heart key={life} className={`h-6 w-6 ${life < lives ? "fill-red-500 text-red-500" : "fill-slate-100 text-slate-200"}`} />)}</div>
    </div>

    <div onClick={() => gameInputRef.current?.focus()} className="relative h-[430px] overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-b from-sky-100 via-indigo-50 to-emerald-100 shadow-xl sm:h-[520px]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_40%,white_0_10%,transparent_11%),radial-gradient(circle_at_70%_50%,white_0_12%,transparent_13%)] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-emerald-300/70" />
      {running && <div className="absolute z-10 -translate-x-1/2 rounded-2xl border-2 border-indigo-200 bg-white px-5 py-2.5 text-xl font-black text-indigo-950 shadow-lg transition-[top] duration-100 sm:text-2xl" style={{ left: `${lane}%`, top: `${position}%` }}>{word}</div>}

      {!running && <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/25 p-5 backdrop-blur-[2px]"><div className="max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-600"><Gamepad2 className="h-8 w-8" /></span><h2 className="mt-4 text-2xl font-black">{gameOver ? "Game Over" : "शब्द खस्न नदिनुहोस्!"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">खसिरहेको शब्द तल पुग्नुअघि टाइप गर्नुहोस्। Score बढेसँगै game छिटो हुन्छ।</p>{gameOver && <div className="mt-3"><p className="text-lg font-black text-red-600">Your score: {score} · Level {Math.min(100, Math.floor(score / 500) + 1)}</p><p className="mt-1 text-xs font-bold text-slate-500">{user ? "तपाईंको best score global leaderboard मा save भयो।" : "Leaderboard मा नाम देखाउन login गरेर खेल्नुहोस्।"}</p></div>}<button onClick={start} className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-black text-white shadow-lg shadow-red-200 hover:bg-red-700"><Play className="h-4 w-4 fill-current" /> {gameOver ? "Play again" : "Start game"}</button></div></div>}
    </div>

    <div className="relative mx-auto -mt-8 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:p-4">
      <input ref={gameInputRef} value={input} disabled={!running} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} onChange={(event) => handleInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleInput(input.trim()); }} placeholder={running ? (language === "english" ? "Type the falling word..." : "खसिरहेको शब्द टाइप गर्नुहोस्...") : "Start the game first"} className="h-14 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 text-center text-lg font-black outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed" />
      {running && input && <p className={`mt-2 text-center text-xs font-bold ${word.startsWith(input) ? "text-emerald-600" : "text-red-500"}`}>{word.startsWith(input) ? "सही छ—पूरा शब्द टाइप गर्नुहोस्" : "अक्षर मिलेन, फेरि प्रयास गर्नुहोस्"}</p>}
      {running && language === "english" && <FingerGuide activeKey={(word[input.length] || " ").toLowerCase()} compact />}
    </div>
  </div>;
}
