"use client";

import {
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import {
  Loader2,
  MessageCircle,
  Phone,
  PhoneOff,
  Video,
  Mic,
  MicOff,
  Search,
  Send,
  Image as ImageIcon,
  CheckCheck,
  Sun,
  Moon,
  Smile,
  Camera,
  ChevronLeft,
  Plus,
  WalletCards,
  HandCoins,
} from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChatMessage,
  MessageConversation,
  messageService,
} from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";
import useTokenStore from "@/store";
import { resolveImageUrl } from "@/lib/utils";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const requestedIncomingCallId = searchParams.get("incomingCall");
  const requestedReturnTo = searchParams.get("returnTo");
  const safeReturnTo = requestedReturnTo?.startsWith("/") ? requestedReturnTo : null;

const user = useUserStore(
    (state) => state.user,
  );

  const currentUserId =
    user?.id || "";

  const authToken = useTokenStore(
    (state) => state.token,
  );

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Video-call UI is intentionally client-side: browser camera access stays on the user's device.
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeCallRef = useRef<any>(null);
  const callTimeoutRef = useRef<number | null>(null);
  const pendingIceCandidatesRef = useRef<Array<{ callId: string; candidate: RTCIceCandidateInit }>>([]);
  const [call, setCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [socket, setSocket] =
    useState<Socket | null>(null);

  const [onlineUserIds, setOnlineUserIds] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [conversations, setConversations] =
    useState<MessageConversation[]>([]);

  const [selected, setSelected] =
    useState<MessageConversation | null>(
      null,
    );

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [search, setSearch] =
    useState("");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("roomkhoj:messages-theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  const toggleChatTheme = () => {
    setIsDarkMode((current) => {
      const next = !current;
      localStorage.setItem("roomkhoj:messages-theme", next ? "dark" : "light");
      return next;
    });
  };

  const [phoneResults, setPhoneResults] =
    useState<Array<{
      id: string;
      name: string;
    }>>([]);

  const [phoneSearching, setPhoneSearching] =
    useState(false);

  const [draft, setDraft] =
    useState("");

  const [pendingContextPost, setPendingContextPost] =
    useState<MessageConversation["contextPost"]>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("roomkhoj_room_message_draft");
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.conversationId === requestedConversationId) {
        setDraft(String(pending.text || "Hello, is this still available?"));

        if (pending.room?.id) {
          setPendingContextPost({
            type: "ROOM",
            id: String(pending.room.id),
            title: String(pending.room.title || "Room post"),
            price:
              pending.room.price === null ||
              pending.room.price === undefined
                ? null
                : Number(pending.room.price),
            image: pending.room.images?.[0] || null,
            url: `/property/${pending.room.id}`,
          });
        }

        sessionStorage.removeItem("roomkhoj_room_message_draft");
      }
    } catch {
      sessionStorage.removeItem("roomkhoj_room_message_draft");
    }
  }, [requestedConversationId]);

  const [selectedMedia, setSelectedMedia] =
    useState<File | null>(null);

  const [mediaPreview, setMediaPreview] =
    useState<string | null>(null);

  const [mediaSending, setMediaSending] =
    useState(false);

  const [mediaObjectUrls, setMediaObjectUrls] =
    useState<Record<string, string>>({});

  const mediaInputRef =
    useRef<HTMLInputElement | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const deleteHoldTimerRef =
    useRef<number | null>(null);

  const [deletingMessageId, setDeletingMessageId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
      if (requestedConversationId) {
        const requested = data.find((conversation) => conversation.id === requestedConversationId);
        if (requested) setSelected(requested);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Messages load गर्न सकिएन.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [requestedConversationId]);

  useEffect(() => {
    let cancelled = false;
    const syncConversations = async () => {
      try {
        const data = await messageService.getConversations();
        if (!cancelled) setConversations(data);
      } catch {}
    };
    const intervalId = window.setInterval(syncConversations, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!requestedIncomingCallId) return;
    const raw = sessionStorage.getItem(`roomkhoj:incoming-call:${requestedIncomingCallId}`);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      pendingIceCandidatesRef.current = (Array.isArray(saved.candidates) ? saved.candidates : []).map((candidate: RTCIceCandidateInit) => ({
        callId: String(saved.callId),
        candidate,
      }));
      setIncomingCall({
        callId: String(saved.callId),
        fromUserId: String(saved.fromUserId),
        mode: saved.mode === "video" ? "video" : "audio",
        payload: saved.payload,
      });
    } catch {
      sessionStorage.removeItem(`roomkhoj:incoming-call:${requestedIncomingCallId}`);
    }
  }, [requestedIncomingCallId]);

  useEffect(() => {
    if (!currentUserId) return;
    const nextSocket = io("https://api.roomkhoj.com/messages", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      auth: { token: authToken },
    });

    nextSocket.on("connect", () => {
      nextSocket.emit("join-user", {}, () => {});
    });

    nextSocket.on("presence:snapshot", (users: Array<{userId:string;online:boolean}>) => {
      setOnlineUserIds(() => {
        const next = new Set<string>();
        for (const item of Array.isArray(users) ? users : []) {
          if (item?.online && item?.userId) next.add(String(item.userId));
        }
        return next;
      });
    });

    nextSocket.on("presence:update", (presence: {userId:string;online:boolean}) => {
      const userId = String(presence?.userId || "");
      if (!userId) return;
      setOnlineUserIds((current) => {
        const next = new Set(current);
        presence.online ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    nextSocket.on("message:new", (message: ChatMessage) => {
      if (message?.id && message?.receiverId === currentUserId) {
        nextSocket.emit("message:delivered", { messageId: message.id });
      }
      setSelected((current) => {
        if (current?.id === message.conversationId) {
          setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
          messageService.markSeen(message.conversationId).catch(() => {});
        }
        return current;
      });
      loadConversations();
    });

    nextSocket.on("message:deleted", (payload: {messageId:string;conversationId:string}) => {
      if (!payload?.messageId) return;
      setMessages((prev) => prev.filter((message) => message.id !== payload.messageId));
      loadConversations();
    });

    nextSocket.on("message:seen", (payload: {conversationId:string}) => {
      if (!payload?.conversationId) return;
      setMessages((prev) => prev.map((message) =>
        message.conversationId === payload.conversationId
          ? { ...message, seenAt: message.seenAt || new Date().toISOString() }
          : message,
      ));
    });

    nextSocket.on("message:status", (status) => {
      setMessages((prev) => prev.map((message) =>
        message.id === status.messageId
          ? {
              ...message,
              deliveredAt: status.deliveredAt ?? message.deliveredAt,
              seenAt: status.seenAt ?? message.seenAt,
            }
          : message,
      ));
    });

    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [currentUserId, authToken]);

  useEffect(() => {
    if (!socket || !currentUserId) return;
    const userIds = Array.from(new Set(
      conversations
        .map((conversation) =>
          conversation.otherUser?.id ||
          conversation.otherUserId ||
          (conversation.userOneId === currentUserId ? conversation.userTwoId : conversation.userOneId),
        )
        .filter((id): id is string => Boolean(id) && id !== currentUserId),
    ));
    socket.emit("presence:subscribe", { userIds });
  }, [socket, currentUserId, conversations]);

  const searchByContact = async (options?: {silent?:boolean;query?:string}) => {
    const raw = (options?.query ?? search).trim();
    if (raw.length < 2) return;
    try {
      setPhoneSearching(true);
      const results = await messageService.searchUsersByPhone(raw);
      setPhoneResults(results);
    } finally {
      setPhoneSearching(false);
    }
  };

  const openConversation = async (conversation: MessageConversation) => {
    setSelected(conversation);
    setShowActionMenu(false);
    setMessagesLoading(true);
    try {
      const data = await messageService.getMessages(conversation.id);
      setMessages(data);
      await messageService.markSeen(conversation.id);
      loadConversations();
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    setShowActionMenu(false);
  };

  const removeSelectedMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setSelectedMedia(null);
    setMediaPreview(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const uploadMedia = async () => {
    if (!selected || !selectedMedia || mediaSending) return;
    try {
      setMediaSending(true);
      const message = await messageService.sendMedia(selected.id, selectedMedia);
      setMessages((prev) => [...prev, message]);
      removeSelectedMedia();
      loadConversations();
    } finally {
      setMediaSending(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!selected || !text || sending) return;
    try {
      setSending(true);
      const message = await messageService.sendMessage(selected.id, text);
      setMessages((prev) => [...prev, message]);
      setDraft("");
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const filtered = search.trim() ? [] : conversations;
  const otherUserId = selected?.otherUser?.id || selected?.otherUserId || (selected ? selected.userOneId === currentUserId ? selected.userTwoId : selected.userOneId : "");

  return (
    <>
      <main className={`${isDarkMode ? "dark" : ""} mx-auto h-[calc(100dvh-68px)] max-w-7xl overflow-hidden bg-background text-foreground md:h-screen md:max-w-none md:p-0`}>
        <div className="grid h-full min-h-0 overflow-hidden border border-border bg-background shadow-none md:grid-cols-[390px_1fr] md:border-0 md:bg-card">
          <aside className={`border-r border-border bg-card ${selected ? "hidden md:block" : "block"}`}>
            <div className="border-b border-border bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:bg-muted md:px-4 md:py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[28px] font-black tracking-tight text-foreground md:text-2xl">Chats</h1>
                <button type="button" onClick={toggleChatTheme} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-primary">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") void searchByContact();}} placeholder="Search or start new chat" className="h-11 rounded-[14px] border-0 bg-muted pl-11" />
              </div>
              {phoneSearching && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
              {phoneResults.map((result)=><button key={result.id} onClick={()=>router.push(`/profile/${result.id}`)} className="mt-2 block w-full rounded-xl border p-3 text-left">{result.name}</button>)}
            </div>
            {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
              <div className="divide-y divide-border overflow-y-auto">
                {filtered.map((conversation:any)=><button key={conversation.id} onClick={()=>openConversation(conversation)} className="flex w-full gap-3 px-4 py-3.5 text-left"><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{conversation.otherUser?.name || "RoomKhoj user"}</p>{Number(conversation.unreadCount || 0) > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-primary-foreground">{conversation.unreadCount}</span>}</div><p className="truncate text-sm text-muted-foreground">{conversation.lastMessage?.content || (conversation.lastMessage?.type === "IMAGE" ? "Photo" : conversation.lastMessage?.type === "VIDEO" ? "Video" : conversation.lastMessage?.attachment?.type === "ROOM" ? "Room attachment" : "Start conversation")}</p></div></button>)}
              </div>
            )}
          </aside>

          <section className={`flex min-h-0 flex-col bg-background ${!selected ? "hidden md:flex" : "flex"}`}>
            {!selected ? <div className="flex flex-1 items-center justify-center"><MessageCircle className="h-14 w-14" /></div> : <>
              <header className="flex min-h-[70px] items-center gap-2 border-b border-border bg-card px-2.5 py-2">
                <button type="button" className="md:hidden" onClick={()=>setSelected(null)}><ChevronLeft className="h-7 w-7" /></button>
                <div className="min-w-0 flex-1"><p className="truncate text-[17px] font-bold">{selected.otherUser?.name || "RoomKhoj user"}</p><p className="text-xs text-muted-foreground">{onlineUserIds.has(otherUserId) ? "online" : "offline"}</p></div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-background px-2.5 py-3 pb-28">
                {messagesLoading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : messages.map((message)=>{
                  const mine = message.senderId === currentUserId;
                  const deliveryLabel = message.seenAt ? "Seen" : message.deliveredAt ? "Delivered" : "Sent";
                  return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                    {message.attachment?.type === "ROOM" && <button type="button" onClick={()=>router.push(message.attachment!.url)} className="mb-2 block w-full overflow-hidden rounded-xl border border-border bg-background/80 text-left text-foreground">{message.attachment.image && <img src={resolveImageUrl(message.attachment.image)} alt="" className="h-32 w-full object-cover" />}<div className="p-2.5"><p className="text-[10px] font-semibold uppercase opacity-70">Room</p><p className="font-semibold">{message.attachment.title}</p><p className="text-xs opacity-80">Rs. {Number(message.attachment.price || 0).toLocaleString()}</p></div></button>}
                    {message.mediaUrl && message.type === "VIDEO" && <video src={resolveImageUrl(message.mediaUrl)} controls playsInline className="mb-2 max-h-72 w-full rounded-xl" />}
                    {message.mediaUrl && message.type === "IMAGE" && <img src={resolveImageUrl(message.mediaUrl)} alt="" className="mb-2 max-h-72 w-full rounded-xl object-cover" />}
                    {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75"><span>{new Date(message.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>{mine && <><CheckCheck className={`h-3.5 w-3.5 ${message.seenAt ? "text-sky-200" : ""}`} /><span className="font-medium">{deliveryLabel}</span></>}</div>
                  </div></div>;
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedMedia && mediaPreview && <div className="border-t border-border bg-card p-3"><div className="flex items-center gap-3">{selectedMedia.type.startsWith("video/") ? <video src={mediaPreview} className="h-16 w-16 rounded-lg object-cover" /> : <img src={mediaPreview} alt="" className="h-16 w-16 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedMedia.name}</p></div><Button variant="ghost" onClick={removeSelectedMedia}>Remove</Button><Button onClick={()=>void uploadMedia()} disabled={mediaSending}>{mediaSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}</Button></div></div>}

              <div className="relative border-t border-border bg-card px-2.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:px-4 md:py-3">
                {showActionMenu && (
                  <div className="absolute bottom-[68px] left-2.5 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl md:left-4">
                    <button type="button" onClick={()=>{setShowActionMenu(false); mediaInputRef.current?.click();}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ImageIcon className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Photo / Video</p><p className="text-xs text-muted-foreground">Send media</p></div></button>
                    <button type="button" onClick={()=>{setShowActionMenu(false); toast.info("Payment request will open here");}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><HandCoins className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Request Payment</p><p className="text-xs text-muted-foreground">Ask this user to pay</p></div></button>
                    <button type="button" onClick={()=>{setShowActionMenu(false); router.push("/user/dashboard/wallet");}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><WalletCards className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Wallet / Release</p><p className="text-xs text-muted-foreground">Balance and release request</p></div></button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button type="button" onClick={()=>setShowActionMenu((current)=>!current)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted ${showActionMenu ? "rotate-45" : ""}`} aria-label="Open chat services"><Plus className="h-6 w-6" /></button>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} />
                  <div className="flex min-h-11 flex-1 items-center rounded-[22px] bg-muted px-3"><textarea value={draft} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendMessage();}}} placeholder="Type a message" rows={1} className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-2 text-sm outline-none" /><Smile className="h-5 w-5 text-muted-foreground" /></div>
                  <Button type="button" size="icon" className="h-11 w-11 rounded-full" onClick={()=>void sendMessage()} disabled={!draft.trim() || sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                </div>
              </div>
            </>}
          </section>
        </div>
      </main>
    </>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}><MessagesContent /></Suspense>;
}
