"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/common/navbar";
import { Hero } from "@/components/home/hero";
import { RoomGrid } from "@/components/room-grid";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import Footer from "@/components/common/footer";
import { useRooms } from "@/hooks/use-rooms";
import {
  Loader2,
  Home as HomeIcon,
  MapPin,
  Users,
  Building2,
  Shield,
  Sparkles,
  ChevronRight,
  Navigation,
  AlertCircle,
} from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import type { RoomFilters } from "@/types/room.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const filters: RoomFilters | undefined = location
    ? {
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 10,
      }
    : undefined;

  const { rooms, loading, error } = useRooms(filters);

  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleEnableLocation = () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Get city name from coordinates using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10&addressdetails=1`,
          );
          const data = await response.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "your area";

          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: city,
          });
        } catch (err) {
          // Fallback: use coordinates without city name
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        setLocationError(
          "Unable to access location. Please enable location services.",
        );
        setIsLocationLoading(false);
      },
    );
  };

  const stats = [
    {
      icon: Building2,
      value: 2500,
      label: "Properties Listed",
      suffix: "+",
      color: "from-red-500 to-orange-500",
      description: "Verified rentals",
    },
    {
      icon: MapPin,
      value: 50,
      label: "Cities Covered",
      suffix: "+",
      color: "from-red-500 to-pink-500",
      description: "Nationwide reach",
    },
    {
      icon: Users,
      value: 10000,
      label: "Happy Tenants",
      suffix: "+",
      color: "from-red-500 to-rose-500",
      description: "Successfully placed",
    },
    {
      icon: Shield,
      value: 98,
      label: "Success Rate",
      suffix: "%",
      color: "from-red-500 to-purple-500",
      decimals: 0,
      description: "Verified listings",
    },
  ];

  return (
    <>
      <NavBar />
      <Hero />

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
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  {stat.label}
                </p>
                <p className="text-xs text-slate-400">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section - Enhanced */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          {/* Header with better context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <Badge className="mb-4 bg-red-50 text-red-600 border-red-200 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Find Your Perfect Space
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-2">
              {location?.city ? (
                <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                  Rooms in {location.city}
                </span>
              ) : (
                "Discover Your Next Home"
              )}
            </h2>
            <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
              {location?.city
                ? `Explore {rooms?.length || 0} verified rental properties in ${location.city} and surrounding areas`
                : "Find the perfect rental property tailored to your needs"}
            </p>
          </motion.div>

          {/* Location Status Section */}
          {!location && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Navigation className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Enable Location
                      </h3>
                      <p className="text-sm text-slate-600">
                        Get personalized room recommendations near you
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleEnableLocation}
                    disabled={isLocationLoading}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {isLocationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 mr-2" />
                        Enable Location
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Location Error Alert */}
          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {locationError}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Location Success Message */}
          {location && location.city && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <Alert className="bg-green-50 border-green-200">
                <MapPin className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 font-medium">
                  Showing rooms near {location.city}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-16 h-16 text-red-500 animate-spin relative" />
              </div>
              <p className="text-slate-500 mt-4 font-medium">
                Finding the best rooms for you...
              </p>
              <p className="text-sm text-slate-400 mt-1">
                This may take a moment
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Unable to load rooms
              </h3>
              <p className="text-slate-500">Please try again later</p>
            </div>
          )}

          {/* Rooms Grid with Enhanced Empty State */}
          {!loading && rooms && rooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <RoomGrid rooms={rooms} />

              {/* View More Link */}
              <div className="text-center mt-12">
                <Button
                  variant="ghost"
                  className="group text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => (window.location.href = "/rooms")}
                >
                  <span>View all properties</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Empty State with Better UX */}
          {!loading && rooms && rooms.length === 0 && location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 max-w-md mx-auto"
            >
              <div className="bg-slate-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <HomeIcon className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No rooms found nearby
              </h3>
              <p className="text-slate-500 mb-6">
                We couldn't find any rooms in {location.city}. Try adjusting
                your location or browse all properties.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleEnableLocation}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/rooms")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Browse All Properties
                </Button>
              </div>
            </motion.div>
          )}

          {/* Initial Empty State (No Location) */}
          {!loading && rooms && rooms.length === 0 && !location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 max-w-md mx-auto"
            >
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Find your perfect room
              </h3>
              <p className="text-slate-500 mb-6">
                Enable location to see rooms near you or browse all available
                properties
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleEnableLocation}
                  disabled={isLocationLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLocationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Enable Location
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/rooms")}
                  className="border-slate-300 hover:border-red-300 hover:text-red-600"
                >
                  Browse All
                </Button>
              </div>
            </motion.div>
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
