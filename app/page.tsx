"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/common/navbar";
import { Hero } from "@/components/home/hero";
import { SearchBar } from "@/components/search-bar";
import { RoomGrid } from "@/components/room-grid";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import Footer from "@/components/common/footer";
import { useRooms } from "@/hooks/use-rooms";
import { Loader2, Home as HomeIcon, MapPin, Users, Star } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import type { RoomFilters } from "@/types/room.types";

export default function Home() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
  } | null>(null);

  // Convert location to RoomFilters
  const filters: RoomFilters | undefined = location
    ? {
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 10, // Search within 10km radius
      }
    : undefined;

  const { rooms, loading, error } = useRooms(filters);
  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const stats = [
    {
      icon: HomeIcon,
      value: 2500,
      label: "Properties",
      suffix: "+",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: MapPin,
      value: 50,
      label: "Cities",
      suffix: "+",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Users,
      value: 10000,
      label: "Happy Tenants",
      suffix: "+",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Star,
      value: 4.9,
      label: "Rating",
      suffix: "/5",
      color: "from-red-500 to-purple-500",
      decimals: 1,
    },
  ];

  return (
    <>
      <NavBar />

      <Hero />

      {/* Search Section */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Find Your Perfect Space
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Search Available Rooms
            </h2>
            <p className="text-slate-600 mt-4">
              Discover thousands of verified properties across the country
            </p>
          </motion.div>

          <SearchBar onLocationFound={setLocation} />
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef}
        className="py-16 bg-white border-y border-slate-100"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">
                  {statsInView && (
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      decimals={stat.decimals || 0}
                      suffix={stat.suffix}
                    />
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Featured Properties
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              {location?.city
                ? `Rooms in ${location.city}`
                : "Available Rooms Near You"}
            </h2>
            <p className="text-slate-600 mt-4">
              {location
                ? `Showing results for ${location.city} and surrounding areas`
                : "Enable location to find rooms near you"}
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
              <p className="text-slate-500">Loading amazing rooms for you...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😕</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Rooms Grid */}
          {rooms && rooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <RoomGrid rooms={rooms} />
            </motion.div>
          )}

          {/* No Results */}
          {rooms && rooms.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No rooms found
              </h3>
              <p className="text-slate-500">
                {location
                  ? `We couldn't find any rooms in ${location.city}. Try searching in a different area.`
                  : "Try enabling location or adjusting your search filters"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />

      <Footer />
    </>
  );
}
