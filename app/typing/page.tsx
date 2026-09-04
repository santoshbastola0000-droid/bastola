"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Languages, Keyboard, Trophy, Target, Gauge } from "lucide-react";

const lessons = {
  english: [
    { title: "Home Row", level: "Beginner", text: "asdf jkl; asdf jkl; ask dad; fall; flask; salad;" },
    { title: "Simple Words", level: "Beginner", text: "the room is clean and bright. practice typing every day." },
    { title: "Everyday English", level: "Intermediate", text: "RoomKhoj helps people find rooms and jobs across Nepal quickly and easily." },
    { title: "Speed Practice", level: "Advanced", text: "Accuracy comes before speed. Keep your fingers relaxed, look at the screen, and type with a steady rhythm." },
  ],
  nepali: [
    { title: "सजिला शब्द", level: "सुरुवात", text: "घर कोठा पानी बाटो काम नाम साथी राम्रो नेपाल" },
    { title: "साधारण वाक्य", level: "सुरुवात", text: "म नेपाली टाइप गर्न सिक्दै छु। म हरेक दिन अभ्यास गर्छु।" },
    { title: "दैनिक प्रयोग", level: "मध्यम", text: "रुमखोजले नेपालभर कोठा र रोजगारी खोज्न सजिलो बनाउँछ।" },
    { title: "गति अभ्यास", level: "उन्नत", text: "छिटो टाइप गर्नुभन्दा पहिले सही टाइप गर्ने बानी बसाल्नुहोस् र नियमित अभ्यास गर्नुहोस्।" },
  ],
} as const;

type Language = keyof typeof lessons;

export default function TypingPracticePage() {
  const [language, setLanguage] = useState<Language>("english");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lesson = lessons[language][lessonIndex];

  const stats = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i += 1) {
      if (typed[i] === lesson.text[i]) correct += 1;
    }

    const accuracy = typed.length === 0 ? 100 : Math.round((correct / typed.length) * 100);
    const minutes = startedAt ? Math.max((Date.now() - startedAt) / 60000, 1 / 60) : 0;
    const wpm = minutes > 0 ? Math.max(0, Math.round(correct / 5 / minutes)) : 0;
    const completed = typed === lesson.text;

    return { correct, accuracy, wpm, completed };
  }, [typed, lesson.text, startedAt]);

  const reset = () => {
    setTyped("");
    setStartedAt(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    setLessonIndex(0);
    setTyped("");
    setStartedAt(null);
  };

  const nextLesson = () => {
    setLessonIndex((current) => (current + 1) % lessons[language].length);
    setTyped("");
    setStartedAt(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600">
            <Keyboard className="h-4 w-4" /> RoomKhoj Typing
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 px-5 py-8 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-red-400">FREE TYPING PRACTICE</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">English र नेपाली Typing सिक्नुहोस्</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">सही अक्षर, accuracy र speed हेर्दै step-by-step typing practice गर्नुहोस्। Mobile र desktop दुवैमा अभ्यास गर्न मिल्छ।</p>
            </div>
            <Languages className="hidden h-24 w-24 text-white/15 md:block" />
          </div>
        </section>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat icon={<Gauge className="h-5 w-5" />} label="WPM" value={stats.wpm.toString()} />
          <Stat icon={<Target className="h-5 w-5" />} label="Accuracy" value={`${stats.accuracy}%`} />
          <Stat icon={<Trophy className="h-5 w-5" />} label="Progress" value={`${Math.min(typed.length, lesson.text.length)}/${lesson.text.length}`} />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-500">{lesson.level}</div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{lesson.title}</h2>
            </div>

            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button onClick={() => changeLanguage("english")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${language === "english" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>English</button>
              <button onClick={() => changeLanguage("nepali")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${language === "nepali" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>नेपाली</button>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xl font-medium leading-10 tracking-wide sm:p-6 sm:text-2xl">
            {lesson.text.split("").map((char, index) => {
              let cls = "text-slate-400";
              if (index < typed.length) cls = typed[index] === char ? "text-emerald-600" : "rounded bg-red-100 text-red-600";
              if (index === typed.length) cls = "rounded bg-amber-200 text-slate-950";
              return <span key={`${index}-${char}`} className={cls}>{char}</span>;
            })}
          </div>

          <textarea
            ref={inputRef}
            value={typed}
            onChange={(event) => {
              if (!startedAt && event.target.value.length > 0) setStartedAt(Date.now());
              setTyped(event.target.value.slice(0, lesson.text.length));
            }}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={language === "english" ? "Start typing here..." : "यहाँ टाइप गर्न सुरु गर्नुहोस्..."}
            className="min-h-36 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white p-4 text-lg font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />

          {stats.completed && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              🎉 Lesson complete! Accuracy {stats.accuracy}% — अब अर्को lesson try गर्नुहोस्।
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={nextLesson} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700">
              Next Lesson →
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Tip title="1. Accuracy first" text="पहिला सही टाइप गर्नुहोस्। Speed पछि आफैँ बढ्छ।" />
          <Tip title="2. Screen हेर्नुहोस्" text="Keyboard भन्दा screen हेर्ने बानी बसाल्नुहोस्।" />
          <Tip title="3. Daily practice" text="दिनको 10–15 मिनेट नियमित अभ्यास गर्नु सबैभन्दा उपयोगी हुन्छ।" />
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-red-500">{icon}</div>
      <div className="text-xl font-black text-slate-950 sm:text-2xl">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function Tip({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
