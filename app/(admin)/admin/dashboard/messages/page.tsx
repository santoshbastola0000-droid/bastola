"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminManagedMessageService,
  ManagedMessageAccount,
  ManagedMessageCandidate,
} from "@/http/services/admin-managed-message.service";
import type {
  ChatMessage,
  MessageConversation,
} from "@/http/services/message.service";

export default function AdminManagedMessagesPage() {
  const [accounts, setAccounts] = useState<
    ManagedMessageAccount[]
  >([]);
  const [candidates, setCandidates] = useState<
    ManagedMessageCandidate[]
  >([]);
  const [selectedUserIds, setSelectedUserIds] =
    useState<string[]>([]);
  const [accountId, setAccountId] =
    useState<string>("");
  const [conversations, setConversations] =
    useState<MessageConversation[]>([]);
  const [conversationId, setConversationId] =
    useState<string>("");
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAccounts, setSavingAccounts] =
    useState(false);
  const [sending, setSending] = useState(false);

  const activeAccount = useMemo(
    () =>
      accounts.find(
        (account) => account.userId === accountId,
      ) || null,
    [accounts, accountId],
  );

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (item) => item.id === conversationId,
      ) || null,
    [conversations, conversationId],
  );

  const loadAccounts = async () => {
    const data =
      await adminManagedMessageService.getAccounts();

    setAccounts(data);
    setSelectedUserIds(
      data.map((account) => account.userId),
    );

    setAccountId((current) => {
      if (
        current &&
        data.some(
          (account) => account.userId === current,
        )
      ) {
        return current;
      }

      return data[0]?.userId || "";
    });
  };

  const loadCandidates = async (
    query = "",
  ) => {
    const data =
      await adminManagedMessageService.searchUsers(
        query,
      );

    setCandidates(data);
  };

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadAccounts(),
          loadCandidates(),
        ]);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Managed message accounts load गर्न सकिएन.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCandidates(search).catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadConversations = async (
    managedAccountId: string,
  ) => {
    if (!managedAccountId) {
      setConversations([]);
      setConversationId("");
      return;
    }

    const result =
      await adminManagedMessageService.getConversations(
        managedAccountId,
      );

    setConversations(
      result.conversations || [],
    );

    setConversationId((current) => {
      if (
        current &&
        result.conversations.some(
          (item) => item.id === current,
        )
      ) {
        return current;
      }

      return result.conversations[0]?.id || "";
    });
  };

  useEffect(() => {
    if (!accountId) {
      setConversations([]);
      setConversationId("");
      return;
    }

    loadConversations(accountId).catch(
      (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            "Inbox load गर्न सकिएन.",
        );
      },
    );

    const timer = window.setInterval(() => {
      loadConversations(accountId).catch(() => {});
    }, 5000);

    return () => window.clearInterval(timer);
  }, [accountId]);

  const loadMessages = async (
    managedAccountId: string,
    selectedConversationId: string,
  ) => {
    if (
      !managedAccountId ||
      !selectedConversationId
    ) {
      setMessages([]);
      return;
    }

    const data =
      await adminManagedMessageService.getMessages(
        managedAccountId,
        selectedConversationId,
      );

    setMessages(data);
  };

  useEffect(() => {
    if (!accountId || !conversationId) {
      setMessages([]);
      return;
    }

    loadMessages(
      accountId,
      conversationId,
    ).catch(() => {});

    const timer = window.setInterval(() => {
      loadMessages(
        accountId,
        conversationId,
      ).catch(() => {});
    }, 3000);

    return () => window.clearInterval(timer);
  }, [accountId, conversationId]);

  const toggleManagedUser = (userId: string) => {
    setSelectedUserIds((current) => {
      if (current.includes(userId)) {
        return current.filter(
          (id) => id !== userId,
        );
      }

      if (current.length >= 4) {
        toast.error(
          "Maximum 4 वटा message account मात्र select गर्न मिल्छ.",
        );
        return current;
      }

      return [...current, userId];
    });
  };

  const saveAccounts = async () => {
    try {
      setSavingAccounts(true);

      const updated =
        await adminManagedMessageService.setAccounts(
          selectedUserIds,
        );

      setAccounts(updated);
      setAccountId((current) => {
        if (
          updated.some(
            (account) =>
              account.userId === current,
          )
        ) {
          return current;
        }

        return updated[0]?.userId || "";
      });

      toast.success(
        "Admin message accounts updated.",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Accounts update गर्न सकिएन.",
      );
    } finally {
      setSavingAccounts(false);
    }
  };

  const sendReply = async () => {
    const content = draft.trim();

    if (
      !content ||
      !accountId ||
      !conversationId
    ) {
      return;
    }

    try {
      setSending(true);

      const message =
        await adminManagedMessageService.reply(
          accountId,
          conversationId,
          content,
        );

      setMessages((current) => [
        ...current,
        message,
      ]);
      setDraft("");

      await loadConversations(accountId);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Reply send गर्न सकिएन.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">
          Managed Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maximum 4 user accounts select गरेर
          उनीहरूको inbox admin बाट manage गर्नुहोस्।
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            Message Accounts
            <span className="text-sm font-normal text-muted-foreground">
              ({selectedUserIds.length}/4)
            </span>
          </div>

          <Button
            onClick={saveAccounts}
            disabled={savingAccounts}
          >
            {savingAccounts ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Save selection
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search user by name, email or phone"
            className="pl-9"
          />
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {candidates.map((user) => {
            const checked =
              selectedUserIds.includes(user.id);

            return (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  toggleManagedUser(user.id)
                }
                className={
                  "rounded-lg border p-3 text-left transition " +
                  (checked
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {user.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.phoneNumber}
                    </div>
                  </div>

                  <div
                    className={
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border " +
                      (checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "")
                    }
                  >
                    {checked && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-xl border bg-background lg:grid-cols-[220px_320px_1fr]">
        <aside className="border-b p-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Selected accounts
          </div>

          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.userId}
                type="button"
                onClick={() => {
                  setAccountId(account.userId);
                  setConversationId("");
                  setMessages([]);
                }}
                className={
                  "w-full rounded-lg border p-3 text-left " +
                  (accountId === account.userId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted")
                }
              >
                <div className="truncate font-medium">
                  {account.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {account.phoneNumber}
                </div>
              </button>
            ))}

            {!accounts.length && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                माथिबाट user select गरेर Save
                गर्नुहोस्।
              </div>
            )}
          </div>
        </aside>

        <aside className="border-b p-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">
                Inbox
              </div>
              <div className="text-xs text-muted-foreground">
                {activeAccount?.name || "No account selected"}
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                accountId &&
                loadConversations(
                  accountId,
                ).catch(() => {})
              }
              disabled={!accountId}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {conversations.map(
              (conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() =>
                    setConversationId(
                      conversation.id,
                    )
                  }
                  className={
                    "w-full rounded-lg border p-3 text-left " +
                    (conversationId ===
                    conversation.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-medium">
                      {conversation.otherUser
                        ?.name ||
                        "RoomKhoj user"}
                    </div>
                    {!!conversation.unreadCount && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                        {
                          conversation.unreadCount
                        }
                      </span>
                    )}
                  </div>

                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {conversation.lastMessage
                      ?.content ||
                      "No messages yet"}
                  </div>
                </button>
              ),
            )}

            {accountId &&
              !conversations.length && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No conversations yet.
                </div>
              )}
          </div>
        </aside>

        <section className="flex min-h-[500px] flex-col">
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <MessageCircle className="h-10 w-10" />
              Conversation select गर्नुहोस्।
            </div>
          ) : (
            <>
              <div className="border-b p-4">
                <div className="font-semibold">
                  {activeConversation.otherUser
                    ?.name ||
                    "RoomKhoj user"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Replying as{" "}
                  <span className="font-medium text-foreground">
                    {activeAccount?.name}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => {
                  const mine =
                    message.senderId ===
                    accountId;

                  return (
                    <div
                      key={message.id}
                      className={
                        "flex " +
                        (mine
                          ? "justify-end"
                          : "justify-start")
                      }
                    >
                      <div
                        className={
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm " +
                          (mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted")
                        }
                      >
                        {message.content ||
                          (message.type ===
                          "IMAGE"
                            ? "Photo"
                            : message.type ===
                                "VIDEO"
                              ? "Video"
                              : "Message")}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={draft}
                    onChange={(event) =>
                      setDraft(
                        event.target.value,
                      )
                    }
                    placeholder={
                      activeAccount
                        ? `Reply as ${activeAccount.name}`
                        : "Type reply"
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        void sendReply();
                      }
                    }}
                  />

                  <Button
                    onClick={sendReply}
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
    </div>
  );
}
