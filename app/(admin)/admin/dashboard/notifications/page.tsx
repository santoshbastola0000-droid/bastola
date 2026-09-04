"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Link2, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";

type UserOption = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("RoomKhoj");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("/notifications");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    privateApi
      .get("/user", { params: { take: 100, page: 0 } })
      .then((response) => {
        const items = response.data?.data || [];
        setUsers(items);
      })
      .catch(() => toast.error("Users load हुन सकेन"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [search, users]);

  async function sendNotification() {
    if (!userId || !title.trim() || !message.trim()) {
      toast.error("User, title र message राख्नुहोस्");
      return;
    }

    try {
      setSending(true);
      const response = await privateApi.post("/notifications/admin/send", {
        userId,
        title: title.trim(),
        message: message.trim(),
        actionUrl: actionUrl.trim() || "/notifications",
      });

      const channel = response.data?.channel;
      toast.success(
        channel === "push"
          ? "Push notification पठाइयो।"
          : channel === "email"
            ? "Push नपुगेकाले email पठाइयो।"
            : "Notification inbox मा पठाइयो।",
      );
      setMessage("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Notification पठाउन सकेन");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notify Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin बाट user लाई app notification पठाउनुहोस्। चाहिएको page वा website link पनि राख्न सकिन्छ।
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <label className="mb-2 block text-sm font-medium">Find recipient</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm"
            placeholder="Search by name, email or phone"
          />
        </div>

        <label className="mb-2 mt-5 block text-sm font-medium">Recipient</label>
        {loadingUsers ? (
          <div className="flex h-11 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Users loading...
          </div>
        ) : (
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Select user</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email || user.phone || user.id}
              </option>
            ))}
          </select>
        )}

        <label className="mb-2 mt-5 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          className="h-11 w-full rounded-xl border px-3 text-sm"
          placeholder="RoomKhoj"
        />

        <label className="mb-2 mt-5 block text-sm font-medium">Message</label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          rows={5}
          className="w-full rounded-xl border p-3 text-sm"
          placeholder="Write notification message"
        />

        <label className="mb-2 mt-5 block text-sm font-medium">Link (optional)</label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={actionUrl}
            onChange={(event) => setActionUrl(event.target.value)}
            maxLength={500}
            className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm"
            placeholder="/jobs or https://roomkhoj.com/jobs"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          User ले notification click गर्दा यही link खुल्छ। खाली छोडे /notifications खुल्छ।
        </p>

        <button
          type="button"
          onClick={sendNotification}
          disabled={sending || loadingUsers}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send notification
        </button>
      </section>
    </main>
  );
}
