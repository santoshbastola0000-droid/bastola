"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, HousePlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  type SocialUser,
  socialService,
} from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type MentionOption = Pick<
  SocialUser,
  "id" | "name" | "profilePhotoUrl" | "isVerified"
> & {
  mentionType: "FRIEND" | "OFFICIAL";
};

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) {
    return raw.startsWith("//") ? `https:${raw}` : raw;
  }
  if (/^(data:|blob:)/i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function activeMention(value: string) {
  const match = value.match(/(?:^|\s)@([^@\n]{0,80})$/);
  if (!match) return null;

  const start = value.lastIndexOf("@");
  if (start < 0) return null;

  return {
    start,
    query: String(match[1] || "").trim(),
  };
}

export function MentionInput({
  userId,
  value,
  onChange,
  onMentionIdsChange,
  placeholder,
  maxLength,
  className,
}: {
  userId: string;
  value: string;
  onChange: (value: string) => void;
  onMentionIdsChange: (ids: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<MentionOption[]>([]);
  const [selected, setSelected] = useState<MentionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const mention = useMemo(() => activeMention(value), [value]);

  useEffect(() => {
    if (!mention) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const rows = await socialService.mentionOptions(mention.query);
        if (!active) return;

        setOptions(
          (Array.isArray(rows) ? rows : [])
            .filter((row) => String(row.id) !== String(userId))
            .slice(0, 10),
        );
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mention?.query, userId]);

  useEffect(() => {
    if (value) return;
    setSelected([]);
    onMentionIdsChange([]);
  }, [value, onMentionIdsChange]);

  const emitSelected = (rows: MentionOption[]) => {
    setSelected(rows);
    onMentionIdsChange(
      Array.from(new Set(rows.map((row) => String(row.id)))),
    );
  };

  const handleChange = (nextValue: string) => {
    const stillPresent = selected.filter((person) =>
      nextValue.includes(`@${person.name}`),
    );

    if (stillPresent.length !== selected.length) {
      emitSelected(stillPresent);
    }

    onChange(nextValue);
  };

  const chooseMention = (person: MentionOption) => {
    const current = activeMention(value);
    if (!current) return;

    const before = value.slice(0, current.start);
    const next = `${before}@${person.name} `;
    onChange(next);

    const nextSelected = selected.some(
      (item) => String(item.id) === String(person.id),
    )
      ? selected
      : [...selected, person].slice(0, 10);

    emitSelected(nextSelected);
    setOptions([]);
  };

  const showMenu = Boolean(mention);

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
        autoComplete="off"
      />

      {showMenu && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[90] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Mention
              </div>
              <div className="text-[11px] text-slate-500">
                Friends र official RoomKhoj मात्र
              </div>
            </div>

            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => router.push("/user/dashboard/rooms/create")}
              className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100"
            >
              <HousePlus className="h-3.5 w-3.5" />
              Add room
            </button>
          </div>

          {loading ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              Searching mentions...
            </div>
          ) : options.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {options.map((person) => {
                const photo = media(person.profilePhotoUrl);
                const official = person.mentionType === "OFFICIAL";

                return (
                  <button
                    key={person.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseMention(person)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={person.name}
                        className="h-9 w-9 rounded-full bg-slate-100 object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                          official
                            ? "bg-red-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {official
                          ? "RK"
                          : person.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[14px] font-semibold text-slate-950">
                          {person.name}
                        </span>
                        {official && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-red-600" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        {official ? (
                          "Official RoomKhoj · can mention"
                        ) : (
                          <>
                            <Users className="h-3 w-3" />
                            Friend · can mention
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Mention गर्न मिल्ने user भेटिएन।
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                अरू user लाई mention गर्न पहिले friend हुनुपर्छ। Official RoomKhoj लाई सधैं mention गर्न मिल्छ।
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
