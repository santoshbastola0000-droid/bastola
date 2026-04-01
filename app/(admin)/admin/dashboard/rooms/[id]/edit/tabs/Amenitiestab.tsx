"use client";

import { motion } from "framer-motion";
import { Wifi, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/Formprimitives";
import { AMENITIES_LIST } from "@/lib/constants/app.constants";

interface AmenitiesTabProps {
  selectedAmenities: string[];
  onToggle: (id: string) => void;
}

export function AmenitiesTab({
  selectedAmenities,
  onToggle,
}: AmenitiesTabProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Wifi}
        title="Amenities / सुविधाहरू"
        subtitle="Select everything available in your room"
      />

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="group"
        aria-label="Amenities"
      >
        {AMENITIES_LIST.map((amenity) => {
          const Icon = amenity.icon;
          const isSelected = selectedAmenities.includes(amenity.id);
          return (
            <motion.button
              key={amenity.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggle(amenity.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer text-center",
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <Icon className="w-6 h-6" aria-hidden />
              <span className="text-xs font-semibold leading-tight">
                {amenity.label}
              </span>
              <span className="text-[10px] text-current opacity-60">
                {amenity.description}
              </span>
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                  aria-hidden
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-sm font-bold text-primary">
          {selectedAmenities.length}
        </span>
        <span className="text-sm text-slate-500">
          {selectedAmenities.length === 1 ? "amenity" : "amenities"} selected /
          चयन भयो
        </span>
      </div>
    </div>
  );
}
