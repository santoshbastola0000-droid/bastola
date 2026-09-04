"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Gauge,
  Keyboard,
  Languages,
  Lock,
  Medal,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Language = "english" | "nepali";
type Lesson = { title: string; subtitle: string; level: string; text: string };

const LESSONS: Record<Language, Lesson[]> = {
  english: [
    { title: "Home row", subtitle: "F and J keys", level: "Beginner", text: "fff jjj fjf jfj fff jjj fjf jfj" },
    { title: "Home row words", subtitle: "A S D F J K L", level: "Beginner", text: "ask dad; fall; flask; salad; all sad;" },
    { title: "Top row", subtitle: "Q W E R T Y U I O P", level: "Beginner", text: "quiet power write type your proper route" },
    { title: "Simple sentences", subtitle: "Build accuracy", level: "Intermediate", text: "The room is clean and bright. Practice typing every day." },
    { title: "Everyday English", subtitle: "Real sentences", level: "Intermediate", text: "RoomKhoj helps people find rooms and jobs across Nepal quickly and easily." },
    { title: "Speed builder", subtitle: "Keep a steady rhythm", level: "Advanced", text: "Accuracy comes before speed. Keep your fingers relaxed and look at the screen while you type." },
  ],
  nepali: [
    { title: "नेपाली अक्षर", subtitle: "सजिला अक्षर अभ्यास", level: "सुरुवात", text: "क ख ग घ क ख ग घ क ख ग घ" },
    { title: "सजिला शब्द", subtitle: "दैनिक प्रयोगका शब्द", level: "सुरुवात", text: "घर कोठा पानी बाटो काम नाम साथी राम्रो नेपाल" },
    { title: "सानो वाक्य", subtitle: "शब्द र खाली ठाउँ", level: "सुरुवात", text: "म नेपाली टाइप गर्न सिक्दै छु।" },
    { title: "दैनिक अभ्यास", subtitle: "सही अक्षरमा ध्यान", level: "मध्यम", text: "म हरेक दिन दश मिनेट टाइपिङ अभ्यास गर्छु।" },
    { title: "रुमखोज वाक्य", subtitle: "व्यावहारिक नेपाली", level: "मध्यम", text: "रुमखोजले नेपालभर कोठा र रोजगारी खोज्न सजिलो बनाउँछ।" },
    { title: "गति अभ्यास", subtitle: "लामो वाक्य", level: "उन्नत", text: "छिटो टाइप गर्नुभन्दा पहिले सही टाइप गर्ने बानी बसाल्नुहोस् र नियमित अभ्यास गर्नुहोस्।" },
  ],
};

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
            <button onClick={() => setSoundOn((value) => !value)} aria-label="Toggle keyboard sound" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
            <div className="hidden items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 sm:flex"><Trophy className="h-4 w-4" /> {completedLessons[language].length}/{LESSONS[language].length} lessons</div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
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
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-red-400">Lesson {lessonIndex + 1} · {lesson.level}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{lesson.title}</h1><p className="mt-1 text-sm text-slate-300">{lesson.subtitle} · सही अक्षर टाइप गर्दै speed बढाउनुहोस्।</p></div><Languages className="hidden h-16 w-16 text-white/10 sm:block" /></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-500 transition-all duration-200" style={{ width: `${stats.progress}%` }} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Gauge className="h-4 w-4" />} label="Words/min" value={String(stats.wpm)} tone="red" />
            <Stat icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${stats.accuracy}%`} tone="emerald" />
            <Stat icon={<Clock3 className="h-4 w-4" />} label="Time" value={formatTime(elapsed)} tone="blue" />
            <Stat icon={<Sparkles className="h-4 w-4" />} label="Errors" value={String(stats.errors)} tone="amber" />
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

            {complete ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white"><Medal className="h-6 w-6" /></span><div><p className="font-black text-emerald-900">Lesson complete! 🎉</p><p className="text-sm text-emerald-700">{stats.wpm} WPM र {stats.accuracy}% accuracy</p></div></div></div> : <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500"><span className="font-semibold">Next key:</span><kbd className="min-w-9 rounded-lg border border-b-2 border-slate-300 bg-white px-2 py-1 text-center font-black text-slate-900">{nextCharacter === " " ? "Space" : nextCharacter}</kbd>{language === "english" && nextCharacter !== " " ? <span className="hidden sm:inline">· {FINGER_MAP[nextCharacter.toLowerCase()] ?? "Use the nearest finger"}</span> : null}</div>}

            {language === "english" ? <VirtualKeyboard activeKey={nextCharacter.toLowerCase()} /> : <div className="mt-5 rounded-2xl bg-indigo-50 p-4 text-center text-sm font-semibold text-indigo-800">नेपाली अभ्यासका लागि आफ्नो device को Nepali keyboard छान्नुहोस्। Windows मा <kbd className="rounded bg-white px-1.5 py-0.5">Win + Space</kbd> प्रयोग गर्न सक्नुहुन्छ।</div>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Restart</button><button onClick={nextLesson} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-700">{complete ? "Continue" : "Skip lesson"}<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </section>
      </div>
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
  return <div className="mx-auto mt-6 hidden max-w-3xl select-none space-y-1.5 rounded-2xl bg-slate-100 p-3 md:block">{KEY_ROWS.map((row, rowIndex) => <div key={rowIndex} className="flex justify-center gap-1.5">{row.map((key) => <span key={key} className={`grid h-10 min-w-10 place-items-center rounded-lg border border-b-2 text-xs font-black uppercase transition ${activeKey === key ? "border-red-600 bg-red-600 text-white -translate-y-0.5 shadow-lg shadow-red-200" : "border-slate-300 bg-white text-slate-600"}`}>{key}</span>)}</div>)}<div className="flex justify-center"><span className={`mt-0.5 grid h-9 w-64 place-items-center rounded-lg border border-b-2 text-[10px] font-black uppercase ${activeKey === " " ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-500"}`}>Space</span></div></div>;
}
