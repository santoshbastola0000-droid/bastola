"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChatMessage,
  MessageConversation,
  messageService,
} from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";

export default function MessagesPage() {
  const user = useUserStore(
    (state) => state.user,
  );

  const currentUserId =
    user?.id || "";

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

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [phoneResult, setPhoneResult] =
    useState<{
      id: string;
      name: string;
      phoneNumber: string;
    } | null>(null);

  const [phoneSearching, setPhoneSearching] =
    useState(false);

  const [draft, setDraft] =
    useState("");

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
  }, []);

  const searchByPhone =
    async () => {
      const phone =
        phoneNumber.replace(/\D/g, "");

      if (phone.length !== 10) {
        toast.error(
          "10-digit phone number राख्नुहोस्.",
        );
        return;
      }

      try {
        setPhoneSearching(true);
        setPhoneResult(null);

        const result =
          await messageService.startByPhone(
            phone,
          );

        setPhoneResult(result.user);

        await loadConversations();

        await openConversation(
          result.conversation,
        );
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
    selected
      ? selected.userOneId ===
        currentUserId
        ? selected.userTwoId
        : selected.userOneId
      : "";

  return (
    <main className="mx-auto min-h-[calc(100vh-70px)] max-w-7xl bg-background md:p-4">
      <div className="grid min-h-[calc(100vh-90px)] overflow-hidden border bg-background md:grid-cols-[340px_1fr] md:rounded-2xl">
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
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      )
                    }
                    placeholder="98XXXXXXXX"
                    inputMode="numeric"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchByPhone();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={searchByPhone}
                  disabled={
                    phoneSearching ||
                    phoneNumber.length !== 10
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
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="font-medium">
                    {phoneResult.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {phoneResult.phoneNumber}
                  </p>
                </div>
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
                            User{" "}
                            {otherId?.slice(
                              0,
                              8,
                            )}
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

                <div>
                  <p className="font-semibold">
                    User{" "}
                    {otherUserId.slice(
                      0,
                      8,
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {selected.contextType}
                  </p>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                            <p className="whitespace-pre-wrap break-words">
                              {
                                message.content
                              }
                            </p>

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

                              {mine &&
                              message.seenAt
                                ? " · Seen"
                                : ""}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>

              <div className="border-t p-3">
                <div className="flex gap-2">
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
                      sendMessage
                    }
                    disabled={
                      sending ||
                      !draft.trim()
                    }
                  >
                    {sending ? (
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
  );
}
