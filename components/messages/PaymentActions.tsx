"use client";

import { useState } from "react";
import { Banknote, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChatMessage,
  MessagePaymentAction,
  messageService,
} from "@/http/services/message.service";

export function PaymentActions({
  conversationId,
  onSent,
}: {
  conversationId: string;
  onSent: (message: ChatMessage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<MessagePaymentAction>("PAYMENT_REQUEST");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Valid amount राख्नुहोस्.");
      return;
    }

    try {
      setSending(true);
      setError("");
      const message = await messageService.sendPaymentAction(
        conversationId,
        action,
        numericAmount,
        note,
      );
      onSent(message);
      setAmount("");
      setNote("");
      setOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Request send गर्न सकिएन.");
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
      >
        <Banknote className="h-5 w-5 text-primary" />
        Payment actions
      </button>
    );
  }

  return (
    <div className="w-72 rounded-2xl border border-border bg-card p-3 shadow-xl">
      <div className="grid grid-cols-3 gap-1">
        <Button
          type="button"
          size="sm"
          variant={action === "PAYMENT_REQUEST" ? "default" : "outline"}
          onClick={() => setAction("PAYMENT_REQUEST")}
          className="h-auto py-2 text-[11px]"
        >
          Request
        </Button>
        <Button
          type="button"
          size="sm"
          variant={action === "PAYMENT_CONFIRM" ? "default" : "outline"}
          onClick={() => setAction("PAYMENT_CONFIRM")}
          className="h-auto py-2 text-[11px]"
        >
          Confirm
        </Button>
        <Button
          type="button"
          size="sm"
          variant={action === "RELEASE_REQUEST" ? "default" : "outline"}
          onClick={() => setAction("RELEASE_REQUEST")}
          className="h-auto py-2 text-[11px]"
        >
          Release
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="Amount (NPR)"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Note (optional)"
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => void submit()}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : action === "PAYMENT_CONFIRM" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : action === "RELEASE_REQUEST" ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Banknote className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
