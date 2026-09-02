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
  Trash2,
  RotateCcw,
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

  const [showPaymentRequestForm, setShowPaymentRequestForm] =
    useState(false);
  const [paymentAmount, setPaymentAmount] =
    useState("");
  const [paymentNote, setPaymentNote] =
    useState("");
  const [paymentRequestClientId, setPaymentRequestClientId] =
    useState<string | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] =
    useState<string | null>(null);
  const [releaseStatus, setReleaseStatus] =
    useState<{
      pendingBalance: number;
      requestedAt: string | null;
      status: "PENDING" | "RELEASED" | "CANCELLED" | null;
    } | null>(null);
  const [releaseLoading, setReleaseLoading] =
    useState(false);

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

  const [messageSearchResults, setMessageSearchResults] =
    useState<Array<{
      id: string;
      conversationId: string;
      content: string;
      createdAt: string;
      otherUser: {
        id: string;
        name: string;
      } | null;
    }>>([]);

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

  const [mediaClientMessageId, setMediaClientMessageId] =
    useState<string | null>(null);

  const [mediaObjectUrls, setMediaObjectUrls] =
    useState<Record<string, string>>({});

  const mediaObjectUrlsRef =
    useRef<string[]>([]);

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

  const [failedSend, setFailedSend] =
    useState<{
      conversationId: string;
      text: string;
      roomId?: string;
      clientMessageId: string;
    } | null>(null);

  const loadConversations = async (
    options?: { background?: boolean },
  ) => {
    const background =
      options?.background === true;

    try {
      if (!background) {
        setLoading(true);
      }

      const data =
        await messageService
          .getConversations();

      setConversations(data);

      if (requestedConversationId) {
        const requested =
          data.find(
            (conversation) =>
              conversation.id ===
              requestedConversationId,
          );

        if (requested) {
          setSelected(requested);
        }
      }
    } catch (error: any) {
      if (!background) {
        toast.error(
          error?.response?.data?.message ||
          "Messages load गर्न सकिएन.",
        );
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadConversations();
  }, [requestedConversationId]);

  useEffect(() => {
    const refresh =
      () => void loadConversations({
        background: true,
      });

    const onVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refresh();
      }
    };

    window.addEventListener(
      "focus",
      refresh,
    );
    document.addEventListener(
      "visibilitychange",
      onVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "focus",
        refresh,
      );
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );
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
      loadConversations({ background: true });
    });

    nextSocket.on("message:deleted", (payload: {messageId:string;conversationId:string}) => {
      if (!payload?.messageId) return;
      setMessages((prev) => prev.filter((message) => message.id !== payload.messageId));
      loadConversations({ background: true });
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
              paymentStatus: status.paymentStatus ?? message.paymentStatus,
              paymentCompletedAt: status.paymentCompletedAt ?? message.paymentCompletedAt,
              paymentTransactionId: status.paymentTransactionId ?? message.paymentTransactionId,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messagesLoading ? "auto" : "smooth",
      block: "end",
    });
  }, [messages.length, selected?.id, messagesLoading]);

  useEffect(() => {
    let cancelled = false;

    const loadProtectedMedia =
      async () => {
        const mediaMessages =
          messages.filter(
            (message) =>
              (message.type === "IMAGE" ||
                message.type === "VIDEO") &&
              message.mediaUrl &&
              !mediaObjectUrls[
                message.id
              ],
          );

        for (const message of mediaMessages) {
          try {
            const blob =
              await messageService
                .getMediaBlob(
                  message.id,
                );

            if (cancelled) return;

            const url =
              URL.createObjectURL(blob);

            mediaObjectUrlsRef.current.push(
              url,
            );

            setMediaObjectUrls(
              (current) => ({
                ...current,
                [message.id]: url,
              }),
            );
          } catch {}
        }
      };

    void loadProtectedMedia();

    return () => {
      cancelled = true;
    };
  }, [messages, mediaObjectUrls]);

  useEffect(() => {
    return () => {
      mediaObjectUrlsRef.current
        .forEach(
          (url) =>
            URL.revokeObjectURL(url),
        );
      mediaObjectUrlsRef.current =
        [];
    };
  }, []);

  const runSearch = async (
    rawValue?: string,
  ) => {
    const raw =
      String(rawValue ?? search)
        .trim();

    if (raw.length < 2) {
      setPhoneResults([]);
      setMessageSearchResults([]);
      return;
    }

    try {
      setPhoneSearching(true);

      const [usersResult, messagesResult] =
        await Promise.allSettled([
          messageService
            .searchUsersByPhone(raw),
          messageService
            .searchMessages(raw),
        ]);

      setPhoneResults(
        usersResult.status === "fulfilled"
          ? usersResult.value
          : [],
      );

      setMessageSearchResults(
        messagesResult.status === "fulfilled"
          ? messagesResult.value
          : [],
      );
    } finally {
      setPhoneSearching(false);
    }
  };

  useEffect(() => {
    const raw = search.trim();

    if (raw.length < 2) {
      setPhoneResults([]);
      setMessageSearchResults([]);
      return;
    }

    const timer =
      window.setTimeout(
        () => void runSearch(raw),
        300,
      );

    return () =>
      window.clearTimeout(timer);
  }, [search]);

  const openConversation = async (conversation: MessageConversation) => {
    setSelected(conversation);
    setShowActionMenu(false);
    setMessagesLoading(true);
    try {
      const data = await messageService.getMessages(conversation.id);
      setMessages(data);
      await messageService.markSeen(conversation.id);
      loadConversations({ background: true });
    } finally {
      setMessagesLoading(false);
    }
  };

  const openMessageSearchResult = async (
    result: {
      conversationId: string;
    },
  ) => {
    let conversation =
      conversations.find(
        (item) =>
          item.id ===
          result.conversationId,
      );

    if (!conversation) {
      try {
        const refreshed =
          await messageService
            .getConversations();

        setConversations(refreshed);

        conversation =
          refreshed.find(
            (item) =>
              item.id ===
              result.conversationId,
          );
      } catch {}
    }

    if (conversation) {
      setSearch("");
      await openConversation(
        conversation,
      );
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const isImage =
      file.type.startsWith("image/");
    const isVideo =
      file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error(
        "Photo वा video file मात्र पठाउन मिल्छ।",
      );
      return;
    }

    if (
      file.size >
      25 * 1024 * 1024
    ) {
      toast.error(
        "Media file 25 MB भन्दा सानो राख्नुहोस्।",
      );
      return;
    }

    if (mediaPreview) {
      URL.revokeObjectURL(
        mediaPreview,
      );
    }

    setSelectedMedia(file);
    setMediaPreview(
      URL.createObjectURL(file),
    );
    setMediaClientMessageId(
      crypto.randomUUID(),
    );
    setShowActionMenu(false);
  };

  const removeSelectedMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaClientMessageId(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const uploadMedia = async () => {
    if (
      !selected ||
      !selectedMedia ||
      mediaSending
    ) {
      return;
    }

    const clientMessageId =
      mediaClientMessageId ||
      crypto.randomUUID();

    if (!mediaClientMessageId) {
      setMediaClientMessageId(
        clientMessageId,
      );
    }

    try {
      setMediaSending(true);

      const message =
        await messageService
          .sendMedia(
            selected.id,
            selectedMedia,
            undefined,
            clientMessageId,
          );

      setMessages((prev) =>
        prev.some(
          (item) =>
            item.id === message.id,
        )
          ? prev
          : [...prev, message],
      );

      removeSelectedMedia();
      void loadConversations({ background: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Media पठाउन सकिएन। फेरि Send थिच्नुहोस्।",
      );
    } finally {
      setMediaSending(false);
    }
  };

  const sendMessage = async (
    retry?: {
      conversationId: string;
      text: string;
      roomId?: string;
      clientMessageId: string;
    },
  ) => {
    const conversationId =
      retry?.conversationId ||
      selected?.id ||
      "";

    const text =
      retry?.text ||
      draft.trim();

    const roomId =
      retry?.roomId ||
      (pendingContextPost?.type === "ROOM"
        ? pendingContextPost.id
        : undefined);

    if (
      !conversationId ||
      !text ||
      sending
    ) {
      return;
    }

    const clientMessageId =
      retry?.clientMessageId ||
      crypto.randomUUID();

    try {
      setSending(true);

      const message =
        await messageService
          .sendMessage(
            conversationId,
            text,
            roomId,
            clientMessageId,
          );

      setMessages((prev) =>
        prev.some(
          (item) =>
            item.id === message.id,
        )
          ? prev
          : [...prev, message],
      );

      setDraft("");
      setPendingContextPost(null);
      setFailedSend(null);
      void loadConversations({ background: true });
    } catch (error: any) {
      setFailedSend({
        conversationId,
        text,
        roomId,
        clientMessageId,
      });

      toast.error(
        error?.response?.data
          ?.message ||
          "Message पठाउन सकिएन। Retry गर्नुहोस्।",
      );
    } finally {
      setSending(false);
    }
  };

  const submitPaymentRequest =
    async () => {
      if (!selected) return;

      const amount =
        Number(paymentAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        toast.error(
          "Valid payment amount राख्नुहोस्।",
        );
        return;
      }

      const requestClientId =
        paymentRequestClientId ||
        crypto.randomUUID();

      if (!paymentRequestClientId) {
        setPaymentRequestClientId(
          requestClientId,
        );
      }

      try {
        setPaymentActionLoading(
          "create",
        );

        const message =
          await messageService
            .createPaymentRequest(
              selected.id,
              amount,
              paymentNote,
              requestClientId,
            );

        setMessages((prev) =>
          prev.some(
            (item) =>
              item.id === message.id,
          )
            ? prev
            : [...prev, message],
        );

        setShowPaymentRequestForm(
          false,
        );
        setPaymentAmount("");
        setPaymentNote("");
        setPaymentRequestClientId(null);
        void loadConversations({
          background: true,
        });
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
          "Payment request पठाउन सकिएन।",
        );
      } finally {
        setPaymentActionLoading(
          null,
        );
      }
    };

  const payRequest = async (
    message: ChatMessage,
  ) => {
    const amount =
      Number(
        message.paymentAmount || 0,
      );

    const confirmed =
      window.confirm(
        `Rs. ${amount.toLocaleString()} wallet बाट pay गर्ने?`,
      );

    if (!confirmed) return;

    try {
      setPaymentActionLoading(
        message.id,
      );

      const result =
        await messageService
          .payPaymentRequest(
            message.id,
          );

      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? result.message
            : item,
        ),
      );

      toast.success(
        result.alreadyPaid
          ? "यो payment पहिले नै complete भइसकेको छ।"
          : "Payment complete भयो।",
      );

      void loadConversations({
        background: true,
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
        "Payment complete गर्न सकिएन।",
      );
    } finally {
      setPaymentActionLoading(
        null,
      );
    }
  };

  const cancelPaymentRequest =
    async (
      message: ChatMessage,
    ) => {
      const confirmed =
        window.confirm(
          "यो payment request cancel गर्ने?",
        );

      if (!confirmed) return;

      try {
        setPaymentActionLoading(
          message.id,
        );

        const updated =
          await messageService
            .cancelPaymentRequest(
              message.id,
            );

        setMessages((prev) =>
          prev.map((item) =>
            item.id ===
            updated.id
              ? updated
              : item,
          ),
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
          "Payment request cancel गर्न सकिएन।",
        );
      } finally {
        setPaymentActionLoading(
          null,
        );
      }
    };

  const openReleaseRequest =
    async () => {
      setShowActionMenu(false);

      try {
        setReleaseLoading(true);

        const status =
          await messageService
            .getPendingBalanceReleaseStatus();

        setReleaseStatus(status);
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
          "Pending balance status load गर्न सकिएन।",
        );
      } finally {
        setReleaseLoading(false);
      }
    };

  const submitReleaseRequest =
    async () => {
      try {
        setReleaseLoading(true);

        const result =
          await messageService
            .requestPendingBalanceRelease();

        setReleaseStatus({
          pendingBalance:
            result.pendingBalance,
          requestedAt:
            result.requestedAt,
          status:
            result.status,
        });

        toast.success(
          result.alreadyRequested
            ? "Release request पहिले नै pending छ।"
            : "Pending balance release request पठाइयो।",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
          "Release request पठाउन सकिएन।",
        );
      } finally {
        setReleaseLoading(false);
      }
    };

  const deleteOwnMessage = async (
    message: ChatMessage,
  ) => {
    if (
      message.senderId !==
      currentUserId ||
      message.type ===
        "PAYMENT_REQUEST"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "यो message दुवै side बाट delete गर्ने?",
      );

    if (!confirmed) return;

    try {
      setDeletingMessageId(
        message.id,
      );

      await messageService
        .deleteMessage(
          message.id,
        );

      setMessages((prev) =>
        prev.filter(
          (item) =>
            item.id !== message.id,
        ),
      );

      void loadConversations({ background: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Message delete गर्न सकिएन।",
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const startDeleteHold = (
    message: ChatMessage,
  ) => {
    if (
      message.senderId !==
      currentUserId
    ) {
      return;
    }

    if (
      deleteHoldTimerRef.current
    ) {
      window.clearTimeout(
        deleteHoldTimerRef.current,
      );
    }

    deleteHoldTimerRef.current =
      window.setTimeout(
        () => {
          void deleteOwnMessage(
            message,
          );
        },
        650,
      );
  };

  const cancelDeleteHold = () => {
    if (
      deleteHoldTimerRef.current
    ) {
      window.clearTimeout(
        deleteHoldTimerRef.current,
      );
      deleteHoldTimerRef.current =
        null;
    }
  };

  const filtered = search.trim() ? [] : conversations;
  const otherUserId = selected?.otherUser?.id || selected?.otherUserId || (selected ? selected.userOneId === currentUserId ? selected.userTwoId : selected.userOneId : "");

  return (
    <>
      {showPaymentRequestForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-background p-5 shadow-2xl">
            <h2 className="text-lg font-black">Create payment request</h2>
            <p className="mt-1 text-sm text-muted-foreground">यो user बाट कति रकम माग्ने हो?</p>

            <div className="mt-4 space-y-3">
              <Input
                type="number"
                min="1"
                max="1000000"
                step="0.01"
                value={paymentAmount}
                onChange={(e)=>setPaymentAmount(e.target.value)}
                placeholder="Amount (Rs.)"
              />
              <Input
                value={paymentNote}
                onChange={(e)=>setPaymentNote(e.target.value)}
                placeholder="Reason / note (optional)"
                maxLength={300}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={()=>{setShowPaymentRequestForm(false); setPaymentRequestClientId(null);}}
                disabled={paymentActionLoading==="create"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={()=>void submitPaymentRequest()}
                disabled={paymentActionLoading==="create" || !paymentAmount}
              >
                {paymentActionLoading==="create" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {releaseStatus && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-background p-5 shadow-2xl">
            <h2 className="text-lg font-black">Pending balance release</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              RoomKhoj मा pending earning release गर्न admin लाई request पठाउनुहोस्।
            </p>

            <div className="mt-4 rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground">Pending balance</p>
              <p className="text-2xl font-black">Rs. {Number(releaseStatus.pendingBalance || 0).toLocaleString()}</p>
              {releaseStatus.status && (
                <p className="mt-2 text-xs font-semibold">Status: {releaseStatus.status}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={()=>setReleaseStatus(null)}
                disabled={releaseLoading}
              >
                Close
              </Button>
              {releaseStatus.pendingBalance > 0 && releaseStatus.status !== "PENDING" && (
                <Button
                  type="button"
                  onClick={()=>void submitReleaseRequest()}
                  disabled={releaseLoading}
                >
                  {releaseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Release"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
                <Input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") void runSearch();}} placeholder="Search or start new chat" className="h-11 rounded-[14px] border-0 bg-muted pl-11" />
              </div>
              {phoneSearching && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
              {search.trim().length >= 2 && (
                <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                  {phoneResults.map((result)=><button key={`user-${result.id}`} onClick={()=>router.push(`/profile/${result.id}`)} className="block w-full rounded-xl border p-3 text-left"><p className="text-sm font-semibold">{result.name}</p><p className="text-xs text-muted-foreground">User</p></button>)}
                  {messageSearchResults.map((result)=><button key={`message-${result.id}`} onClick={()=>void openMessageSearchResult(result)} className="block w-full rounded-xl border p-3 text-left"><p className="text-sm font-semibold">{result.otherUser?.name || "Conversation"}</p><p className="line-clamp-2 text-xs text-muted-foreground">{result.content || "Message"}</p></button>)}
                  {!phoneSearching && phoneResults.length === 0 && messageSearchResults.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching users or messages.</p>}
                </div>
              )}
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
                  return <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    onTouchStart={()=>startDeleteHold(message)}
                    onTouchEnd={cancelDeleteHold}
                    onTouchMove={cancelDeleteHold}
                    onTouchCancel={cancelDeleteHold}
                  ><div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                    {message.type === "PAYMENT_REQUEST" && (
                      <div className="mb-2 min-w-[230px] rounded-xl border border-border bg-background/90 p-3 text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <HandCoins className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment request</p>
                            <p className="text-lg font-black">Rs. {Number(message.paymentAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {message.content && message.content !== "Payment requested" && (
                          <p className="mt-2 text-xs text-muted-foreground">{message.content}</p>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            message.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : message.paymentStatus === "CANCELLED"
                                ? "bg-muted text-muted-foreground"
                                : "bg-amber-100 text-amber-700"
                          }`}>
                            {message.paymentStatus || "PENDING"}
                          </span>

                          {message.paymentStatus === "PENDING" && !mine && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={()=>void payRequest(message)}
                              disabled={paymentActionLoading===message.id}
                            >
                              {paymentActionLoading===message.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay Now"}
                            </Button>
                          )}

                          {message.paymentStatus === "PENDING" && mine && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={()=>void cancelPaymentRequest(message)}
                              disabled={paymentActionLoading===message.id}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {message.attachment?.type === "ROOM" && <button type="button" onClick={()=>router.push(message.attachment!.url)} className="mb-2 block w-full overflow-hidden rounded-xl border border-border bg-background/80 text-left text-foreground">{message.attachment.image && <img src={resolveImageUrl(message.attachment.image)} alt="" className="h-32 w-full object-cover" />}<div className="p-2.5"><p className="text-[10px] font-semibold uppercase opacity-70">Room</p><p className="font-semibold">{message.attachment.title}</p><p className="text-xs opacity-80">Rs. {Number(message.attachment.price || 0).toLocaleString()}</p></div></button>}
                    {message.mediaUrl && message.type === "VIDEO" && <video src={mediaObjectUrls[message.id] || resolveImageUrl(message.mediaUrl)} controls playsInline className="mb-2 max-h-72 w-full rounded-xl" />}
                    {message.mediaUrl && message.type === "IMAGE" && <img src={mediaObjectUrls[message.id] || resolveImageUrl(message.mediaUrl)} alt="" className="mb-2 max-h-72 w-full rounded-xl object-cover" />}
                    {message.content && message.type !== "PAYMENT_REQUEST" && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75"><span>{new Date(message.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>{mine && <><CheckCheck className={`h-3.5 w-3.5 ${message.seenAt ? "text-sky-200" : ""}`} /><span className="font-medium">{deliveryLabel}</span>{message.type !== "PAYMENT_REQUEST" && <button type="button" onClick={()=>void deleteOwnMessage(message)} disabled={deletingMessageId===message.id} className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10" aria-label="Delete message">{deletingMessageId===message.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}</button>}</>}</div>
                  </div></div>;
                })}
                <div ref={messagesEndRef} />
              </div>

              {pendingContextPost?.type === "ROOM" && (
                <div className="border-t border-border bg-card p-3">
                  <div className="flex items-center gap-3 rounded-xl border p-2">
                    {pendingContextPost.image && <img src={resolveImageUrl(pendingContextPost.image)} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{pendingContextPost.title}</p>
                      <p className="text-xs text-muted-foreground">This room will be attached to your next message.</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={()=>setPendingContextPost(null)} aria-label="Remove room attachment">Remove</Button>
                  </div>
                </div>
              )}

              {failedSend && (
                <div className="border-t border-border bg-card px-3 py-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-destructive">Message send failed</p>
                    <Button type="button" size="sm" variant="outline" onClick={()=>void sendMessage(failedSend)} disabled={sending} className="gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {selectedMedia && mediaPreview && <div className="border-t border-border bg-card p-3"><div className="flex items-center gap-3">{selectedMedia.type.startsWith("video/") ? <video src={mediaPreview} className="h-16 w-16 rounded-lg object-cover" /> : <img src={mediaPreview} alt="" className="h-16 w-16 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedMedia.name}</p></div><Button variant="ghost" onClick={removeSelectedMedia}>Remove</Button><Button onClick={()=>void uploadMedia()} disabled={mediaSending}>{mediaSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}</Button></div></div>}

              <div className="relative border-t border-border bg-card px-2.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:px-4 md:py-3">
                {showActionMenu && (
                  <div className="absolute bottom-[68px] left-2.5 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl md:left-4">
                    <button type="button" onClick={()=>{setShowActionMenu(false); mediaInputRef.current?.click();}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ImageIcon className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Photo / Video</p><p className="text-xs text-muted-foreground">Send media</p></div></button>
                    <button type="button" onClick={()=>{setShowActionMenu(false); setPaymentRequestClientId(crypto.randomUUID()); setShowPaymentRequestForm(true);}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><HandCoins className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Request Payment</p><p className="text-xs text-muted-foreground">Ask this user to pay</p></div></button>
                    <button type="button" onClick={()=>void openReleaseRequest()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><WalletCards className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Wallet / Release</p><p className="text-xs text-muted-foreground">Balance and release request</p></div></button>
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
