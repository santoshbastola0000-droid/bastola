"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Home,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import useTokenStore from "@/store";
import { Button } from "@/components/ui/button";

const POPUP_DELAYS_MS = [5_000, 30_000, 60_000];

const goals = [
  {
    id: "FIND_ROOM",
    title: "कोठा खोज्न",
    description: "आफ्नो बजेट र ठाउँअनुसार कोठा खोज्नुहोस्",
    icon: Search,
  },
  {
    id: "POST_ROOM",
    title: "कोठा पोस्ट गर्न",
    description: "आफ्नो कोठा वा फ्ल्याटको listing राख्नुहोस्",
    icon: Home,
  },
  {
    id: "FIND_JOB",
    title: "जागिर खोज्न",
    description: "आफ्नो लागि मिल्ने जागिर खोज्नुहोस्",
    icon: BriefcaseBusiness,
  },
  {
    id: "POST_JOB",
    title: "Vacancy पोस्ट गर्न",
    description: "आफ्नो कम्पनीको vacancy राख्नुहोस्",
    icon: PlusCircle,
  },
] as const;

type GoalId = (typeof goals)[number]["id"];

export function GuestLoginPopup() {
  const pathname = usePathname();
  const token = useTokenStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalId>("FIND_ROOM");
  const showCountRef = useRef(0);

  const isAuthPage = pathname.startsWith("/auth");
  const activeGoal = goals.find((goal) => goal.id === selectedGoal)!;

  useEffect(() => {
    if (token || isAuthPage || open) return;

    const delay =
      POPUP_DELAYS_MS[
        Math.min(showCountRef.current, POPUP_DELAYS_MS.length - 1)
      ];

    const timer = window.setTimeout(() => {
      showCountRef.current += 1;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [token, isAuthPage, open]);

  if (!open || token || isAuthPage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="pr-8 text-xl font-bold text-slate-900">
          तपाईंलाई के चाहिएको हो?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          एउटा विकल्प छान्नुहोस्, त्यसपछि Login गरेर सजिलै अगाडि बढ्नुहोस्।
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const selected = selectedGoal === goal.id;

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => setSelectedGoal(goal.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-slate-500"}`} />
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {goal.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {goal.description}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          छानिएको: <span className="font-semibold text-slate-900">{activeGoal.title}</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button asChild className="h-11 rounded-xl">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/auth/register">Sign up</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-800"
        >
          अहिले होइन
        </button>
      </div>
    </div>
  );
}
