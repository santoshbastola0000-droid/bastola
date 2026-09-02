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
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  Sun,
  Moon,
  Smile,
  Camera,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaymentActions } from "@/components/messages/PaymentActions";
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

  const user = useUserStore((state) => state.user);
  const currentUserId = user?.id || "";
  const authToken = useTokenStore((state) => state.token);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeCallRef = useRef<any>(null);
  const callTimeoutRef = useRef<number | null>(null);
  const pendingIceCandidatesRef = useRef<Array<{ callId: string; candidate: RTCIceCandidateInit }>>([]);
  const [call, setCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [selected, setSelected] = useState<MessageConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [phoneResults, setPhoneResults] = useState<Array<{ id: string; name: string }>>([]);
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingContextPost, setPendingContextPost] = useState<MessageConversation["contextPost"]>(null);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaSending, setMediaSending] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const deleteHoldTimerRef = useRef<number | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
            price: pending.room.price == null ? null : Number(pending.room.price),
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
    void loadConversations();
  }, [requestedConversationId]);

  useEffect(() => {
    if (!currentUserId) return;
    const nextSocket = io("https://api.roomkhoj.com/messages", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      auth: { token: authToken },
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
      void loadConversations();
    });

    nextSocket.on("message:deleted", (payload: { messageId: string }) => {
      if (!payload?.messageId) return;
      setMessages((prev) => prev.filter((message) => message.id !== payload.messageId));
      void loadConversations();
    });

    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [currentUserId, authToken]);

  const openConversation = async (conversation: MessageConversation) => {
    setSelected(conversation);
    setMessagesLoading(true);
    try {
      const data = await messageService.getMessages(conversation.id);
      setMessages(data);
      await messageService.markSeen(conversation.id);
      void loadConversations();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Conversation load गर्न सकिएन.");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Photo वा video मात्र select गर्नुहोस्.");
      e.target.value = "";
      return;
    }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    setShowPlusMenu(false);
  };

  const uploadMedia = async () => {
    if (!selected || !selectedMedia || mediaSending) return;
    try {
      setMediaSending(true);
      const message = await messageService.sendMedia(selected.id, selectedMedia);
      setMessages((prev) => [...prev, message]);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setSelectedMedia(null);
      setMediaPreview(null);
      void loadConversations();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Media send गर्न सकिएन.");
    } finally {
      setMediaSending(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!selected || !text || sending) return;
    try {
      setSending(true);
      const contextPost = selected.contextPost || (selected.id === requestedConversationId ? pendingContextPost : null);
      const roomAttachmentId = contextPost?.type === "ROOM" ? contextPost.id : undefined;
      const message = await messageService.sendMessage(selected.id, text, roomAttachmentId);
      setMessages((prev) => [...prev, message]);
      setDraft("");
      void loadConversations();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Message send गर्न सकिएन.");
    } finally {
      setSending(false);
    }
  };

  const clearDeleteHoldTimer = () => {
    if (deleteHoldTimerRef.current !== null) {
      window.clearTimeout(deleteHoldTimerRef.current);
      deleteHoldTimerRef.current = null;
    }
  };

  const startDeleteHold = (message: ChatMessage) => {
    if (message.senderId !== currentUserId) return;
    clearDeleteHoldTimer();
    deleteHoldTimerRef.current = window.setTimeout(async () => {
      try {
        setDeletingMessageId(message.id);
        await messageService.deleteMessage(message.id);
        setMessages((prev) => prev.filter((item) => item.id !== message.id));
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Message delete गर्न सकिएन.");
      } finally {
        setDeletingMessageId(null);
      }
    }, 650);
  };

  const filtered = search.trim() ? [] : conversations;
  const otherUserId = selected?.otherUser?.id || selected?.otherUserId || (selected ? (selected.userOneId === currentUserId ? selected.userTwoId : selected.userOneId) : "");
  const contextPost = selected?.contextPost || (selected?.id === requestedConversationId ? pendingContextPost : null);

  return (
    <main className={`${isDarkMode ? "dark" : ""} mx-auto h-[calc(100dvh-68px)] max-w-7xl overflow-hidden bg-background text-foreground md:h-screen md:max-w-none`}>
      <div className="grid h-full min-h-0 overflow-hidden border border-border bg-background md:grid-cols-[390px_1fr] md:border-0 md:bg-card">
        <aside className={`border-r border-border bg-card ${selected ? "hidden md:block" : "block"}`}>
          <div className="border-b border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black">Chats</h1>
              <button type="button" onClick={toggleChatTheme} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or start new chat" className="pl-11" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No conversations yet</div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto">
              {filtered.map((conversation) => (
                <button key={conversation.id} type="button" onClick={() => void openConversation(conversation)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-semibold">{(conversation.otherUser?.name || "U").slice(0,2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{conversation.otherUser?.name || "RoomKhoj user"}</p>
                    <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage?.content || "Start conversation"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={`flex min-h-0 flex-col bg-background ${!selected ? "hidden md:flex" : "flex"}`}>
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
                <button type="button" className="md:hidden" onClick={() => setSelected(null)}><ChevronLeft className="h-7 w-7" /></button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted font-bold">{(selected.otherUser?.name || "U").slice(0,2).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{selected.otherUser?.name || "RoomKhoj user"}</p></div>
              </header>

              {contextPost && (
                <div className="border-b border-border bg-card px-3 py-2">
                  <button type="button" onClick={() => router.push(contextPost.url)} className="w-full rounded-xl border border-border bg-muted p-3 text-left">
                    <p className="text-xs uppercase text-muted-foreground">{contextPost.type === "ROOM" ? "Room post" : "Job post"}</p>
                    <p className="font-semibold">{contextPost.title}</p>
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 pb-28">
                {messagesLoading ? (
                  <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : messages.map((message) => {
                  const mine = message.senderId === currentUserId;
                  const isPayment = ["PAYMENT_REQUEST","PAYMENT_CONFIRM","RELEASE_REQUEST"].includes(message.type);
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div onPointerDown={() => startDeleteHold(message)} onPointerUp={clearDeleteHoldTimer} onPointerLeave={clearDeleteHoldTimer} className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
                        {isPayment && (
                          <div className="mb-2 rounded-xl border border-current/20 bg-background/10 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                              {message.type === "PAYMENT_REQUEST" ? "Payment request" : message.type === "PAYMENT_CONFIRM" ? "Payment confirmation" : "Release request"}
                            </p>
                          </div>
                        )}
                        {message.attachment?.type === "ROOM" && message.attachment.url && (
                          <button type="button" onClick={() => router.push(message.attachment!.url!)} className="mb-2 block w-full rounded-xl border border-border bg-background/70 p-2 text-left">
                            <p className="font-semibold">{message.attachment.title}</p>
                            <p className="text-xs opacity-80">रु {Number(message.attachment.price).toLocaleString()}</p>
                          </button>
                        )}
                        {message.mediaUrl && (message.type === "VIDEO" ? <video src={resolveImageUrl(message.mediaUrl)} controls className="mb-2 max-h-72 rounded-xl" /> : <img src={resolveImageUrl(message.mediaUrl)} alt="" className="mb-2 max-h-72 rounded-xl object-cover" />)}
                        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70"><span>{new Date(message.createdAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span>{mine && <CheckCheck className="h-3.5 w-3.5" />}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedMedia && mediaPreview && (
                <div className="border-t border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    {selectedMedia.type.startsWith("video/") ? <video src={mediaPreview} className="h-16 w-16 rounded-lg object-cover" /> : <img src={mediaPreview} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1"><p className="truncate text-sm">{selectedMedia.name}</p></div>
                    <Button onClick={() => void uploadMedia()} disabled={mediaSending}>{mediaSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}</Button>
                  </div>
                </div>
              )}

              <div className="relative border-t border-border bg-card px-2.5 py-2">
                {showPlusMenu && (
                  <div className="absolute bottom-16 left-2 z-30 w-72 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-2xl">
                    <button type="button" onClick={() => mediaInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">
                      <Paperclip className="h-5 w-5 text-primary" /> Photo / video
                    </button>
                    <PaymentActions
                      conversationId={selected.id}
                      onSent={(message) => {
                        setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
                        setShowPlusMenu(false);
                        void loadConversations();
                      }}
                    />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button type="button" onClick={() => setShowPlusMenu((value) => !value)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-muted" aria-label="More actions">
                    <Plus className="h-6 w-6" />
                  </button>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} />
                  <div className="flex min-h-11 flex-1 items-center rounded-[22px] bg-muted px-3">
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Type a message" rows={1} className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Button type="button" size="icon" className="h-11 w-11 rounded-full" onClick={() => void sendMessage()} disabled={!draft.trim() || sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
