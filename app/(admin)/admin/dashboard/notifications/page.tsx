"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";

type UserOption = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type BroadcastJob = {
  id: string;
  subject: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  status: string;
  createdAt?: string;
};

const ALL_USERS = "__ALL_USERS__";

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("RoomKhoj");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("/notifications");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);

  const [emailSubject, setEmailSubject] = useState("RoomKhoj Update");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLink, setEmailLink] = useState("https://www.roomkhoj.com");
  const [broadcasting, setBroadcasting] = useState(false);
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    privateApi
      .get("/user", { params: { take: 100, page: 0 } })
      .then((response) => setUsers(response.data?.data || []))
      .catch(() => toast.error("Users load हुन सकेन"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const loadJobs = async (silent = false) => {
    try {
      if (!silent) setLoadingJobs(true);
      const response = await privateApi.get("/notifications/admin/broadcast-email", {
        params: { limit: 20 },
      });
      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch {
      if (!silent) toast.error("Broadcast history load हुन सकेन");
    } finally {
      if (!silent) setLoadingJobs(false);
    }
  };

  useEffect(() => {
    void loadJobs(true);
    const timer = window.setInterval(() => {
      void loadJobs(true);
    }, 3000);
    return () => window.clearInterval(timer);
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
      toast.error("Recipient, title र message राख्नुहोस्");
      return;
    }

    if (userId === ALL_USERS) {
      if (!window.confirm("यो message सबै email भएका RoomKhoj users लाई queue मा पठाउने?")) {
        return;
      }

      try {
        setSending(true);
        const response = await privateApi.post("/notifications/admin/broadcast-email", {
          subject: title.trim(),
          message: message.trim(),
          actionUrl: actionUrl.trim() || undefined,
        });
        const job = response.data as BroadcastJob;
        toast.success(`${job?.total || 0} users को broadcast queue तयार भयो।`);
        setMessage("");
        await loadJobs(true);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "सबै users लाई पठाउन सकेन");
      } finally {
        setSending(false);
      }
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

  async function sendBroadcastEmail() {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Email subject र message राख्नुहोस्");
      return;
    }
    if (!window.confirm("सबै email भएका RoomKhoj users लाई यो email queue मा पठाउने?")) {
      return;
    }

    try {
      setBroadcasting(true);
      const response = await privateApi.post("/notifications/admin/broadcast-email", {
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
        actionUrl: emailLink.trim(),
      });
      const job = response.data as BroadcastJob;
      toast.success(`${job?.total || 0} users को email queue तयार भयो।`);
      setEmailMessage("");
      await loadJobs(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Broadcast email queue गर्न सकेन");
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notify Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Single user notification र सबै users लाई queued email broadcast यहीँबाट पठाउन सकिन्छ।
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-bold">Broadcast Email to All Users</h2>
            <p className="text-xs text-muted-foreground">
              Email भएका सबै users लाई batch/queue मा पठाइन्छ। तल Sent, Failed र Pending live track हुन्छ।
            </p>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium">Email subject</label>
        <input
          value={emailSubject}
          onChange={(event) => setEmailSubject(event.target.value)}
          maxLength={180}
          className="h-11 w-full rounded-xl border px-3 text-sm"
          placeholder="RoomKhoj Update"
        />

        <label className="mb-2 mt-5 block text-sm font-medium">Email message</label>
        <textarea
          value={emailMessage}
          onChange={(event) => setEmailMessage(event.target.value)}
          maxLength={4000}
          rows={7}
          className="w-full rounded-xl border p-3 text-sm"
          placeholder="सबै users लाई पठाउने message लेख्नुहोस्..."
        />

        <label className="mb-2 mt-5 block text-sm font-medium">Open link (optional)</label>
        <input
          value={emailLink}
          onChange={(event) => setEmailLink(event.target.value)}
          maxLength={500}
          className="h-11 w-full rounded-xl border px-3 text-sm"
          placeholder="https://www.roomkhoj.com/jobs"
        />

        <button
          type="button"
          onClick={sendBroadcastEmail}
          disabled={broadcasting}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Send email to all users
        </button>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Broadcast Delivery Tracking</h2>
            <p className="text-xs text-muted-foreground">हरेक broadcast को live queue progress</p>
          </div>
          <button
            type="button"
            onClick={() => void loadJobs()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loadingJobs ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">अहिलेसम्म broadcast email छैन।</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const done = job.sent + job.failed;
              const percent = job.total > 0 ? Math.round((done / job.total) * 100) : 100;
              return (
                <div key={job.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{job.subject || "RoomKhoj Broadcast"}</p>
                      <p className="text-xs text-muted-foreground">{job.status} · {percent}% processed</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Total {job.total}</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-black transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                      <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
                      <b>{job.sent}</b><div className="text-[11px]">Sent</div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 text-red-700">
                      <XCircle className="mx-auto mb-1 h-4 w-4" />
                      <b>{job.failed}</b><div className="text-[11px]">Failed</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                      <Loader2 className={`mx-auto mb-1 h-4 w-4 ${job.pending > 0 ? "animate-spin" : ""}`} />
                      <b>{job.pending}</b><div className="text-[11px]">Pending</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-bold">Send Notification</h2>
        <p className="mb-5 text-xs text-muted-foreground">
          एक जना छान्दा single notification जान्छ। All Users छान्दा सबै email भएका users लाई queued broadcast जान्छ।
        </p>

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
            <option value={ALL_USERS}>🌐 All Users — Email Broadcast</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email || user.phone || user.id}
              </option>
            ))}
          </select>
        )}

        {userId === ALL_USERS && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            All Users selected: Send गर्दा email भएका सबै users लाई queue मा पठाइन्छ र माथिको Delivery Tracking मा progress देखिन्छ।
          </div>
        )}

        <label className="mb-2 mt-5 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          className="h-11 w-full rounded-xl border px-3 text-sm"
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
          />
        </div>

        <button
          type="button"
          onClick={sendNotification}
          disabled={sending || loadingUsers}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {userId === ALL_USERS ? "Send to all users" : "Send notification"}
        </button>
      </section>
    </main>
  );
}
