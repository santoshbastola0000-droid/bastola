"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function PostShareButton({
  title = "RoomKhoj post",
}: {
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          await navigator.share({ title, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100"
    >
      <Share2 className="h-5 w-5" />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
