"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  KeyRound,
  BriefcaseBusiness,
  Building2,
} from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

const options = [
  {
    value: "FIND_ROOM",
    label: "Find a room",
    detail: "I am looking for a room",
    icon: Home,
  },
  {
    value: "POST_ROOM",
    label: "Post a room",
    detail: "I have a room to rent",
    icon: KeyRound,
  },
  {
    value: "FIND_JOB",
    label: "Find a job",
    detail: "I am looking for work",
    icon: BriefcaseBusiness,
  },
  {
    value: "POST_JOB",
    label: "Post a job",
    detail: "I want to hire someone",
    icon: Building2,
  },
] as const;

function normalizePhone(value?: string | null) {
  return String(value || "")
    .replace(/[\s()-]/g, "")
    .trim();
}

function usablePhone(value?: string | null) {
  const phone = normalizePhone(value);
  return !phone.startsWith("SOCIAL_") && /^\+?\d{10,15}$/.test(phone)
    ? phone
    : "";
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useUserStore();

  const existingPhone = usablePhone(
    String((user as any)?.phoneNumber || (user as any)?.phone || ""),
  );

  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>(
    String(user?.accountPurpose || ""),
  );
  const [phoneNumber, setPhoneNumber] = useState(existingPhone);

  const finish = async (
    purpose: string,
    options?: {
      phone?: string;
      savePhone?: boolean;
    },
  ) => {
    if (!purpose) {
      setError("Please choose what you want to use RoomKhoj for.");
      return;
    }

    const rawPhone = normalizePhone(options?.phone || "");
    const shouldSavePhone = Boolean(options?.savePhone && rawPhone);

    if (shouldSavePhone && !/^\+?\d{10,15}$/.test(rawPhone)) {
      setError("Please enter a valid phone number or leave it empty.");
      return;
    }

    setSaving("continue");
    setError("");

    try {
      await privateApi.patch("/user/account-purpose", {
        accountPurpose: purpose,
      });

      let savedPhone = existingPhone || "";
      let phoneSaved = false;

      if (shouldSavePhone) {
        try {
          const response = await privateApi.patch("/user/social-phone", {
            phoneNumber: rawPhone,
          });
          savedPhone = String(response.data?.phoneNumber || rawPhone);
          phoneSaved = true;
        } catch (phoneError: any) {
          const message = String(
            phoneError?.response?.data?.message || "",
          );

          // Phone is optional. A number already attached to another account
          // must never be used to merge/sign in without ownership proof.
          // Do not block onboarding; continue without attaching that number.
          if (!message.toLowerCase().includes("already in use")) {
            throw phoneError;
          }
        }
      }

      updateUser({
        accountPurpose: purpose as any,
        ...(savedPhone ? { phoneNumber: savedPhone } : {}),
        ...(phoneSaved ? { isVerified: false } : {}),
      } as any);

      router.replace("/feed");
      router.refresh();
    } catch (submitError: any) {
      const message = String(
        submitError?.response?.data?.message ||
          "Profile could not be completed. Please try again.",
      );
      const lowered = message.toLowerCase();

      if (
        lowered.includes("disabled by admin") ||
        lowered.includes("account has been banned") ||
        submitError?.response?.data?.code === "ACCOUNT_BANNED"
      ) {
        router.replace("/account-banned");
        return;
      }

      setError(message);
    } finally {
      setSaving(null);
    }
  };

  const choosePurpose = async (purpose: string) => {
    setSelectedPurpose(purpose);
    setError("");

    // Existing users who already have a real phone number do not need any
    // extra onboarding step. Save the category and continue immediately.
    if (existingPhone) {
      await finish(purpose);
    }
  };

  const continueWithOptionalPhone = async () => {
    const rawPhone = normalizePhone(phoneNumber);

    await finish(selectedPurpose, {
      phone: rawPhone,
      savePhone: Boolean(rawPhone && rawPhone !== existingPhone),
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-600">
          Welcome to RoomKhoj
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-950">
          What do you want to do?
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Choose one category for {user?.name || "your account"}. You can
          change it later.
        </p>

        <div className="mt-6 space-y-3">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                disabled={saving !== null}
                onClick={() => void choosePurpose(option.value)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left disabled:opacity-60 ${
                  selectedPurpose === option.value
                    ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                    : "border-slate-200 hover:border-red-300 hover:bg-red-50"
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>

                <span>
                  <span className="block font-bold text-slate-900">
                    {option.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {option.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {!existingPhone && selectedPurpose && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">
                Phone number is optional
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Phone नदिई पनि अहिले नै RoomKhoj चलाउन सक्नुहुन्छ।
              </p>

              <button
                type="button"
                onClick={() =>
                  void finish(selectedPurpose, {
                    phone: "",
                    savePhone: false,
                  })
                }
                disabled={saving !== null}
                className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3.5 text-base font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {saving === "continue"
                  ? "Continuing..."
                  : "Continue without phone"}
              </button>
            </div>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                or add phone
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <label className="text-sm font-bold text-slate-900">
              Phone number{" "}
              <span className="font-medium text-slate-400">(optional)</span>
            </label>

            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                setError("");
              }}
              placeholder="98XXXXXXXX or +97798XXXXXXXX"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <button
              type="button"
              onClick={() => void continueWithOptionalPhone()}
              disabled={saving !== null || !normalizePhone(phoneNumber)}
              className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save phone & continue
            </button>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              OTP verification is not required here. You can add or verify your
              phone later from your profile.
            </p>
          </div>
        )}

        {existingPhone && saving === "continue" && (
          <p className="mt-5 text-center text-sm font-semibold text-slate-500">
            Signing you in...
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
        )}
      </section>
    </main>
  );
}
