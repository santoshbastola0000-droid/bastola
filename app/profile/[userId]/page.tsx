"use client";

import dynamic from "next/dynamic";

const ProfileClient = dynamic(() => import("./ProfileClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[500px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading profile...</p>
    </div>
  ),
});

export default function PublicProfilePage() {
  return <ProfileClient />;
}
