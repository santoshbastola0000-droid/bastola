"use client";

import { useEffect } from "react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public profile route error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold">Profile load हुन सकेन</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Profile खोल्दा temporary error आयो। फेरि प्रयास गर्नुहोस्।
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        Retry
      </button>
    </main>
  );
}
