"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import { Hero } from "@/components/home/hero";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { CTASection } from "@/components/home/cta-section";
import Footer from "@/components/common/footer";
import { PropertyCard } from "@/components/rooms/PropertyCard";
import { useRooms } from "@/hooks/use-rooms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { categoryConfig } from "@/lib/room-utils";
import { formatPriceNPR, resolveImageUrl } from "@/lib/utils";
import { RoomCategory } from "@/types/room.types";

const HOME_CATEGORIES: RoomCategory[] = [
  RoomCategory.APARTMENT,
  RoomCategory.FLAT,
  RoomCategory.SINGLE,
  RoomCategory.DOUBLE,
  RoomCategory.SHARED,
  RoomCategory.HOUSE,
];

const BROWSE_HIGHLIGHTS = [
  "Monthly rent shown early on every room card",
  "Women-friendly and tenant preference badges surface faster",
  "Room chatbot can now answer room-related questions too",
  "Admin panel can teach the chatbot extra room answers",
];

export default function Home() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const { rawRooms, loading, pagination } = useRooms({
    approvalStatus: undefined,
  });

  const latestRooms = rawRooms.slice(0, 6);
  const spotlightRoom = rawRooms[0];

  const budgetRooms = useMemo(
    () => [...rawRooms].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 3),
    [rawRooms],
  );

  const womenFriendlyRooms = useMemo(
    () => rawRooms.filter((room) => room.allowsWomen).slice(0, 3),
    [rawRooms],
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("q", searchInput.trim());
    router.push(params.toString() ? `/rooms?${params.toString()}` : "/rooms");
  };

  return (
    <>
      <NavBar />
      <Hero />

      <section className="relative -mt-16 z-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-2xl p-5 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge className="mb-3 bg-red-50 text-red-600 border-red-200">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Easier room browsing
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Search faster, compare faster, and open the best rooms first
                </h2>
                <p className="text-slate-500 mt-2">
                  Browse by category, budget, women-friendly preference, and
                  location—without jumping through too many screens.
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-xl gap-3 flex-col sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by room, city, area, or feature"
                    className="pl-10 h-11"
                  />
                </div>
                <Button type="submit" size="lg" className="cursor-pointer">
                  Find Rooms
                </Button>
              </form>
            </div>

            <div className="grid gap-3 md:grid-cols-3 mt-6">
              {[
                {
                  icon: Compass,
                  title: `${pagination?.total ?? rawRooms.length} rooms`,
                  text: "Fresh listings ready to browse",
                },
                {
                  icon: ShieldCheck,
                  title: "Clear room details",
                  text: "Amenities, tenant rules, and unlock info",
                },
                {
                  icon: Wallet,
                  title: "Budget-first browsing",
                  text: "Compare monthly rent before opening each room",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500 mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 mb-2">
                Browse by category
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">
                Start with the room type you want
              </h3>
            </div>
            <Button asChild variant="ghost" className="text-red-600 cursor-pointer">
              <Link href="/rooms">
                View all rooms
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            {HOME_CATEGORIES.map((category) => {
              const config = categoryConfig[category];
              return (
                <Link
                  key={category}
                  href={`/rooms?cat=${encodeURIComponent(category)}`}
                  className="rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                  style={{
                    color: config?.color || "#dc2626",
                    background: config?.bg || "#fff1f2",
                    borderColor: `${config?.color || "#fecdd3"}22`,
                  }}
                >
                  {config?.labelNp || category}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {spotlightRoom && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative min-h-[420px] rounded-[2rem] overflow-hidden"
              >
                <img
                  src={resolveImageUrl(spotlightRoom.images?.[0]) || "/placeholder.svg"}
                  alt={spotlightRoom.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                <div className="relative z-10 h-full p-6 md:p-8 flex flex-col justify-end">
                  <Badge className="w-fit bg-white/15 text-white border-white/20 mb-4">
                    Spotlight room
                  </Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">
                    {spotlightRoom.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 text-sm">
                    <span>{formatPriceNPR(Number(spotlightRoom.price))}/month</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {spotlightRoom.location?.city || spotlightRoom.address}
                    </span>
                    <span>{spotlightRoom.roomCapacity} people</span>
                  </div>
                  <p className="mt-4 max-w-2xl text-white/75 line-clamp-3">
                    {spotlightRoom.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="cursor-pointer">
                      <Link href={`/property/${spotlightRoom.id}`}>Open Room</Link>
                    </Button>
                    <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer">
                      <Link href="/rooms">Browse more rooms</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
                <Badge className="bg-red-50 text-red-600 border-red-200 mb-3">
                  Best way to browse
                </Badge>
                <h3 className="text-2xl font-bold text-slate-900">
                  Open rooms with the details people care about first
                </h3>
                <div className="space-y-4 mt-6">
                  {BROWSE_HIGHLIGHTS.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-10 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <Badge className="bg-red-50 text-red-600 border-red-200 mb-2">
                Latest rooms
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">
                Fresh rooms ready to explore
              </h3>
            </div>
            <Button asChild variant="ghost" className="text-red-600 cursor-pointer">
              <Link href="/rooms">
                Browse full listing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] rounded-3xl bg-slate-200/70 animate-pulse"
                />
              ))}
            </div>
          ) : latestRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {latestRooms.map((room, index) => (
                <PropertyCard key={room.id} room={room} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h4 className="text-xl font-semibold text-slate-900">No rooms yet</h4>
              <p className="text-slate-500 mt-2">
                Rooms will appear here as soon as listings are available.
              </p>
            </div>
          )}
        </div>
      </section>

      {(budgetRooms.length > 0 || womenFriendlyRooms.length > 0) && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-3">
                Budget picks
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">
                Lower-price rooms first
              </h3>
              <div className="space-y-4 mt-6">
                {budgetRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/property/${room.id}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-red-200 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {room.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {room.location?.city || room.address}
                        </p>
                      </div>
                      <p className="font-semibold text-red-600 shrink-0">
                        {formatPriceNPR(Number(room.price))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <Badge className="bg-pink-50 text-pink-700 border-pink-200 mb-3">
                Women-friendly
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">
                Rooms that already highlight women-friendly access
              </h3>
              <div className="space-y-4 mt-6">
                {womenFriendlyRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/property/${room.id}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-pink-200 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {room.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {room.location?.city || room.address}
                        </p>
                      </div>
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200 shrink-0">
                        Women OK
                      </Badge>
                    </div>
                  </Link>
                ))}
                {womenFriendlyRooms.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Women-friendly rooms will appear here when available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <WhyChooseUs />
      <CTASection />
      <Footer />
    </>
  );
}
