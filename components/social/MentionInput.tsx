"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { profileService } from "@/http/services/profile.service";
import { SocialUser, socialService } from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type MentionFriend = Pick<SocialUser, "id" | "name" | "profilePhotoUrl">;

const friendCache = new Map<string, Promise<MentionFriend[]>>();

function loadFriends(userId: string) {
  const key = String(userId || "").trim();
  if (!friendCache.has(key)) {
    friendCache.set(
      key,
      profileService
        .getFriends(key)
        .then((rows) => (Array.isArray(rows) ? rows : []))
        .catch(() => []),
    );
  }
  return friendCache.get(key)!;
}

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
  const [friends, setFriends] = useState<MentionFriend[]>([]);
  const [selected, setSelected] = useState<MentionFriend[]>([]);
  const [nonFriends, setNonFriends] = useState<MentionFriend[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const mention = useMemo(() => activeMention(value), [value]);

  useEffect(() => {
    let active = true;
    void loadFriends(userId).then((rows) => {
      if (active) setFriends(rows);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (value) return;
    setSelected([]);
    onMentionIdsChange([]);
  }, [value, onMentionIdsChange]);

  const friendMatches = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return friends
      .filter((friend) => !q || friend.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [friends, mention]);

  useEffect(() => {
    if (!mention || mention.query.length < 2 || friendMatches.length > 0) {
      setNonFriends([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      void socialService
        .search(mention.query, 6)
        .then((result) => {
          if (!active) return;
          const friendIds = new Set(friends.map((friend) => String(friend.id)));
          setNonFriends(
            (result.users || [])
              .filter(
                (person) =>
                  String(person.id) !== String(userId) &&
                  !friendIds.has(String(person.id)),
              )
              .slice(0, 3),
          );
        })
        .catch(() => {
          if (active) setNonFriends([]);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [friendMatches.length, friends, mention, userId]);

  const emitSelected = (rows: MentionFriend[]) => {
    setSelected(rows);
    onMentionIdsChange(Array.from(new Set(rows.map((row) => String(row.id)))));
  };

  const handleChange = (nextValue: string) => {
    const stillPresent = selected.filter((friend) =>
      nextValue.includes(`@${friend.name}`),
    );
    if (stillPresent.length !== selected.length) emitSelected(stillPresent);
    onChange(nextValue);
  };

  const chooseFriend = (friend: MentionFriend) => {
    const current = activeMention(value);
    if (!current) return;

    const before = value.slice(0, current.start);
    const next = `${before}@${friend.name} `;
    onChange(next);

    const nextSelected = selected.some(
      (item) => String(item.id) === String(friend.id),
    )
      ? selected
      : [...selected, friend].slice(0, 10);
    emitSelected(nextSelected);
    setNonFriends([]);
  };

  const sendRequest = async (person: MentionFriend) => {
    if (requested.has(String(person.id))) return;
    try {
      await socialService.sendFriendRequest(String(person.id));
      setRequested((current) => new Set(current).add(String(person.id)));
      toast.success("Friend request sent. Mention will be available after acceptance.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Friend request failed");
    }
  };

  const showMenu = Boolean(
    mention && (friendMatches.length > 0 || nonFriends.length > 0),
  );

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
          {friendMatches.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Friends you can mention
              </div>
              {friendMatches.map((friend) => {
                const photo = media(friend.profilePhotoUrl);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseFriend(friend)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={friend.name}
                        className="h-9 w-9 rounded-full bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                        {friend.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-slate-950">
                        {friend.name}
                      </div>
                      <div className="text-[11px] text-slate-500">Friend · can mention</div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {friendMatches.length === 0 && nonFriends.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Not friends yet
              </div>
              {nonFriends.map((person) => {
                const photo = media(person.profilePhotoUrl);
                const sent = requested.has(String(person.id));
                return (
                  <div key={person.id} className="flex items-center gap-3 px-3 py-2">
                    {photo ? (
                      <img
                        src={photo}
                        alt={person.name}
                        className="h-9 w-9 rounded-full bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                        {person.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-slate-950">
                        {person.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Add as friend before mentioning
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={sent}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => void sendRequest(person)}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:bg-slate-300"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {sent ? "Sent" : "Add Friend"}
                    </button>
                  </div>
                );
              })}
              <div className="border-t border-slate-100 px-3 py-2 text-[11px] leading-4 text-slate-500">
                Mentioning unlocks after the friend request is accepted.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
