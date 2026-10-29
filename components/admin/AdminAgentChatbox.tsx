"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Headset, X } from "lucide-react";

const Inbox = dynamic(
  () => import("@/components/office/RoomAdminInbox").then(module => module.RoomAdminInbox),
  { loading: () => <p className="p-6 text-sm text-slate-500">Loading chats…</p> },
);

// Mounted only inside the authenticated admin layout. The API also checks roles.
export function AdminAgentChatbox() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
      className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:right-6">
      <Headset aria-hidden="true" className="h-5 w-5"/>Agent
    </button>
    <dialog ref={dialog} aria-labelledby="admin-agent-title" onClose={() => setOpen(false)}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_1rem)] max-w-6xl overflow-y-auto rounded-2xl border bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/40">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2"><Headset className="h-5 w-5 text-primary" aria-hidden="true"/><div><h2 id="admin-agent-title" className="font-bold">Room Khoj Agent</h2><p className="text-xs text-slate-500">Private customer messages · Admin only</p></div></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close Agent chatbox" className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button>
      </header>
      <div className="p-3 md:p-4">{open && <Inbox/>}</div>
    </dialog>
  </>;
}

