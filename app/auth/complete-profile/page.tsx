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
  const [selectedPurpose, setSelectedPurpose] = useState<string>(String(user?.accountPurpose || ""));
  const [phoneNumber, setPhoneNumber] = useState(String((user as any)?.phoneNumber || "").startsWith("SOCIAL_") ? "" : String((user as any)?.phoneNumber || ""));

  const completeProfile = async () => {
    if (!selectedPurpose) {
      setError("Please choose what you want to use RoomKhoj for.");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phoneNumber.replace(/[\s()-]/g, ""))) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving("profile");
    setError("");
    try {
      await privateApi.patch("/user/account-purpose", { accountPurpose: selectedPurpose });
      const phoneResponse = await privateApi.patch("/user/social-phone", { phoneNumber });
      updateUser({
        accountPurpose: selectedPurpose as any,
        phoneNumber: phoneResponse.data?.phoneNumber || phoneNumber,
        isVerified: false,
      } as any);
      router.replace("/user/dashboard/profile");
      router.refresh();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Profile could not be completed. Please try again.");
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
                onClick={() => setSelectedPurpose(option.value)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left disabled:opacity-60 ${selectedPurpose === option.value ? "border-red-500 bg-red-50 ring-2 ring-red-100" : "border-slate-200 hover:border-red-300 hover:bg-red-50"}`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold text-slate-900">
{option.label}
                  </span>
                  <span className="block text-xs text-slate-500">{option.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <label className="text-sm font-bold text-slate-900">Your phone number</label>
          <p className="mt-1 text-xs text-slate-500">
            Google normally does not provide your phone number to RoomKhoj, so please add it here.
          </p>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="98XXXXXXXX or +97798XXXXXXXX"
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
          <button
            type="button"
            onClick={completeProfile}
            disabled={saving !== null}
            className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue to RoomKhoj"}
          </button>
          <p className="mt-3 text-xs leading-5 text-amber-700">
            Your account will stay Unverified until RoomKhoj verification is completed.
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </main>
  );
}
