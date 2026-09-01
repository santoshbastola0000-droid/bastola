"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
  role: string;
  isVerified: boolean;
};

export default function AdminMessagesPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<MessageConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

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
    const timer = window.setTimeout(() => void loadUsers(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const openUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedConversation(null);
    setMessages([]);
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Admin review access. Opening a conversation creates a visible system
          notice for its users.
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
                      {conversation.otherUser?.name ||
                        conversation.otherUser?.phoneNumber ||
                        "Unknown user"}
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
        </div>
      </div>
    </div>
  );
}
