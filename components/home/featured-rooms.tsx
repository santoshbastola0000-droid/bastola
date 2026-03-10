"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRooms } from "@/hooks/use-rooms";

export function FeaturedRooms() {
  const [activeTab, setActiveTab] = useState("featured");
  const { rooms, loading } = useRooms({ limit: 6 });

  const tabs = [
    { value: "featured", label: "Featured", icon: Sparkles },
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "recent", label: "Recent", icon: Clock },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #ef4444 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Discover
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2">
              Featured Properties
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl">
              Hand-picked properties that stand out for their exceptional
              quality, location, and value.
            </p>
          </div>
          <Link href="/rooms">
            <Button
              variant="ghost"
              className="group text-red-500 hover:text-red-600"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Tabs */}
        <Tabs
          defaultValue="featured"
          className="mb-8"
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-slate-100 p-1 rounded-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full px-6 py-2 data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Room Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 rounded-2xl h-64 mb-4" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                ))
              : rooms?.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PropertyCard property={room} index={index} />
                  </motion.div>
                ))}
          </motion.div>
        </AnimatePresence>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/rooms">
            <Button
              size="lg"
              className="rounded-full px-8 bg-white text-red-500 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              Explore All Properties
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
