"use client";

import {
  useEffect,
  useRef,
  useState,
  useMemo,
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

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");

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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [call, setCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [socket, setSocket] =
    useState<Socket | null>(null);

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

  const [contactSearch, setContactSearch] =
    useState("");

  const [phoneResult, setPhoneResult] =
    useState<{
      id: string;
      name: string;
      email?: string;
      phoneNumber: string;
    } | null>(null);

  const [phoneSearching, setPhoneSearching] =
    useState(false);

  const [draft, setDraft] =
    useState("");

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
    if (!currentUserId) return;

    const nextSocket = io(
      "https://api.roomkhoj.com/messages",
      {
        transports: ["websocket"],
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
      }
      if (signal.type === "answer" && peerRef.current) {
        await peerRef.current.setRemoteDescription(signal.payload);
        setCall((current: any) =>
          current ? { ...current, status: "connected", connected: true } : current,
        );
      }
      if (signal.type === "candidate" && peerRef.current && signal.payload) {
        await peerRef.current.addIceCandidate(signal.payload);
      }
      if (signal.type === "end") {
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
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [currentUserId, authToken]);


  const searchByContact =
    async () => {
      const contact =
        contactSearch.trim();

      if (!contact) {
        toast.error(
          "Phone number वा email राख्नुहोस्.",
        );
        return;
      }

      try {
        setPhoneSearching(true);
        setPhoneResult(null);

        const result =
          await messageService.findProfileByContact(
            contact,
          );

        setPhoneResult(result);

        // Finding a number must never create a conversation.

      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "यो नम्बर भएको user भेटिएन.",
        );
      } finally {
        setPhoneSearching(false);
      }
    };

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

  const sendCallSignal = (targetUserId: string, callId: string, type: string, payload?: any, mode?: string) => {
    socket?.emit("call:signal", { targetUserId, callId, type, payload, mode });
  };

  const createPeer = async (targetUserId: string, callId: string, mode: "audio" | "video") => {
    const credentials = await messageService.getCallCredentials();
    const peer = new RTCPeerConnection({ iceServers: credentials.iceServers });
    peer.onicecandidate = (event) => {
      if (event.candidate) sendCallSignal(targetUserId, callId, "candidate", event.candidate, mode);
    };
    peer.ontrack = (event) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
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

  const startCall = async (mode: "audio" | "video") => {
    if (!selected || !otherUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
      localStreamRef.current = stream;
      const callId = crypto.randomUUID();
      const peer = await createPeer(otherUserId, callId, mode);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendCallSignal(otherUserId, callId, "offer", offer, mode);
      setCall({ callId, targetUserId: otherUserId, mode, status: "calling", connected: false, muted: false });
      setCallNotice(null);
    } catch {
      toast.error("Microphone/camera permission दिनुहोस्।");
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
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendCallSignal(incomingCall.fromUserId, incomingCall.callId, "answer", answer, incomingCall.mode);
      setCall({ callId: incomingCall.callId, targetUserId: incomingCall.fromUserId, mode: incomingCall.mode, status: "connected", connected: true, muted: false });
      setIncomingCall(null);
    } catch { toast.error("Call सुरु हुन सकेन।"); }
  };

  const endCall = (notify = true, notice = "Call ended") => {
    if (notify && call) sendCallSignal(call.targetUserId, call.callId, "end");
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
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
    endCall(false);
  };

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

        const message =
          await messageService.sendMessage(
            selected.id,
            text,
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

  const filtered =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      if (!q) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          conversation.contextType
            ?.toLowerCase()
            .includes(q) ||
          conversation.id
            .toLowerCase()
            .includes(q),
      );
    }, [conversations, search]);

  const otherUserId =
    selected?.otherUser?.id ||
    selected?.otherUserId ||
    (selected
      ? selected.userOneId === currentUserId
        ? selected.userTwoId
        : selected.userOneId
      : "");

  return (
    <>
    <main className="mx-auto h-[calc(100dvh-68px)] max-w-7xl overflow-hidden bg-background md:h-[calc(100dvh-24px)] md:p-4">
      <div className="grid h-full min-h-0 overflow-hidden border bg-background md:grid-cols-[340px_1fr] md:rounded-2xl">
        <aside
          className={`border-r ${
            selected
              ? "hidden md:block"
              : "block"
          }`}
        >
          <div className="border-b p-4">
            <h1 className="text-xl font-bold">
              Messages
            </h1>

            <div className="mt-4 rounded-xl border p-3">
              <p className="mb-2 text-sm font-medium">
                Start chat by phone number
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={contactSearch}
                    onChange={(e) =>
                      setContactSearch(
                        e.target.value
                          ,
                      )
                    }
                    placeholder="Phone number or email"
                    inputMode="text"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchByContact();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={searchByContact}
                  disabled={
                    phoneSearching ||
                    !contactSearch.trim()
                  }
                >
                  {phoneSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {phoneResult && (
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${phoneResult.id}`)}
                  className="mt-3 w-full rounded-lg bg-muted p-3 text-left hover:bg-muted/80"
                >
                  <p className="font-medium">{phoneResult.name}</p>
                  <p className="text-sm text-muted-foreground">{phoneResult.phoneNumber}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">Profile हेर्नुहोस् → त्यहाँबाट Message गर्नुहोस्</p>
                </button>
              )}
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
                placeholder="Search chats"
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
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
                      className="flex w-full gap-3 p-4 text-left hover:bg-muted/50"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                        {otherId
                          ?.slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium">
                            {conversation.otherUser
                              ?.phoneNumber ||
                              otherId}
                          </p>

                          {conversation.unreadCount >
                            0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conversation
                            .lastMessage
                            ?.content ||
                            "Start conversation"}
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
          className={`flex min-h-0 flex-col ${
            !selected
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-center">
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
              <header className="flex items-center gap-3 border-b p-4">
                <button
                  type="button"
                  className="text-sm md:hidden"
                  onClick={() =>
                    setSelected(null)
                  }
                >
                  ← Back
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold">
                  {otherUserId
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="flex-1">
                  <p className="font-semibold">
                    {selected.otherUser
                      ?.phoneNumber ||
                      otherUserId}
                  </p>

                  {selected.otherUser?.name && (
                    <p className="text-xs text-muted-foreground">
                      {selected.otherUser.name}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {selected.contextType}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button type="button" size="icon" variant="outline" onClick={() => startCall("audio")} aria-label="Audio call"><Phone className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="outline" onClick={() => startCall("video")} aria-label="Video call"><Video className="h-4 w-4" /></Button>
                </div>
              </header>
              <audio ref={remoteAudioRef} autoPlay />
              {call && (
                <div className="m-3 flex items-center justify-between rounded-xl border bg-muted p-3">
                  <span className="font-medium">
                    {call.status === "calling" ? "Calling…" : "Call connected"}
                  </span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => {
                      const track = localStreamRef.current?.getAudioTracks()[0];
                      if (track) {
                        track.enabled = !track.enabled;
                        setCall({ ...call, muted: !track.enabled });
                      }
                    }}>
                      {call.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => endCall()}><PhoneOff className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
              {callNotice && (
                <p className="mx-3 rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                  {callNotice}
                </p>
              )}

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-24">
                {messagesLoading ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
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
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
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
                                  className="mb-2 max-h-[420px] w-auto max-w-full rounded-xl object-contain"
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
                                  className="mb-2 max-h-[420px] w-full rounded-xl"
                                />
                              )}

                            {message.content && (
                              <p className="whitespace-pre-wrap break-words">
                                {
                                  message.content
                                }
                              </p>
                            )}

                            <p className="mt-1 text-[10px] opacity-70">
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
                                      ? "text-sky-300"
                                      : ""
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
              </div>

              <div className="sticky bottom-[68px] z-20 border-t bg-background md:bottom-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">

                {selectedMedia &&
                  mediaPreview && (
                    <div className="mb-3 rounded-xl border bg-background p-2">
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      mediaInputRef.current
                        ?.click()
                    }
                    disabled={
                      mediaSending
                    }
                    title="Photo or video"
                  >
                    📎
                  </Button>
                  <Input
                    value={draft}
                    onChange={(e) =>
                      setDraft(
                        e.target.value,
                      )
                    }
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                          "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />

                  <Button
                    size="icon"
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
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
            <Phone className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-3 text-lg font-bold">
              {incomingCall.mode === "video" ? "Incoming video call" : "Incoming audio call"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">RoomKhoj user is calling you</p>
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
    <Suspense fallback={<main className="p-8 text-center text-sm text-muted-foreground">Loading messages…</main>}>
      <MessagesContent />
    </Suspense>
  );
}
