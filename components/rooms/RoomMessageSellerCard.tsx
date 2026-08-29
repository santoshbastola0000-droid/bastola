"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { messageService } from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";

const DEFAULT_MESSAGE = "Hello, is this still available?";

export function RoomMessageSellerCard({
  roomId,
  roomTitle,
}: {
  roomId: string;
  roomTitle: string;
}) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isLoaded = useUserStore((state) => state.isLoaded);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const content = message.trim();
    if (!content || sending) return;

    if (!isLoaded || !user) {
      sessionStorage.setItem(
        "roomkhoj_post_auth_redirect",
        `/property/${roomId}`,
      );
      router.push("/auth/login");
      return;
    }

    try {
      setSending(true);

      const result = await messageService.startForRoom(roomId);
      await messageService.sendMessage(
        result.conversation.id,
        content,
        roomId,
      );

      sessionStorage.setItem(
        "roomkhoj_last_room_message_context",
        JSON.stringify({
          conversationId: result.conversation.id,
          room: result.room,
          sentText: content,
        }),
      );

      router.push(
        `/messages?conversation=${encodeURIComponent(result.conversation.id)}`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Message पठाउन सकिएन।",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-950">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
          <MessageCircle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold leading-tight">Message seller</p>
          <p className="truncate text-[11px] text-slate-500">{roomTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-slate-50 p-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void sendMessage();
            }
          }}
          aria-label="Message seller"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={DEFAULT_MESSAGE}
        />

        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={!message.trim() || sending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          <span className="hidden xs:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
