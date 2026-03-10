"use client";

import { motion } from "framer-motion";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/property.types";

interface RoomGridProps {
  rooms: Property[];
  loading?: boolean;
}

export function RoomGrid({ rooms, loading = false }: RoomGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-slate-200 rounded-2xl h-64 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No rooms found
        </h3>
        <p className="text-slate-500">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {rooms.map((room, index) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <PropertyCard property={room} index={index} />
        </motion.div>
      ))}
    </div>
  );
}
