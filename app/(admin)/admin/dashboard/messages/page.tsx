"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChatMessage,
  MessageConversation,
  messageService,
} from "@/http/services/message.service";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role?: string;
  isVerified?: boolean;
};

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<MessageConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const loadUsers = async (q = "") => {
    try {
      setLoadingUsers(true);
      setUsers(await messageService.adminListUsers(q));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Users load गर्न सकिएन.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!requestedUserId) return;

    let cancelled = false;

    const openRequestedUser = async () => {
      try {
        setLoadingConversations(true);
        const data =
          await messageService.adminGetUserConversations(requestedUserId);

        if (cancelled) return;

        setSelectedUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
        });
        setConversations(data.conversations || []);
        setSelectedConversation(null);
        setMessages([]);
        setReplyText("");
      } catch (error: any) {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
              "User conversations load गर्न सकिएन.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    };

    void openRequestedUser();

    return () => {
      cancelled = true;
    };
  }, [requestedUserId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const openUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedConversation(null);
    setMessages([]);
    setReplyText("");
    try {
      setLoadingConversations(true);
      const data = await messageService.adminGetUserConversations(user.id);
      setConversations(data.conversations || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Conversations load गर्न सकिएन.",
      );
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = async (conversation: MessageConversation) => {
    setSelectedConversation(conversation);
    setReplyText("");
    try {
      setLoadingMessages(true);
      setMessages(
        await messageService.adminGetConversationMessages(conversation.id),
      );
      toast.success("Users were notified that RoomKhoj Admin accessed this chat.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Messages load गर्न सकिएन.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendAdminReply = async () => {
    const content = replyText.trim();
    if (!content || !selectedConversation || !selectedUser) return;

    const selectedIsParticipant =
      selectedConversation.userOneId === selectedUser.id ||
      selectedConversation.userTwoId === selectedUser.id;

    if (!selectedIsParticipant) {
      toast.error("Selected user यो conversation को participant होइन.");
      return;
    }

    try {
      setSendingReply(true);
      await messageService.adminReplyAsUser(
        selectedConversation.id,
        selectedUser.id,
        content,
      );
      setReplyText("");
      setMessages(
        await messageService.adminGetConversationMessages(
          selectedConversation.id,
        ),
      );
      toast.success(
        `${selectedUser.name} को account बाट support reply पठाइयो. Users लाई admin action notice देखिन्छ.`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Support reply पठाउन सकिएन.",
      );
    } finally {
      setSendingReply(false);
    }
  };

  const canReply = Boolean(
    selectedUser &&
      selectedConversation &&
      (selectedConversation.userOneId === selectedUser.id ||
        selectedConversation.userTwoId === selectedUser.id),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Admin review access. Opening a conversation creates a visible system
          notice. Support replies sent as a user also create a visible admin
          audit notice for both participants.
        </p>
      </div>

      <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[300px_320px_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, phone or email"
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[64vh] overflow-y-auto">
            {loadingUsers ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => void openUser(user)}
                  className={`w-full border-b p-3 text-left hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.phoneNumber}</div>
                  <div className="truncate text-xs text-gray-400">{user.email}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="border-b lg:border-b-0 lg:border-r">
          <div className="border-b p-4 font-semibold text-gray-900">
            {selectedUser ? `${selectedUser.name} · Conversations` : "Conversations"}
          </div>
          <div className="max-h-[64vh] overflow-y-auto">
            {!selectedUser ? (
              <p className="p-6 text-sm text-gray-500">Select a user first.</p>
            ) : loadingConversations ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No conversations.</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => void openConversation(conversation)}
                  className={`w-full border-b p-3 text-left hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="truncate font-medium text-gray-900">
                      {conversation.otherUser?.name || "Unknown user"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {conversation.lastMessage?.content ||
                      (conversation.lastMessage?.type
                        ? `[${conversation.lastMessage.type}]`
                        : "No messages yet")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-[420px] flex-col">
          <div className="flex items-center gap-2 border-b p-4">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">
              {selectedConversation
                ? `${selectedUser?.name || "User"} ↔ ${
                    selectedConversation.otherUser?.name || "User"
                  }`
                : "Message history"}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {!selectedConversation ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Select a conversation.
              </div>
            ) : loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              messages.map((message) => {
                const isSystem = message.type === "SYSTEM";
                const fromSelected = message.senderId === selectedUser?.id;

                if (isSystem) {
                  return (
                    <div
                      key={message.id}
                      className="mx-auto max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800"
                    >
                      {message.content}
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      fromSelected ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        fromSelected
                          ? "bg-primary text-primary-foreground"
                          : "border bg-white text-gray-900"
                      }`}
                    >
                      {message.content ||
                        (message.type === "IMAGE"
                          ? "[Photo]"
                          : message.type === "VIDEO"
                            ? "[Video]"
                            : `[${message.type}]`)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedConversation && selectedUser && (
            <div className="border-t bg-white p-3">
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Reply will be sent as <strong>{selectedUser.name}</strong>.
                RoomKhoj will insert a visible Admin support notice in this chat.
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!sendingReply && canReply && replyText.trim()) {
                        void sendAdminReply();
                      }
                    }
                  }}
                  disabled={!canReply || sendingReply}
                  placeholder={
                    canReply
                      ? `Support reply as ${selectedUser.name}`
                      : "Selected user is not a participant in this chat"
                  }
                  maxLength={5000}
                  rows={2}
                  className="min-h-[48px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-100"
                />
                <Button
                  type="button"
                  onClick={() => void sendAdminReply()}
                  disabled={!canReply || sendingReply || !replyText.trim()}
                  className="h-12 rounded-xl px-4"
                >
                  {sendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Send</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}