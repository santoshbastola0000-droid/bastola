import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Home,
  MapPin,
  Search,
} from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";

const title = "Room for Rent in Pokhara | RoomKhoj";

const description =
  "Find rooms, flats, apartments and houses for rent in Pokhara. Browse rental properties by location, monthly rent and room type on RoomKhoj.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,

  keywords: [
    "room for rent in Pokhara",
    "room rental Pokhara",
    "Pokhara room rent",
    "flat for rent in Pokhara",
    "apartment for rent in Pokhara",
    "house for rent in Pokhara",
    "single room in Pokhara",
    "room near Lakeside Pokhara",
  ],

  alternates: {
    canonical: "https://www.roomkhoj.com/rooms/pokhara",
  },

  openGraph: {
    title,
    description,
    url: "https://www.roomkhoj.com/rooms/pokhara",
    siteName: "RoomKhoj",
    locale: "en_NP",
    type: "website",
    images: [
      {
        url: "https://www.roomkhoj.com/roomkhoj-logo.png",
        width: 1254,
        height: 1254,
        alt: "Room for Rent in Pokhara - RoomKhoj",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const roomTypes = [
  {
    title: "Single Room",
    href: "/rooms?q=Pokhara&cat=Single",
    icon: Home,
  },
  {
    title: "Flat",
    href: "/rooms?q=Pokhara&cat=Flat",
    icon: Building2,
  },
  {
    title: "Apartment",
    href: "/rooms?q=Pokhara&cat=Apartment",
    icon: Building2,
  },
  {
    title: "House",
    href: "/rooms?q=Pokhara&cat=House",
    icon: Home,
  },
];

const pokharaAreas = [
  "Lakeside",
  "New Road",
  "Chipledhunga",
  "Mahendrapul",
  "Prithvi Chowk",
  "Bagar",
  "Birauta",
  "Nadipur",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: title,
  description,
  url: "https://www.roomkhoj.com/rooms/pokhara",
  about: {
    "@type": "Thing",
    name: "Rental rooms in Pokhara",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "RoomKhoj",
    url: "https://www.roomkhoj.com",
  },
};

export default function PokharaRoomsPage() {
  return (
    <>
      <NavBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <main className="min-h-screen bg-slate-50">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-4 pb-20 pt-32 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              <MapPin className="h-4 w-4" />
              Pokhara, Nepal
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Room for Rent in Pokhara
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Pokhara मा आफ्नो budget र location अनुसार room, flat,
              apartment वा house खोज्नुहोस्। RoomKhoj मा rental price,
              facilities र room details तुलना गर्न सक्नुहुन्छ।
            </p>

            <Link
              href="/rooms?q=Pokhara"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              <Search className="h-5 w-5" />
              Browse Pokhara Rooms
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-semibold text-red-600">
            Browse by room type
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Pokhara मा कस्तो room चाहिन्छ?
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roomTypes.map(({ title: roomTitle, href, icon: Icon }) => (
              <Link
                key={roomTitle}
                href={href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-300"
              >
                <Icon className="mb-4 h-7 w-7 text-red-600" />
                <h3 className="font-semibold text-slate-900">
                  {roomTitle} in Pokhara
                </h3>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Popular room locations in Pokhara
            </h2>

            <div className="mt-7 flex flex-wrap gap-3">
              {pokharaAreas.map((area) => (
                <Link
                  key={area}
                  href={`/rooms?q=${encodeURIComponent(`${area} Pokhara`)}`}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100"
                >
                  Room in {area}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Find rental rooms in Pokhara with RoomKhoj
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            RoomKhoj helps students, employees, families and individuals
            search for rental rooms in Pokhara. Browse available rooms by
            area, monthly budget and property type before opening the full
            listing details.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
