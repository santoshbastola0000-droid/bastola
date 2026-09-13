"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Link2,
  Loader2,
  Mail,
  MousePointerClick,
  Percent,
  RefreshCw,
  Search,
  Send,
  UsersRound,
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
  clicked?: number;
  ctr?: number;
  status: string;
  createdAt?: string;
};

type ClickAnalytics = {
  summary: {
    sent: number;
    clicked: number;
    uniqueClickers: number;
    ctr: number;
    lastClickedAt?: string | null;
  };
  channels: Record<
    "EMAIL" | "PUSH",
    { sent: number; clicked: number; ctr: number }
  >;
  recentClicks: Array<{
    id: string;
    userId: string;
    channel: string;
    kind?: string | null;
    title: string;
    destinationUrl?: string | null;
    sentAt?: string;
    clickedAt?: string | null;
  }>;
};

const ALL_USERS = "__ALL_USERS__";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

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
  const [analytics, setAnalytics] = useState<ClickAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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

  const loadAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoadingAnalytics(true);
      const response = await privateApi.get("/notifications/admin/click-analytics", {
        params: { limit: 30 },
      });
      setAnalytics(response.data || null);
    } catch {
      if (!silent) toast.error("Notification click analytics load हुन सकेन");
    } finally {
      if (!silent) setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    void loadJobs(true);
    void loadAnalytics(true);
    const timer = window.setInterval(() => {
      void loadJobs(true);
      void loadAnalytics(true);
    }, 5000);
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
        await Promise.all([loadJobs(true), loadAnalytics(true)]);
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
      await loadAnalytics(true);
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
      await Promise.all([loadJobs(true), loadAnalytics(true)]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Broadcast email queue गर्न सकेन");
    } finally {
      setBroadcasting(false);
    }
  }

  const summary = analytics?.summary;
  const emailStats = analytics?.channels?.EMAIL;
  const pushStats = analytics?.channels?.PUSH;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notify Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Notifications पठाउनुहोस् र users ले कति click गरे live monitor गर्नुहोस्।
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void Promise.all([loadAnalytics(), loadJobs()])}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loadingAnalytics || loadingJobs ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Notification Click Analytics</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Email र push notification खोल्ने users को tracking. CTR = Clicks ÷ delivered notifications.
            </p>
          </div>
          {summary?.lastClickedAt ? (
            <span className="text-right text-[11px] text-muted-foreground">
              Last click<br />{formatDate(summary.lastClickedAt)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border bg-slate-50 p-4">
            <Bell className="mb-2 h-4 w-4 text-slate-600" />
            <div className="text-2xl font-bold">{summary?.sent ?? 0}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </div>
          <div className="rounded-xl border bg-blue-50 p-4">
            <MousePointerClick className="mb-2 h-4 w-4 text-blue-700" />
            <div className="text-2xl font-bold text-blue-800">{summary?.clicked ?? 0}</div>
            <div className="text-xs text-blue-700">Total clicks</div>
          </div>
          <div className="rounded-xl border bg-emerald-50 p-4">
            <UsersRound className="mb-2 h-4 w-4 text-emerald-700" />
            <div className="text-2xl font-bold text-emerald-800">{summary?.uniqueClickers ?? 0}</div>
            <div className="text-xs text-emerald-700">Users clicked</div>
          </div>
          <div className="rounded-xl border bg-violet-50 p-4">
            <Percent className="mb-2 h-4 w-4 text-violet-700" />
            <div className="text-2xl font-bold text-violet-800">{Number(summary?.ctr || 0).toFixed(1)}%</div>
            <div className="text-xs text-violet-700">Click-through rate</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4" /> Push
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-slate-50 p-2"><b>{pushStats?.sent ?? 0}</b><div className="text-[11px] text-muted-foreground">Delivered</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><b>{pushStats?.clicked ?? 0}</b><div className="text-[11px] text-muted-foreground">Clicked</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><b>{Number(pushStats?.ctr || 0).toFixed(1)}%</b><div className="text-[11px] text-muted-foreground">CTR</div></div>
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4" /> Email
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-slate-50 p-2"><b>{emailStats?.sent ?? 0}</b><div className="text-[11px] text-muted-foreground">Sent</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><b>{emailStats?.clicked ?? 0}</b><div className="text-[11px] text-muted-foreground">Clicked</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><b>{Number(emailStats?.ctr || 0).toFixed(1)}%</b><div className="text-[11px] text-muted-foreground">CTR</div></div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold">Recent notification clicks</h3>
          {!analytics?.recentClicks?.length ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">
              अहिलेसम्म tracked notification click छैन। नयाँ push/email बाट click भएपछि यहाँ देखिन्छ।
            </p>
          ) : (
            <div className="divide-y overflow-hidden rounded-xl border">
              {analytics.recentClicks.slice(0, 10).map((click) => (
                <div key={click.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{click.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {click.channel} · User {click.userId.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="font-medium text-emerald-700">Clicked</div>
                    <div>{formatDate(click.clickedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-bold">Broadcast Email to All Users</h2>
            <p className="text-xs text-muted-foreground">
              Email भएका सबै users लाई batch/queue मा पठाइन्छ। Sent, Failed, Pending र Clicked live track हुन्छ।
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
            <h2 className="font-bold">Broadcast Delivery & Click Tracking</h2>
            <p className="text-xs text-muted-foreground">हरेक broadcast को queue progress र click rate</p>
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

                  <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-5">
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
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                      <MousePointerClick className="mx-auto mb-1 h-4 w-4" />
                      <b>{job.clicked ?? 0}</b><div className="text-[11px]">Clicked</div>
                    </div>
                    <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                      <Percent className="mx-auto mb-1 h-4 w-4" />
                      <b>{Number(job.ctr || 0).toFixed(1)}%</b><div className="text-[11px]">CTR</div>
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
            All Users selected: Send गर्दा email भएका सबै users लाई queue मा पठाइन्छ र माथिको tracking मा delivery/click progress देखिन्छ।
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
