"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { privateApi } from "@/http/api/privateApi";
import type { ChatMessage } from "@/http/services/message.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Thread = {
  conversationId: string; botId: string; botName: string; botEnabled: boolean;
  userId: string; userName: string; lastMessage: string; lastMessageType: string;
  lastSenderId: string; lastMessageAt: string;
};
type InboxPage = { items: Thread[]; nextPage: number | null };
type MessagePage = { items: ChatMessage[]; nextBeforeId: string | null };
const endpoint = "/message/admin/bot-inbox";
const date = (value: string) => new Date(value).toLocaleString();

function Conversation({ thread }: { thread: Thread }) {
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const base = `${endpoint}/${thread.botId}/${thread.conversationId}`;
  const key = ["bot-inbox-messages", thread.botId, thread.conversationId];
  const history = useInfiniteQuery({
    queryKey: key,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<MessagePage> =>
      (await privateApi.get(`${base}/messages`, { params: { beforeId: pageParam } })).data,
    getNextPageParam: (last) => last.nextBeforeId ?? undefined,
    refetchInterval: 5000,
  });
  const reply = useMutation({
    mutationFn: async (content: string) => (await privateApi.post(`${base}/messages`, { content })).data,
    onSuccess: () => {
      setDraft("");
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ["bot-inbox"] });
    },
    onError: () => toast.error("Reply पठाउन सकिएन। Message सुरक्षित छ, फेरि प्रयास गर्नुहोस्।"),
  });
  const download = async (message: ChatMessage) => {
    setDownloading(message.id);
    try {
      const res = await privateApi.get(`${base}/media/${message.id}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = message.mediaOriginalName || "attachment";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Attachment download गर्न सकिएन।");
    } finally {
      setDownloading(null);
    }
  };
  const messages = [...new Map((history.data?.pages.flatMap((p) => p.items) || []).map((m) => [m.id, m])).values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

  return (
    <section className="flex min-w-0 flex-col rounded-xl border bg-background" aria-label="Bot conversation">
      <header className="border-b p-4">
        <h2 className="font-semibold">{thread.botName} <span className="text-xs text-muted-foreground">Bot</span></h2>
        <p className="text-sm text-muted-foreground">कुराकानी: {thread.userName}</p>
        {!thread.botEnabled && <p className="mt-1 text-sm text-amber-700">Bot paused छ। पुराना messages हेर्न मिल्छ; reply गर्न bot enable गर्नुहोस्।</p>}
      </header>
      <div className="h-[480px] space-y-3 overflow-y-auto p-4" aria-label="Messages">
        {history.hasNextPage && <Button variant="outline" size="sm" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>पुराना messages हेर्नुहोस्</Button>}
        {history.isPending && <p role="status">Messages loading…</p>}
        {history.isError && <div role="alert">Messages load भएन। <Button variant="outline" onClick={() => void history.refetch()}>Retry</Button></div>}
        {!history.isPending && !history.isError && messages.length === 0 && <p>No messages yet.</p>}
        {messages.map((message) => (
          <article key={message.id} className={`max-w-[92%] rounded-xl p-3 ${message.senderId === thread.botId ? "ml-auto bg-primary/10" : "bg-muted"}`}>
            <p className="mb-1 text-xs font-semibold">{message.senderId === thread.botId ? thread.botName : message.senderId === thread.userId ? thread.userName : "RoomKhoj Admin"}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            {message.mediaUrl && message.type !== "ROOM" && <Button size="sm" variant="outline" className="mt-2 max-w-full" disabled={downloading === message.id} onClick={() => void download(message)}><span className="truncate">{downloading === message.id ? "Downloading…" : message.mediaOriginalName || "Download attachment"}</span></Button>}
            {message.attachment?.type === "ROOM" && <p className="mt-1 text-sm">Room: {message.attachment.title}</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">{date(message.createdAt)}</p>
          </article>
        ))}
      </div>
      <form className="space-y-2 border-t p-4" onSubmit={(event) => { event.preventDefault(); if (draft.trim() && !reply.isPending && thread.botEnabled) reply.mutate(draft.trim()); }}>
        <label htmlFor="bot-reply" className="text-sm font-medium">Reply to {thread.userName}</label>
        <textarea id="bot-reply" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4500} disabled={reply.isPending || !thread.botEnabled} placeholder="Message लेख्नुहोस्…" />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">User लाई “RoomKhoj Admin · {thread.botName}” भनेर reply देखिन्छ।</p>
          <Button type="submit" disabled={!draft.trim() || reply.isPending || !thread.botEnabled}>{reply.isPending ? "Sending…" : "Send reply"}</Button>
        </div>
      </form>
    </section>
  );
}

export function BotInbox() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Thread | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const inbox = useQuery({
    queryKey: ["bot-inbox", query, page],
    queryFn: async (): Promise<InboxPage> => (await privateApi.get(endpoint, { params: { q: query, page } })).data,
    refetchInterval: 5000,
  });
  const active = inbox.data?.items.find((t) => t.botId === selected?.botId && t.conversationId === selected?.conversationId) || selected;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
      <section className="rounded-xl border bg-background p-3" aria-label="All bot conversations">
        <Input aria-label="Search bot or sender name" placeholder="Bot वा user को नाम खोज्नुहोस्" value={search} onChange={(e) => setSearch(e.target.value)} />
        {inbox.isPending && <p className="p-4" role="status">Inbox loading…</p>}
        {inbox.isError && <div className="p-4 text-sm" role="alert">Inbox load भएन। Backend update भएको छ कि जाँच्नुहोस्। <Button variant="outline" onClick={() => void inbox.refetch()}>Retry</Button></div>}
        {!inbox.isPending && !inbox.isError && !inbox.data?.items.length && <p className="p-4 text-sm text-muted-foreground">{query ? "मिल्दो conversation भेटिएन।" : "Bot लाई आएका messages यहाँ देखिन्छन्।"}</p>}
        <div className="mt-3 max-h-[570px] space-y-2 overflow-y-auto">
          {inbox.data?.items.map((thread) => (
            <button type="button" key={`${thread.botId}:${thread.conversationId}`} aria-pressed={active?.botId === thread.botId && active?.conversationId === thread.conversationId} className="block w-full rounded-lg border p-3 text-left hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/5" onClick={() => setSelected(thread)}>
              <p className="font-semibold">{thread.botName} <span className="text-xs font-normal text-muted-foreground">Bot</span></p>
              <p className="text-sm">{thread.userName}</p>
              <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{thread.lastSenderId === thread.botId ? "Reply: " : "Message: "}{thread.lastMessage || `[${thread.lastMessageType}]`}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{date(thread.lastMessageAt)}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button size="sm" variant="outline" disabled={page === 0 || inbox.isFetching} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-xs">Page {page + 1}</span>
          <Button size="sm" variant="outline" disabled={inbox.data?.nextPage == null || inbox.isFetching} onClick={() => setPage(inbox.data!.nextPage!)}>Next</Button>
        </div>
      </section>
      {active ? <Conversation key={`${active.botId}:${active.conversationId}`} thread={active} /> : <div className="flex min-h-72 items-center justify-center rounded-xl border p-6 text-center text-muted-foreground">Messages हेर्न र reply गर्न conversation छान्नुहोस्।</div>}
    </div>
  );
}
