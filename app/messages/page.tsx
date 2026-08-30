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
  MoreVertical,
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
      phoneNumber: string;
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

  const sendSelectedMedia =
    async () => {
      if (
        !selected ||
        !selectedMedia
      ) {
        return;
      }

      try {
        setMediaSending(true);

        const sent =
          await messageService.sendMedia(
            selected.id,
            selectedMedia,
            draft.trim() ||
              undefined,
          );

        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                m.id === sent.id,
            )
          ) {
            return prev;
          }

          return [
            ...prev,
            sent,
          ];
        });

        setDraft("");

        removeSelectedMedia();

        await loadConversations();
      } catch (error: any) {
        console.error(
          "Media send failed:",
          error,
        );

        toast.error(
          error?.response?.data?.message ||
            "Photo/video send हुन सकेन.",
        );
      } finally {
        setMediaSending(false);
      }
    };

  useEffect(() => {
    let cancelled = false;

    const loadMessageMedia =
      async () => {
        const mediaMessages =
          messages.filter(
            (message) =>
              (
                message.type === "IMAGE" ||
                message.type === "VIDEO"
              ) &&
              !mediaObjectUrls[
                message.id
              ],
          );

        for (
          const message
          of mediaMessages
        ) {
          try {
            const blob =
              await messageService
                .getMediaBlob(
                  message.id,
                );

            if (cancelled) {
              return;
            }

            const url =
              URL.createObjectURL(
                blob,
              );

            setMediaObjectUrls(
              (prev) => ({
                ...prev,
                [message.id]:
                  url,
              }),
            );
          } catch (error) {
            console.error(
              "Media load failed:",
              error,
            );
          }
        }
      };

    loadMessageMedia();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  /*
   * Selected chat खुलिसकेपछि त्यस conversation का
   * received messages seen मान्ने।
   *
   * messages.length dependency ले नयाँ message
   * खुलेको chat मै आएमा पनि badge तुरुन्त clear गर्छ।
   */
  useEffect(() => {
    if (!selected?.id) {
      return;
    }

    let cancelled = false;

    const syncSeenStatus =
      async () => {
        try {
          await messageService.markSeen(
            selected.id,
          );

          if (cancelled) {
            return;
          }

          /*
           * Left conversation list को
           * unread badge तुरुन्त हटाउने।
           */
          setConversations(
            (prev) =>
              prev.map(
                (conversation) =>
                  conversation.id ===
                  selected.id
                    ? {
                        ...conversation,
                        unreadCount: 0,
                      }
                    : conversation,
              ),
          );

          /*
           * Bottom nav unread count पनि
           * तुरुन्त refresh गर्ने।
           */
          window.dispatchEvent(
            new Event(
              "roomkhoj:unread-refresh",
            ),
          );
        } catch (error) {
          console.error(
            "Failed to mark conversation seen:",
            error,
          );
        }
      };

    syncSeenStatus();

    return () => {
      cancelled = true;
    };
  }, [
    selected?.id,
    messages.length,
  ]);

  useEffect(() => {
    const profileUserId =
      new URLSearchParams(
        window.location.search,
      ).get("user");

    if (!profileUserId) {
      return;
    }

    let cancelled = false;

    const openProfileChat =
      async () => {
        try {
          const result =
            await messageService
              .startByUser(
                profileUserId,
              );

          if (cancelled) {
            return;
          }

          await loadConversations();

          const conversation =
            result.conversation;

          if (conversation) {
            setSelected(
              conversation,
            );
          }
        } catch (error) {
          console.error(
            "Profile message start failed:",
            error,
          );
        }
      };

    openProfileChat();

    return () => {
      cancelled = true;
    };
  }, []);

  const bindLocalVideo = (
    element: HTMLVideoElement | null,
  ) => {
    localVideoRef.current = element;

    if (element && localStreamRef.current) {
      element.srcObject = localStreamRef.current;
      void element.play().catch(() => {});
    }
  };

  const bindRemoteVideo = (
    element: HTMLVideoElement | null,
  ) => {
    remoteVideoRef.current = element;

    const remoteStream =
      remoteAudioRef.current?.srcObject;

    if (element && remoteStream) {
      element.srcObject = remoteStream;
      void element.play().catch(() => {});
    }
  };

  const sendCallSignal = (targetUserId: string, callId: string, type: string, payload?: any, mode?: string) => {
    socket?.emit("call:signal", { targetUserId, callId, type, payload, mode });
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
      console.warn("Could not add ICE candidate:", error);
    }
  };

  const flushPendingIceCandidates = async (callId: string) => {
    const queued = pendingIceCandidatesRef.current.filter(
      (item) => item.callId === callId,
    );
    pendingIceCandidatesRef.current =
      pendingIceCandidatesRef.current.filter((item) => item.callId !== callId);

    for (const item of queued) {
      await addOrQueueIceCandidate(item.callId, item.candidate);
    }
  };

  const createPeer = async (targetUserId: string, callId: string, mode: "audio" | "video") => {
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
                        {result.phoneNumber}
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
            <div className="divide-y divide-[#202c33] overflow-y-auto">
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
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] bg-primary"
                            title="Online"
                            aria-label="Online"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 border-b border-border pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-foreground">
                            {conversation.otherUser?.name ||
                              conversation.otherUser?.phoneNumber ||
                              "RoomKhoj user"}
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
                  onClick={() =>
                    setSelected(null)
                  }
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
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] bg-primary"
                      aria-label="Online"
                    />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-bold text-foreground">
                    {selected.otherUser?.name ||
                      selected.otherUser?.phoneNumber ||
                      "RoomKhoj user"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {onlineUserIds.has(otherUserId)
                      ? "online"
                      : selected.otherUser?.phoneNumber || "offline"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full text-foreground hover:bg-muted" onClick={() => startCall("video")} aria-label="Video call"><Video className="h-5 w-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full text-foreground hover:bg-muted" onClick={() => startCall("audio")} aria-label="Audio call"><Phone className="h-5 w-5" /></Button>
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
                          key={
                            message.id
                          }
                          className={`flex ${
                            mine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[86%] rounded-[14px] px-3 py-2 text-[15px] leading-snug shadow-sm sm:max-w-[72%] ${
                              mine
                                ? "cursor-pointer select-none rounded-br-[4px] bg-primary text-foreground"
                                : "rounded-bl-[4px] bg-muted text-foreground"
                            } ${
                              deletingMessageId === message.id
                                ? "opacity-50"
                                : ""
                            }`}
                            onPointerDown={() =>
                              startDeleteHold(message)
                            }
                            onPointerUp={clearDeleteHoldTimer}
                            onPointerCancel={clearDeleteHoldTimer}
                            onPointerLeave={clearDeleteHoldTimer}
                            onContextMenu={(event) => {
                              if (!mine) return;
                              event.preventDefault();
                              clearDeleteHoldTimer();
                              void deleteOwnMessage(message);
                            }}
                            title={
                              mine
                                ? "Press and hold to delete"
                                : undefined
                            }
                          >
                            {message.attachment?.type === "ROOM" && (
                              <div
                                className={`mb-1 w-full overflow-hidden rounded-xl border text-left shadow-sm ${
                                  mine
                                    ? "border-white/20 bg-black/10"
                                    : "border-border bg-card"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    router.push(message.attachment!.url);
                                  }}
                                  className="block w-full text-left transition hover:opacity-95"
                                >
                                  <div className="flex items-stretch">
                                    <div className="h-24 w-28 shrink-0 overflow-hidden bg-card">
                                      {message.attachment.image ? (
                                        <img
                                          src={resolveImageUrl(message.attachment.image)}
                                          alt={message.attachment.title}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-2xl">
                                          🏠
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1 p-3">
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Room
                                      </p>
                                      <p className="mt-0.5 line-clamp-2 font-semibold">
                                        {message.attachment.title}
                                      </p>
                                      <p className="mt-1 text-xs font-semibold text-primary">
                                        रु {Number(message.attachment.price).toLocaleString()} / month
                                      </p>
                                      {message.attachment.address && (
                                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                          📍 {message.attachment.address}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {message.content && (
                                  <div className="border-t border-white/10 px-3 py-3 text-sm text-foreground">
                                    <p className="whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    router.push(message.attachment!.url);
                                  }}
                                  className="block w-full border-t border-white/10 px-3 py-2 text-left text-xs font-semibold text-primary"
                                >
                                  View room details →
                                </button>
                              </div>
                            )}

                            {(message.type === "IMAGE" ||
                              message.type === "VIDEO") &&
                              !mediaObjectUrls[message.id] && (
                                <div className="mb-2 flex min-h-28 min-w-44 items-center justify-center rounded-xl bg-card px-4 text-xs text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading attachment…
                                </div>
                              )}

                            {message.type ===
                              "IMAGE" &&
                              mediaObjectUrls[
                                message.id
                              ] && (
                                <img
                                  src={
                                    mediaObjectUrls[
                                      message.id
                                    ]
                                  }
                                  alt={
                                    message.mediaOriginalName ||
                                    "Photo"
                                  }
                                  className="mb-2 max-h-[68vh] w-auto max-w-full rounded-[10px] object-contain"
                                />
                              )}

                            {message.type ===
                              "VIDEO" &&
                              mediaObjectUrls[
                                message.id
                              ] && (
                                <video
                                  src={
                                    mediaObjectUrls[
                                      message.id
                                    ]
                                  }
                                  controls
                                  playsInline
                                  preload="metadata"
                                  className="mb-2 max-h-[68vh] w-full rounded-[10px] bg-black"
                                />
                              )}

                            {message.content &&
                              message.attachment?.type !== "ROOM" && (
                                <p className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              )}

                            <p className="mt-1 text-right text-[10px] text-muted-foreground">
                              {new Date(
                                message.createdAt,
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                },
                              )}

                              {mine && (
                                <span
                                  className={`ml-1 font-semibold ${
                                    message.seenAt
                                      ? "text-[#53bdeb]"
                                      : "text-muted-foreground"
                                  }`}
                                  title={
                                    message.seenAt
                                      ? "Seen"
                                      : message.deliveredAt
                                        ? "Delivered"
                                        : "Sent"
                                  }
                                >
                                  {message.seenAt
                                    ? " ✓✓"
                                    : message.deliveredAt
                                      ? " ✓✓"
                                      : " ✓"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="sticky bottom-0 z-20 border-t border-border bg-card px-2.5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 md:bg-muted md:px-4 md:py-3">

                {selectedMedia &&
                  mediaPreview && (
                    <div className="mb-2 rounded-xl border border-border bg-card p-2 text-foreground">
                      <div className="relative inline-block max-w-full">

                        {selectedMedia.type.startsWith(
                          "image/",
                        ) ? (
                          <img
                            src={
                              mediaPreview
                            }
                            alt="Selected"
                            className="max-h-52 max-w-full rounded-lg object-contain"
                          />
                        ) : (
                          <video
                            src={
                              mediaPreview
                            }
                            controls
                            playsInline
                            className="max-h-52 max-w-full rounded-lg"
                          />
                        )}

                        <button
                          type="button"
                          onClick={
                            removeSelectedMedia
                          }
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-1 max-w-full truncate text-xs text-muted-foreground">
                        {
                          selectedMedia.name
                        }
                        {" · "}
                        {(
                          selectedMedia.size /
                          1024 /
                          1024
                        ).toFixed(1)}
                        MB
                      </div>
                    </div>
                  )}

                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi"
                  className="hidden"
                  onChange={
                    handleMediaSelect
                  }
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      mediaInputRef.current
                        ?.click()
                    }
                    disabled={
                      mediaSending
                    }
                    title="Photo or video"
                    className="h-11 w-11 shrink-0 rounded-full text-foreground hover:bg-muted"
                  >
                    <Plus className="h-7 w-7" />
                  </Button>

                  <div className="flex min-w-0 flex-1 items-center rounded-[23px] bg-muted px-3">
                    <Input
                      value={draft}
                      onChange={(e) =>
                        setDraft(
                          e.target.value,
                        )
                      }
                      placeholder="Type a message"
                      className="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                            "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();
                          selectedMedia
                            ? sendSelectedMedia()
                            : sendMessage();
                        }
                      }}
                    />
                    <Smile className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => mediaInputRef.current?.click()}
                    className="h-11 w-11 shrink-0 rounded-full text-foreground hover:bg-muted"
                    aria-label="Camera or media"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>

                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground shadow-none hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                    onClick={
                      selectedMedia
                        ? sendSelectedMedia
                        : sendMessage
                    }
                    disabled={
                      sending ||
                      mediaSending ||
                      (
                        !selectedMedia &&
                        !draft.trim()
                      )
                    }
                  >
                    {sending ||
                    mediaSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : draft.trim() || selectedMedia ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
      {call && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
            {call.mode === "video" ? <Video className="mx-auto h-10 w-10 text-primary" /> : <Phone className="mx-auto h-10 w-10 text-primary" />}
            <h2 className="mt-3 text-xl font-bold">
              {call.status === "calling"
                ? "Calling…"
                : call.status === "ringing"
                  ? "Ringing…"
                  : "Call connected"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-muted-foreground">
              {call.mode === "video" ? "Video call" : "Audio call"}
            </p>
            {call.mode === "video" && (
              <div className="relative mt-5 overflow-hidden rounded-xl bg-black aspect-video">
                <video
                  ref={bindRemoteVideo}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <video
                  ref={bindLocalVideo}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-3 right-3 h-24 w-16 -scale-x-100 rounded-lg border-2 border-white object-cover shadow-lg"
                />
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  const track = localStreamRef.current?.getAudioTracks()[0];
                  if (track) {
                    track.enabled = !track.enabled;
                    setCall({ ...call, muted: !track.enabled });
                  }
                }}
              >
                {call.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="destructive" onClick={() => endCall()}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {callNotice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
            <PhoneOff className="mx-auto h-10 w-10 text-muted-foreground md:text-muted-foreground" />
            <h2 className="mt-3 text-xl font-bold">{callNotice}</h2>
          </div>
        </div>
      )}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
            <Phone className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-3 text-lg font-bold">
              {incomingCall.mode === "video" ? "Incoming video call" : "Incoming audio call"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-muted-foreground">RoomKhoj user is calling you</p>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={acceptCall}>Accept</Button>
              <Button className="flex-1" variant="destructive" onClick={declineIncomingCall}>Decline</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default function MessagesPage() {
  return (
    <Suspense fallback={<main className="p-8 text-center text-sm text-muted-foreground md:text-muted-foreground">Loading messages…</main>}>
      <MessagesContent />
    </Suspense>
  );
}
