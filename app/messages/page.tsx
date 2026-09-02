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
  WalletCards,
  FileText,
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

  const paymentFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [attachmentMenuOpen, setAttachmentMenuOpen] =
    useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] =
    useState(false);
  const [paymentAmount, setPaymentAmount] =
    useState("");
  const [paymentNote, setPaymentNote] =
    useState("");
  const [paymentAttachment, setPaymentAttachment] =
    useState<File | null>(null);
  const [paymentSending, setPaymentSending] =
    useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] =
    useState<string | null>(null);

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

  const loadConversations =
    async () => {
      try {
        setLoading(true);

        const data =
          await messageService.getConversations();

        setConversations(data);

        if (requestedConversationId) {
          const requested = data.find(
            (conversation) => conversation.id === requestedConversationId,
          );

          if (requested) {
            setSelected(requested);
          }
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Messages load गर्न सकिएन.",
        );
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
        if (!cancelled) {
          setConversations(data);
        }
      } catch {
        // Socket.IO is primary; this keeps inbox delivery working if realtime is blocked.
      }
    };

    const intervalId = window.setInterval(syncConversations, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!requestedIncomingCallId) return;

    const raw = sessionStorage.getItem(
      `roomkhoj:incoming-call:${requestedIncomingCallId}`,
    );
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      pendingIceCandidatesRef.current = (
        Array.isArray(saved.candidates) ? saved.candidates : []
      ).map((candidate: RTCIceCandidateInit) => ({
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
      sessionStorage.removeItem(
        `roomkhoj:incoming-call:${requestedIncomingCallId}`,
      );
    }
  }, [requestedIncomingCallId]);


  useEffect(() => {
    if (!currentUserId) return;

    const nextSocket = io(
      "https://api.roomkhoj.com/messages",
      {
        transports: ["polling", "websocket"],
        withCredentials: true,
        auth: {
          token: authToken,
        },
      },
    );

    nextSocket.on("connect", () => {
      console.log(
        "[MESSAGE SOCKET] connected",
        nextSocket.id,
        "user:",
        currentUserId,
      );

      nextSocket.emit(
        "join-user",
        {},
        (response: any) => {
          console.log(
            "[MESSAGE SOCKET] joined",
            response,
          );
        },
      );
    });

    nextSocket.on(
      "connect_error",
      (error) => {
        console.error(
          "[MESSAGE SOCKET] connect error",
          error.message,
        );
      },
    );

    nextSocket.on(
      "disconnect",
      (reason) => {
        console.log(
          "[MESSAGE SOCKET] disconnected",
          reason,
        );
      },
    );

    nextSocket.on(
      "presence:snapshot",
      (
        users: Array<{
          userId: string;
          online: boolean;
        }>,
      ) => {
        setOnlineUserIds(() => {
          const next = new Set<string>();

          for (const item of Array.isArray(users) ? users : []) {
            if (item?.online && item?.userId) {
              next.add(String(item.userId));
            }
          }

          return next;
        });
      },
    );

    nextSocket.on(
      "presence:update",
      (presence: {
        userId: string;
        online: boolean;
      }) => {
        const userId =
          String(presence?.userId || "");

        if (!userId) return;

        setOnlineUserIds((current) => {
          const next = new Set(current);

          if (presence.online) {
            next.add(userId);
          } else {
            next.delete(userId);
          }

          return next;
        });
      },
    );

    nextSocket.on(
      "message:new",
      (message: ChatMessage) => {
        if (
          message?.id &&
          message?.receiverId ===
            currentUserId
        ) {
          nextSocket.emit(
            "message:delivered",
            {
              messageId:
                message.id,
            },
          );
        }

        console.log(
          "[MESSAGE SOCKET] new message",
          message,
        );

        setSelected((current) => {
          if (
            current?.id ===
            message.conversationId
          ) {
            setMessages((prev) => {
              if (
                prev.some(
                  (item) =>
                    item.id === message.id,
                )
              ) {
                return prev;
              }

              return [...prev, message];
            });

            messageService
              .markSeen(
                message.conversationId,
              )
              .catch(() => {});
          }

          return current;
        });

        loadConversations();
      },
    );

    nextSocket.on(
      "message:deleted",
      (payload: {
        messageId: string;
        conversationId: string;
      }) => {
        if (!payload?.messageId) return;

        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== payload.messageId,
          ),
        );

        loadConversations();
      },
    );

    nextSocket.on(
      "message:seen",
      (payload: {
        conversationId: string;
      }) => {
        if (!payload?.conversationId) {
          return;
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.conversationId ===
            payload.conversationId
              ? {
                  ...message,
                  seenAt:
                    message.seenAt ||
                    new Date().toISOString(),
                }
              : message,
          ),
        );
      },
    );


    nextSocket.on("call:signal", async (signal: any) => {
      if (signal.type === "offer") {
        setIncomingCall(signal);
        setCallNotice(null);
        sendCallSignal(
          signal.fromUserId,
          signal.callId,
          "ringing",
          undefined,
          signal.mode,
        );
      }
      if (signal.type === "ringing") {
        setCall((current: any) =>
          current ? { ...current, status: "ringing" } : current,
        );
      }
      if (signal.type === "answer" && peerRef.current) {
        if (callTimeoutRef.current) {
          window.clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        await peerRef.current.setRemoteDescription(signal.payload);
        await flushPendingIceCandidates(signal.callId);
        setCall((current: any) =>
          current ? { ...current, status: "connected", connected: true } : current,
        );
      }
      if (signal.type === "candidate" && signal.payload) {
        await addOrQueueIceCandidate(signal.callId, signal.payload);
      }
      if (signal.type === "end") {
        if (signal.payload?.reason === "declined") {
          void recordMissedCall();
        }
        endCall(false, signal.payload?.reason === "declined" ? "Call declined" : "Call ended");
      }
    });

    nextSocket.on(
      "message:status",
      (status) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id ===
            status.messageId
              ? {
                  ...message,
                  deliveredAt:
                    status.deliveredAt ??
                    message.deliveredAt,
                  seenAt:
                    status.seenAt ??
                    message.seenAt,
                }
              : message,
          ),
        );
      },
    );

    setSocket(nextSocket);

    return () => {
      nextSocket.off("message:status");
      nextSocket.off("message:deleted");
      nextSocket.off("presence:snapshot");
      nextSocket.off("presence:update");
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [currentUserId, authToken]);


  useEffect(() => {
    if (!socket || !currentUserId) {
      return;
    }

    const userIds = Array.from(
      new Set(
        conversations
          .map((conversation) =>
            conversation.otherUser?.id ||
            conversation.otherUserId ||
            (conversation.userOneId === currentUserId
              ? conversation.userTwoId
              : conversation.userOneId),
          )
          .filter(
            (id): id is string =>
              Boolean(id) &&
              id !== currentUserId,
          ),
      ),
    );

    socket.emit(
      "presence:subscribe",
      { userIds },
    );
  }, [
    socket,
    currentUserId,
    conversations,
  ]);

  useEffect(() => {
    if (call?.mode !== "video") return;

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current && remoteAudioRef.current?.srcObject) {
      remoteVideoRef.current.srcObject = remoteAudioRef.current.srcObject;
    }
  }, [call?.callId, call?.mode]);

  const searchByContact =
    async (options?: { silent?: boolean; query?: string }) => {
      const raw = (options?.query ?? search).trim();

      if (raw.length < 2) {
        if (!options?.silent) {
          toast.error(
            "कम्तीमा 2 अक्षर, phone digits वा email राख्नुहोस्.",
          );
        }
        return;
      }

      try {
        setPhoneSearching(true);

        const results =
          await messageService.searchUsersByPhone(
            raw,
          );

        setPhoneResults(results);

        if (!results.length && !options?.silent) {
          toast.error(
            "यो search मिल्ने RoomKhoj user भेटिएन.",
          );
        }
      } catch (error: any) {
        if (!options?.silent) {
          toast.error(
            error?.response?.data?.message ||
              "User search गर्न सकिएन.",
          );
        }
      } finally {
        setPhoneSearching(false);
      }
    };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const raw = search.trim();

    if (!raw) {
      setPhoneResults([]);
      setPhoneSearching(false);
      return;
    }

    if (raw.length < 2) {
      setPhoneResults([]);
      setPhoneSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchByContact({
        silent: true,
        query: raw,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const openConversation =
    async (
      conversation: MessageConversation,
    ) => {
      setSelected(conversation);
      setMessagesLoading(true);

      try {
        const data =
          await messageService.getMessages(
            conversation.id,
          );

        setMessages(data);

        await messageService.markSeen(
          conversation.id,
        );

        loadConversations();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Conversation load गर्न सकिएन.",
        );
      } finally {
        setMessagesLoading(false);
      }
    };

  const handleMediaSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const fileName =
      file.name.toLowerCase();

    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(
        fileName,
      );

    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(
        fileName,
      );

    if (!isImage && !isVideo) {
      alert(
        "Photo वा video मात्र select गर्नुहोस्.",
      );

      e.target.value = "";
      return;
    }

    /*
     * यो preview मात्र हो।
     * Original file modify/compress हुँदैन।
     */
    if (mediaPreview) {
      URL.revokeObjectURL(
        mediaPreview,
      );
    }

    setSelectedMedia(file);

    setMediaPreview(
      URL.createObjectURL(file),
    );
  };

  const removeSelectedMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(
        mediaPreview,
      );
    }

    setSelectedMedia(null);
    setMediaPreview(null);

    if (mediaInputRef.current) {
      mediaInputRef.current.value =
        "";
    }
  };

  const uploadMedia =
    async () => {
      if (
        !selected ||
        !selectedMedia ||
        mediaSending
      ) {
        return;
      }

      try {
        setMediaSending(true);

        const message =
          await messageService.sendMedia(
            selected.id,
            selectedMedia,
          );

        setMessages((prev) => [
          ...prev,
          message,
        ]);

        removeSelectedMedia();
        loadConversations();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Media send गर्न सकिएन.",
        );
      } finally {
        setMediaSending(false);
      }
    };

  const sendPaymentRequest = async () => {
    if (!selected || paymentSending) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Payment amount राख्नुहोस्.");
      return;
    }

    try {
      setPaymentSending(true);
      const message = await messageService.sendPaymentRequest(
        selected.id,
        amount,
        paymentNote,
        paymentAttachment,
      );

      setMessages((prev) => [...prev, message]);
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentAttachment(null);
      setPaymentDialogOpen(false);
      setAttachmentMenuOpen(false);
      if (paymentFileInputRef.current) {
        paymentFileInputRef.current.value = "";
      }
      loadConversations();
      toast.success("Payment request sent");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Payment request पठाउन सकिएन.",
      );
    } finally {
      setPaymentSending(false);
    }
  };

  const confirmPaymentRequest = async (messageId: string) => {
    if (confirmingPaymentId) return;

    try {
      setConfirmingPaymentId(messageId);
      const result = await messageService.confirmPaymentRequest(messageId);

      setMessages((prev) => {
        const updated = prev.map((item) =>
          item.id === messageId
            ? {
                ...item,
                ...result.request,
                payment: {
                  amount: Number(result.request.payment?.amount || item.payment?.amount || 0),
                  currency: "NPR" as const,
                  status: "CONFIRMED" as const,
                },
              }
            : item,
        );

        if (
          result.confirmation &&
          !updated.some((item) => item.id === result.confirmation!.id)
        ) {
          updated.push(result.confirmation);
        }
        return updated;
      });

      loadConversations();
      toast.success(
        result.alreadyConfirmed
          ? "Payment already confirmed"
          : "Payment confirmed",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Payment confirm गर्न सकिएन.",
      );
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const sendCallSignal = (
    toUserId: string,
    callId: string,
    type: string,
    payload?: any,
    mode: "audio" | "video" = "audio",
  ) => {
    if (!socket) return;

    socket.emit("call:signal", {
      toUserId,
      callId,
      type,
      payload,
      mode,
    });
  };

  const addOrQueueIceCandidate = async (
    callId: string,
    candidate: RTCIceCandidateInit,
  ) => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) {
      pendingIceCandidatesRef.current.push({ callId, candidate });
      return;
    }
    try {
      await peer.addIceCandidate(candidate);
    } catch (error) {
      console.warn("ICE candidate failed:", error);
    }
  };

  const flushPendingIceCandidates = async (callId: string) => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;
    const pending = pendingIceCandidatesRef.current.filter(
      (item) => item.callId === callId,
    );
    pendingIceCandidatesRef.current = pendingIceCandidatesRef.current.filter(
      (item) => item.callId !== callId,
    );
    for (const item of pending) {
      try {
        await peer.addIceCandidate(item.candidate);
      } catch (error) {
        console.warn("Queued ICE candidate failed:", error);
      }
    }
  };

  const createPeer = async (
    targetUserId: string,
    callId: string,
    mode: "audio" | "video",
  ) => {
    let iceServers: RTCIceServer[] = [
      { urls: ["stun:stun.l.google.com:19302"] },
    ];

    try {
      const credentials = await messageService.getCallCredentials();
      if (Array.isArray(credentials?.iceServers) && credentials.iceServers.length) {
        iceServers = credentials.iceServers;
      }
    } catch (error) {
      console.warn("TURN credentials unavailable; using STUN fallback.", error);
    }

    const peer = new RTCPeerConnection({ iceServers });
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendCallSignal(
          targetUserId,
          callId,
          "candidate",
          event.candidate.toJSON(),
          mode,
        );
      }
    };
    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        void remoteAudioRef.current.play().catch((error) => {
          console.warn("Remote call audio could not autoplay:", error);
        });
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        void remoteVideoRef.current.play().catch(() => {});
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setCall((current: any) =>
          current ? { ...current, status: "connected", connected: true } : current,
        );
      }
    };
    peerRef.current = peer;
    return peer;
  };

  const recordMissedCall = async () => {
    const activeCall = activeCallRef.current;
    if (!activeCall?.conversationId) return;

    try {
      const saved = await messageService.recordMissedCall(
        activeCall.conversationId,
        activeCall.mode,
      );
      setMessages((prev) =>
        prev.some((message) => message.id === saved.id)
          ? prev
          : [...prev, saved],
      );
      void loadConversations();
    } catch (error) {
      console.error("Missed call could not be saved:", error);
    }
  };

  const describeMediaError = (
    error: unknown,
    mode: "audio" | "video",
  ) => {
    const name =
      error instanceof DOMException
        ? error.name
        : "";

    if (name === "NotReadableError") {
      return "Camera अर्को app वा tab ले प्रयोग गरिरहेको छ।";
    }

    if (name === "NotFoundError") {
      return mode === "video"
        ? "Camera device भेटिएन।"
        : "Microphone device भेटिएन।";
    }

    if (name === "NotAllowedError" || name === "SecurityError") {
      return mode === "video"
        ? "Browser ले camera access रोकेको छ।"
        : "Browser ले microphone access रोकेको छ।";
    }

    return "Video call सुरु हुन सकेन। फेरि प्रयास गर्नुहोस्।";
  };

  const startCall = async (mode: "audio" | "video") => {
    if (!selected || !otherUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
      localStreamRef.current = stream;
      const callId = crypto.randomUUID();
      const peer = await createPeer(otherUserId, callId, mode);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode === "video",
      });
      await peer.setLocalDescription(offer);
      sendCallSignal(otherUserId, callId, "offer", offer, mode);
      const outgoingCall = {
        callId,
        conversationId: selected.id,
        targetUserId: otherUserId,
        mode,
        status: "calling",
        connected: false,
        muted: false,
      };
      activeCallRef.current = outgoingCall;
      setCall(outgoingCall);
      setCallNotice(null);

      callTimeoutRef.current = window.setTimeout(async () => {
        if (activeCallRef.current?.callId !== callId) return;
        await recordMissedCall();
        sendCallSignal(otherUserId, callId, "end", { reason: "missed" }, mode);
        endCall(false, "No answer — missed call");
      }, 30000);
    } catch (error) {
      console.error("Unable to start call:", error);
      setCall(null);
      setCallNotice(describeMediaError(error, mode));
      window.setTimeout(() => setCallNotice(null), 5000);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.mode === "video" });
      localStreamRef.current = stream;
      const peer = await createPeer(incomingCall.fromUserId, incomingCall.callId, incomingCall.mode);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(incomingCall.payload);
      await flushPendingIceCandidates(incomingCall.callId);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendCallSignal(incomingCall.fromUserId, incomingCall.callId, "answer", answer, incomingCall.mode);
      const acceptedCall = {
        callId: incomingCall.callId,
        conversationId: selected?.id,
        targetUserId: incomingCall.fromUserId,
        mode: incomingCall.mode,
        status: "connected",
        connected: true,
        muted: false,
      };
      activeCallRef.current = acceptedCall;
      setCall(acceptedCall);
      setIncomingCall(null);
    } catch (error) {
      console.error("Unable to accept call:", error);
      setIncomingCall(null);
      setCallNotice(
        describeMediaError(
          error,
          incomingCall.mode === "video" ? "video" : "audio",
        ),
      );
      window.setTimeout(() => setCallNotice(null), 5000);
    }
  };

  const endCall = (notify = true, notice = "Call ended") => {
    const activeCall = activeCallRef.current;
    if (callTimeoutRef.current) {
      window.clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (notify && activeCall) {
      sendCallSignal(activeCall.targetUserId, activeCall.callId, "end");
    }
    peerRef.current?.close();
    peerRef.current = null;
    pendingIceCandidatesRef.current = [];
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    activeCallRef.current = null;
    setCall(null);
    setIncomingCall(null);
    setCallNotice(notice);
    window.setTimeout(() => setCallNotice(null), 3000);
  };

  const declineIncomingCall = () => {
    if (incomingCall) {
      sendCallSignal(
        incomingCall.fromUserId,
        incomingCall.callId,
        "end",
        { reason: "declined" },
        incomingCall.mode,
      );
    }
    endCall(false, "Call declined");
  };

  const clearDeleteHoldTimer = () => {
    if (deleteHoldTimerRef.current !== null) {
      window.clearTimeout(
        deleteHoldTimerRef.current,
      );
      deleteHoldTimerRef.current = null;
    }
  };

  const deleteOwnMessage = async (
    message: ChatMessage,
  ) => {
    if (
      message.senderId !== currentUserId ||
      deletingMessageId === message.id
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this message for everyone?",
    );

    if (!confirmed) return;

    try {
      setDeletingMessageId(message.id);

      await messageService.deleteMessage(
        message.id,
      );

      setMessages((prev) =>
        prev.filter(
          (item) => item.id !== message.id,
        ),
      );

      await loadConversations();
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Message delete गर्न सकिएन.",
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const startDeleteHold = (
    message: ChatMessage,
  ) => {
    if (message.senderId !== currentUserId) {
      return;
    }

    clearDeleteHoldTimer();

    deleteHoldTimerRef.current =
      window.setTimeout(() => {
        deleteHoldTimerRef.current = null;
        void deleteOwnMessage(message);
      }, 650);
  };

  useEffect(() => {
    if (!selected?.id) return;

    let cancelled = false;

    const syncMessages = async () => {
      try {
        const data = await messageService.getMessages(selected.id);
        if (!cancelled) {
          setMessages(data);
        }
      } catch {
        // Realtime socket remains primary; polling is only a delivery fallback.
      }
    };

    const intervalId = window.setInterval(syncMessages, 4000);

    const handleFocus = () => {
      void syncMessages();
      void loadConversations();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [selected?.id]);

  const sendMessage =
    async () => {
      const text = draft.trim();

      if (
        !selected ||
        !text ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        const roomAttachmentId =
          contextPost?.type === "ROOM"
            ? contextPost.id
            : undefined;

        const message =
          await messageService.sendMessage(
            selected.id,
            text,
            roomAttachmentId,
          );

        setMessages((prev) => [
          ...prev,
          message,
        ]);

        setDraft("");

        loadConversations();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Message send गर्न सकिएन.",
        );
      } finally {
        setSending(false);
      }
    };

  // Search results must show RoomKhoj users, not old conversation names.
  const filtered = search.trim() ? [] : conversations;

  const otherUserId =
    selected?.otherUser?.id ||
    selected?.otherUserId ||
    (selected
      ? selected.userOneId === currentUserId
        ? selected.userTwoId
        : selected.userOneId
      : "");

  const contextPost =
    selected?.contextPost ||
    (selected?.id === requestedConversationId
      ? pendingContextPost
      : null);

  return (
    <>
    <main className={`${isDarkMode ? "dark" : ""} mx-auto h-[calc(100dvh-68px)] max-w-7xl overflow-hidden bg-background text-foreground md:h-screen md:max-w-none md:p-0`}>
      <div className="grid h-full min-h-0 overflow-hidden border border-border bg-background shadow-none md:grid-cols-[390px_1fr] md:border-0 md:bg-card">
        <aside
          className={`border-r border-border bg-card ${
            selected
              ? "hidden md:block"
              : "block"
          }`}
        >
          <div className="border-b border-border bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:bg-muted md:px-4 md:py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-primary md:block">
                  RoomKhoj
                </p>
                <h1 className="text-[28px] font-black tracking-tight text-foreground md:text-2xl">
                  Chats
                </h1>
              </div>
              <button
                type="button"
                onClick={toggleChatTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:bg-primary/10"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={isDarkMode ? "Light mode" : "Dark mode"}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);
                  setPhoneResults([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchByContact();
                  }
                }}
                placeholder="Search or start new chat"
                className="h-11 rounded-[14px] border-0 bg-muted pl-11 pr-4 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="mt-3 flex gap-2 md:hidden">
              <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">All</span>
              <span className="rounded-full border border-border bg-secondary px-4 py-2 text-xs text-foreground">Unread</span>
              <span className="rounded-full border border-border bg-secondary px-4 py-2 text-xs text-foreground">Favorites</span>
            </div>

            {phoneResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {phoneResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/profile/${result.id}`,
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:bg-muted"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-black text-primary">
                      {(result.name || "U")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {result.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        RoomKhoj user
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto">
              {filtered.map(
                (conversation: any) => {
                  const otherId =
                    conversation.userOneId ===
                    currentUserId
                      ? conversation.userTwoId
                      : conversation.userOneId;

                  return (
                    <button
                      key={
                        conversation.id
                      }
                      type="button"
                      onClick={() =>
                        openConversation(
                          conversation,
                        )
                      }
                      className="flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-muted"
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-semibold text-foreground">
                          {otherId
                            ?.slice(0, 2)
                            .toUpperCase()}
                        </div>
                        {onlineUserIds.has(otherId) && (
                          <span
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary"
                            title="Online"
                            aria-label="Online"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 border-b border-border pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-foreground">
                            {conversation.otherUser?.name || "RoomKhoj user"}
                          </p>

                          {conversation.unreadCount >
                            0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conversation.lastMessage?.content ||
                            (conversation.lastMessage?.type === "IMAGE"
                              ? "Photo"
                              : conversation.lastMessage?.type === "VIDEO"
                                ? "Video"
                                : conversation.lastMessage?.attachment?.type === "ROOM"
                                  ? "Room attachment"
                                  : "Start conversation")}
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </aside>

        <section
          className={`flex min-h-0 flex-col bg-background ${
            !selected
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center bg-[#222e35] text-center text-foreground">
              <div>
                <MessageCircle className="mx-auto h-14 w-14 text-muted-foreground" />

                <h2 className="mt-4 text-lg font-semibold">
                  Select a conversation
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a chat to start messaging.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex min-h-[70px] items-center gap-2 border-b border-border bg-card px-2.5 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-foreground shadow-none md:min-h-0 md:bg-muted md:px-4 md:py-3">
                <button
                  type="button"
                  className="flex h-10 items-center gap-0.5 rounded-full px-1 text-foreground md:hidden"
                  onClick={() => {
                    if (safeReturnTo) {
                      router.push(safeReturnTo);
                      return;
                    }
                    setSelected(null);
                  }}
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={() => otherUserId && router.push(`/profile/${otherUserId}`)}
                  className="relative shrink-0"
                  aria-label="Open profile"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6a7175] font-bold text-white">
                    {otherUserId
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  {onlineUserIds.has(otherUserId) && (
                    <span
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary"
                      aria-label="Online"
                    />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-bold text-foreground">
                    {selected.otherUser?.name || "RoomKhoj user"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {onlineUserIds.has(otherUserId) ? "online" : "offline"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full text-foreground hover:bg-muted" onClick={() => startCall("video")} aria-label="Video call"><Video className="h-5 w-5" /></Button>
                </div>
              </header>
              <audio ref={remoteAudioRef} autoPlay playsInline />

              {contextPost && (
                <div className="border-b border-border bg-card px-3 py-2 md:px-4 md:py-3">
                  <button
                    type="button"
                    onClick={() => router.push(contextPost.url)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted p-3 text-left shadow-sm transition-colors hover:bg-accent/10"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card text-xl">
                      {contextPost.image ? (
                        <img
                          src={resolveImageUrl(contextPost.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : contextPost.type === "ROOM" ? (
                        "🏠"
                      ) : (
                        "💼"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {contextPost.type === "ROOM"
                          ? "Room post"
                          : "Job post"}
                      </p>
                      <p className="truncate font-semibold text-foreground">
                        {contextPost.title}
                      </p>
                      {(contextPost.subtitle ||
                        contextPost.price !== null &&
                          contextPost.price !== undefined) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {contextPost.subtitle}
                          {contextPost.subtitle &&
                            contextPost.price !== null &&
                            contextPost.price !== undefined
                            ? " · "
                            : ""}
                          {contextPost.price !== null &&
                            contextPost.price !== undefined
                            ? `रु ${Number(contextPost.price).toLocaleString()}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-primary">
                      View
                    </span>
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-background bg-[radial-gradient(circle_at_top,_rgba(32,44,51,0.15),_rgba(11,20,26,1)_45%)] px-2.5 py-3 pb-28 sm:px-5 md:px-[6%] md:py-5">
                {messagesLoading ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  messages.map(
                    (message) => {
                      const mine =
                        message.senderId ===
                        currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            onPointerDown={() => startDeleteHold(message)}
                            onPointerUp={clearDeleteHoldTimer}
                            onPointerLeave={clearDeleteHoldTimer}
                            onPointerCancel={clearDeleteHoldTimer}
                            className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              mine
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-card text-foreground"
                            }`}
                          >
                            {(message.type === "PAYMENT_REQUEST" ||
                              message.type === "PAYMENT_CONFIRMED") && (
                              <div className="mb-2 min-w-[230px] rounded-2xl border border-border bg-background/80 p-3 text-foreground">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <WalletCards className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Payment request
                                    </p>
                                    <p className="text-xl font-extrabold">
                                      रु {Number(message.payment?.amount || message.mediaOriginalName || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {message.content && (
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                    {message.content}
                                  </p>
                                )}

                                {message.mediaUrl && message.mediaMimeType && (
                                  <a
                                    href={resolveImageUrl(message.mediaUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <FileText className="h-4 w-4" />
                                    View attachment
                                  </a>
                                )}

                                <div className="mt-3">
                                  {message.type === "PAYMENT_CONFIRMED" ||
                                  message.payment?.status === "CONFIRMED" ? (
                                    <div className="rounded-xl bg-emerald-100 px-3 py-2 text-center text-xs font-bold text-emerald-800">
                                      Payment confirmed
                                    </div>
                                  ) : !mine ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="w-full rounded-xl"
                                      disabled={confirmingPaymentId === message.id}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void confirmPaymentRequest(message.id);
                                      }}
                                    >
                                      {confirmingPaymentId === message.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Confirm payment"
                                      )}
                                    </Button>
                                  ) : (
                                    <div className="rounded-xl bg-muted px-3 py-2 text-center text-xs font-semibold">
                                      Waiting for confirmation
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {message.attachment?.type === "ROOM" && message.attachment.url && (
                              <button
                                type="button"
                                onClick={() => router.push(message.attachment!.url!)}
                                className="mb-2 block w-full overflow-hidden rounded-xl border border-border bg-background/70 text-left"
                              >
                                {message.attachment.image && (
                                  <img
                                    src={resolveImageUrl(message.attachment.image)}
                                    alt=""
                                    className="h-32 w-full object-cover"
                                  />
                                )}
                                <div className="p-2.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Room</p>
                                  <p className="font-semibold">{message.attachment.title || "Room post"}</p>
                                  {message.attachment.price !== null && message.attachment.price !== undefined && (
                                    <p className="mt-0.5 text-xs opacity-80">रु {Number(message.attachment.price).toLocaleString()}</p>
                                  )}
                                </div>
                              </button>
                            )}

                            {message.mediaUrl &&
                              message.type !== "PAYMENT_REQUEST" &&
                              message.type !== "PAYMENT_CONFIRMED" && (
                              message.type === "VIDEO" ? (
                                <video src={resolveImageUrl(message.mediaUrl)} controls playsInline className="mb-2 max-h-72 w-full rounded-xl" />
                              ) : (
                                <img src={resolveImageUrl(message.mediaUrl)} alt="" className="mb-2 max-h-72 w-full rounded-xl object-cover" />
                              )
                            )}

                            {message.content &&
                              message.type !== "PAYMENT_REQUEST" &&
                              message.type !== "PAYMENT_CONFIRMED" && (
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              )}

                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                              <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {mine && (
                                <CheckCheck className={`h-3.5 w-3.5 ${message.seenAt ? "text-sky-200" : ""}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedMedia && mediaPreview && (
                <div className="border-t border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    {selectedMedia.type.startsWith("video/") ? (
                      <video src={mediaPreview} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <img src={mediaPreview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{selectedMedia.name}</p>
                    </div>
                    <Button variant="ghost" onClick={removeSelectedMedia}>Remove</Button>
                    <Button onClick={() => void uploadMedia()} disabled={mediaSending}>
                      {mediaSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-border bg-card px-2.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:px-4 md:py-3">
                <div className="flex items-end gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAttachmentMenuOpen((open) => !open)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
                      aria-label="Open attachment menu"
                    >
                      <Plus className={`h-6 w-6 transition-transform ${attachmentMenuOpen ? "rotate-45" : ""}`} />
                    </button>

                    {attachmentMenuOpen && (
                      <div className="absolute bottom-14 left-0 z-50 w-[310px] rounded-3xl border border-border bg-card p-4 shadow-2xl">
                        <div className="grid grid-cols-3 gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentMenuOpen(false);
                              mediaInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-2 text-xs font-medium"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                              <Camera className="h-6 w-6" />
                            </span>
                            Photos
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentMenuOpen(false);
                              mediaInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-2 text-xs font-medium"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                              <ImageIcon className="h-6 w-6" />
                            </span>
                            Media
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPaymentDialogOpen(true);
                              setAttachmentMenuOpen(false);
                            }}
                            className="flex flex-col items-center gap-2 text-xs font-medium"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <WalletCards className="h-6 w-6" />
                            </span>
                            Payment request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaSelect}
                  />

                  <div className="flex min-h-11 flex-1 items-center rounded-[22px] bg-muted px-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder="Type a message"
                      rows={1}
                      className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    className="h-11 w-11 rounded-full"
                    onClick={() => void sendMessage()}
                    disabled={!draft.trim() || sending}
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>

    {paymentDialogOpen && (
      <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-3 sm:items-center">
        <div className="w-full max-w-md rounded-3xl bg-card p-5 text-foreground shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">Request payment</h3>
              <p className="text-xs text-muted-foreground">
                Ask the other user to confirm this payment.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              inputMode="decimal"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Amount in NPR"
            />
            <textarea
              value={paymentNote}
              onChange={(event) => setPaymentNote(event.target.value)}
              placeholder="Note (optional)"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <input
              ref={paymentFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(event) =>
                setPaymentAttachment(event.target.files?.[0] || null)
              }
            />
            <button
              type="button"
              onClick={() => paymentFileInputRef.current?.click()}
              className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {paymentAttachment ? paymentAttachment.name : "Add attachment"}
              </span>
              <span className="text-xs text-muted-foreground">Optional</span>
            </button>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentAttachment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={paymentSending || !paymentAmount.trim()}
              onClick={() => void sendPaymentRequest()}
            >
              {paymentSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send request"
              )}
            </Button>
          </div>
        </div>
      </div>
    )}

    {callNotice && (
      <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {callNotice}
      </div>
    )}

    {incomingCall && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
          <p className="text-sm text-muted-foreground">Incoming {incomingCall.mode === "video" ? "video" : "voice"} call</p>
          <h3 className="mt-2 text-xl font-bold text-foreground">RoomKhoj user</h3>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="destructive" size="lg" className="rounded-full" onClick={declineIncomingCall}>
              <PhoneOff className="mr-2 h-5 w-5" /> Decline
            </Button>
            <Button size="lg" className="rounded-full" onClick={() => void acceptCall()}>
              <Phone className="mr-2 h-5 w-5" /> Accept
            </Button>
          </div>
        </div>
      </div>
    )}

    {call && (
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl">
          {call.mode === "video" ? (
            <div className="relative aspect-[3/4] bg-black">
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-4 right-4 h-28 w-20 rounded-xl border border-white/20 bg-black object-cover" />
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-bold text-primary">
                {otherUserId.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="mt-4 text-xl font-bold">{selected?.otherUser?.name || "RoomKhoj user"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{call.status === "connected" ? "Connected" : "Calling..."}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 border-t border-border bg-card p-4">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full"
              onClick={() => {
                const stream = localStreamRef.current;
                if (!stream) return;
                const audioTracks = stream.getAudioTracks();
                const shouldMute = !call.muted;
                audioTracks.forEach((track) => { track.enabled = !shouldMute; });
                setCall((current: any) => current ? { ...current, muted: shouldMute } : current);
              }}
            >
              {call.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button type="button" size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={() => endCall(true)}>
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
