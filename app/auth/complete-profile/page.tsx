"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, KeyRound, BriefcaseBusiness, Building2 } from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

const options = [
  { value: "FIND_ROOM", label: "Find a room", detail: "I am looking for a room", icon: Home },
  { value: "POST_ROOM", label: "Post a room", detail: "I have a room to rent", icon: KeyRound },
  { value: "FIND_JOB", label: "Find a job", detail: "I am looking for work", icon: BriefcaseBusiness },
  { value: "POST_JOB", label: "Post a job", detail: "I want to hire someone", icon: Building2 },
] as const;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useUserStore();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectPurpose = async (accountPurpose: string) => {
    setSaving(accountPurpose);
    setError("");

    try {
      await privateApi.patch("/user/account-purpose", { accountPurpose });
      updateUser({ accountPurpose: accountPurpose as any });
      router.replace("/user/dashboard");
      router.refresh();
    } catch {
      setError("Category could not be saved. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-600">Welcome to RoomKhoj</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">
          What do you want to do?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose one category for {user?.name || "your account"}. You can change it later.
        </p>

        <div className="mt-6 space-y-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                disabled={saving !== null}
                onClick={() => selectPurpose(option.value)}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold text-slate-900">
                    {saving === option.value ? "Saving..." : option.label}
                  </span>
                  <span className="block text-xs text-slate-500">{option.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </main>
  );
}
