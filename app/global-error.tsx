"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global runtime error:", error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Application temporarily unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            An unexpected error occurred while rendering the app.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button onClick={reset}>Retry</Button>
            <Button asChild variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
