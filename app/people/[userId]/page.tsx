"use client";

import { type ComponentType, useEffect, useState } from "react";

export default function PublicPeopleProfilePage() {
  const [ProfileClient, setProfileClient] = useState<ComponentType | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    import("../../profile/[userId]/ProfileClient")
      .then((module) => {
        if (active) setProfileClient(() => module.default);
      })
      .catch((error) => {
        console.error("People profile client failed to load", error);
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadFailed) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold">Profile load हुन सकेन</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Profile खोल्दा समस्या आयो। फेरि प्रयास गर्नुहोस्।
        </p>
      </main>
    );
  }

  if (!ProfileClient) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return <ProfileClient />;
}
