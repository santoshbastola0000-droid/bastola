"use client";

import { motion } from "framer-motion";
import { NavBar } from "@/components/common/navbar";
import { Hero } from "@/components/home/hero";
import { RoomGrid } from "@/components/room-grid";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import Footer from "@/components/common/footer";
import { useRooms } from "@/hooks/use-rooms";
import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { rooms, loading } = useRooms();

  const featuredRooms = rooms?.slice(0, 3) ?? [];

  return (
    <>
      <NavBar />
      <Hero />

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
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
              Discover Your Next Home
            </h2>
          </motion.div>

          {/* Featured rooms — only 3 */}
          {!loading && featuredRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <RoomGrid rooms={featuredRooms} />

              {/* View all link */}
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
        </div>
      </section>

      <WhyChooseUs />
      <Testimonials />
      <CTASection />
      <Footer />
    </>
  );
}
