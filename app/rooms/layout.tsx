import type { Metadata } from "next";

const title = "Rooms, Flats & Houses for Rent in Nepal | RoomKhoj";

const description =
  "Find rooms, flats, apartments, houses and hostels for rent across Nepal. Compare location, monthly rent and facilities on RoomKhoj.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,

  keywords: [
    "room for rent in Nepal",
    "room rental Nepal",
    "flat for rent in Nepal",
    "apartment for rent in Nepal",
    "house for rent in Nepal",
    "hostel in Nepal",
    "rental rooms near me",
    "RoomKhoj",
  ],

  alternates: {
    canonical: "https://www.roomkhoj.com/rooms",
  },

  openGraph: {
    title,
    description,
    url: "https://www.roomkhoj.com/rooms",
    siteName: "RoomKhoj",
    locale: "en_NP",
    type: "website",
    images: [
      {
        url: "https://www.roomkhoj.com/roomkhoj-logo.png",
        width: 1254,
        height: 1254,
        alt: "RoomKhoj - Rooms for Rent in Nepal",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://www.roomkhoj.com/roomkhoj-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RoomKhoj",
  url: "https://www.roomkhoj.com",
  description:
    "Find rooms, flats, houses and job opportunities through RoomKhoj.",
  inLanguage: ["en-NP", "ne-NP"],
};

export default function RoomsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      {children}
    </>
  );
}
