"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";
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

  async function sendNotification() {
    if (!userId || !title.trim() || !message.trim()) {
      toast.error("User, title र message राख्नुहोस्");
      return;
    }

    try {
      setSending(true);
      const response = await privateApi.post(
        "/notifications/admin/send",
        {
          userId,
          title: title.trim(),
          message: message.trim(),
          actionUrl: "/notifications",
        },
      );

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
      toast.error(
        error?.response?.data?.message ||
          "Notification पठाउन सकेन",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Send notification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          यहाँ छानेको एउटै user लाई मात्र notification जान्छ।
        </p>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium">
          Recipient
        </label>
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
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email || user.phone || user.id}
              </option>
            ))}
          </select>
        )}

        <label className="mb-2 mt-5 block text-sm font-medium">
          Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          className="h-11 w-full rounded-xl border px-3 text-sm"
          placeholder="RoomKhoj"
        />

        <label className="mb-2 mt-5 block text-sm font-medium">
          Message
        </label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          rows={5}
          className="w-full rounded-xl border p-3 text-sm"
          placeholder="Write notification message"
        />

        <button
          type="button"
          onClick={sendNotification}
          disabled={sending || loadingUsers}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send to selected user
        </button>
      </section>
    </main>
  );
}
