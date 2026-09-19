import type { Metadata } from "next";
import type { ReactNode } from "react";

const baseUrl = "https://www.roomkhoj.com";
const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type PublicRoom = {
  id: string;
  title?: string | null;
  description?: string | null;
  images?: string[] | null;
  price?: number | string | null;
  approvalStatus?: string | null;
  listingStatus?: string | null;
  location?: {
    city?: string | null;
    name?: string | null;
  } | null;
};

function media(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

async function getRoom(id: string): Promise<PublicRoom | null> {
  try {
    const response = await fetch(
      `${backendUrl}/rooms/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return (payload?.data || payload) as PublicRoom;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const room = await getRoom(id);

  if (!room) {
    return {
      title: "Room not found | RoomKhoj",
      robots: { index: false, follow: false },
    };
  }

  const cleanTitle = String(room.title || "Room for rent").replace(/\s+/g, " ").trim();
  const cleanDescription = String(room.description || "")
    .replace(/\s+/g, " ")
    .trim();
  const city = room.location?.city || room.location?.name || "Nepal";
  const title = `${cleanTitle} in ${city} | RoomKhoj`;
  const description =
    cleanDescription.slice(0, 155) ||
    `Find this room for rent in ${city} on RoomKhoj.`;
  const canonical = `${baseUrl}/property/${room.id}`;
  const image = room.images?.[0] ? media(room.images[0]) : "";
  const isPublic =
    String(room.approvalStatus || "").toLowerCase() === "approved" &&
    String(room.listingStatus || "").toLowerCase() === "available";

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: isPublic, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "RoomKhoj",
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return children;
}
