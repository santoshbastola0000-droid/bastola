"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, UserPlus } from "lucide-react";
import { notificationService, UserNotification } from "@/http/services/notification.service";
import { socialService } from "@/http/services/social.service";

function timeAgo(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return d < 7 ? `${d}d` : new Date(value).toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems(await notificationService.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const unread = useMemo(() => items.filter((item) => !item.readAt).length, [items]);

  const openNotification = async (item: UserNotification) => {
    if (!item.readAt) {
      await notificationService.markRead(item.id).catch(() => undefined);
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row,
        ),
      );
    }
    const url = String(item.actionUrl || "/feed");
    if (url.startsWith("/")) router.push(url);
  };

  const acceptFriend = async (item: UserNotification) => {
    const requesterId = String(item.data?.requesterId || "");
    if (!requesterId) return;
    setAccepting(item.id);
    try {
      await socialService.acceptFriendRequest(requesterId);
      await notificationService.markRead(item.id).catch(() => undefined);
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                readAt: new Date().toISOString(),
                title: "Friend request accepted",
                body: "You are now friends on RoomKhoj.",
                data: { ...(row.data || {}), accepted: true },
              }
            : row,
        ),
      );
    } finally {
      setAccepting(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-3 py-4">
      <section className="mx-auto max-w-[680px] overflow-hidden rounded-2xl bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-xs text-slate-500">{unread} unread</p>
          </div>
        </header>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No notifications yet.</div>
        ) : (
          <div>
            {items.map((item) => {
              const friendRequest =
                item.type === "FRIEND_REQUEST" &&
                Boolean(item.data?.requesterId) &&
                !item.data?.accepted;

              return (
                <div
                  key={item.id}
                  className={`border-b px-4 py-3 ${!item.readAt ? "bg-blue-50/70" : "bg-white"}`}
                >
                  <button
                    type="button"
                    onClick={() => void openNotification(item)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      {friendRequest ? <UserPlus className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <b className="min-w-0 flex-1 text-[14px] leading-5">{item.title}</b>
                        <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{item.body}</p>
                    </div>
                    {!item.readAt && <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
                  </button>

                  {friendRequest && (
                    <div className="ml-[52px] mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={accepting === item.id}
                        onClick={() => void acceptFriend(item)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {accepting === item.id ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void openNotification(item)}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        View
                      </button>
                    </div>
                  )}

                  {item.type === "FRIEND_REQUEST_ACCEPTED" && (
                    <div className="ml-[52px] mt-2 flex items-center gap-1 text-xs font-semibold text-green-600">
                      <Check className="h-4 w-4" /> Friends
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
