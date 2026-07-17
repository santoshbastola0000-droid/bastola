"use client";

import { useMemo } from "react";
import type { Room } from "@/types/room.types";
import type { UserPreferenceProfile } from "@/lib/chatbot-training";
import { haversineKm } from "@/lib/geo";

export interface Recommendation {
  room: Room;
  score: number;
  reasons: string[];
  distanceKm?: number;
}

export function useRoomRecommendations(
  rooms: Room[],
  preferences: UserPreferenceProfile,
): Recommendation[] {
  return useMemo(() => {
    const {
      city,
      maxBudget,
      womenOnly,
      tenantType,
      amenities = [],
      latitude,
      longitude,
    } = preferences;

    const cityNorm = city?.trim().toLowerCase();
    const amenityKeywords = amenities
      .flatMap((a) => a.split(/[,\/\s]+/))
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    const userLat = latitude;
    const userLng = longitude;

    return rooms
      .map((room) => {
        let score = 0;
        const reasons: string[] = [];

        const roomCity =
          room.location?.city?.toLowerCase() ||
          room.address?.toLowerCase() ||
          "";
        const roomAmenities = (room.amenities || []).map((a) =>
          a.toLowerCase(),
        );

        if (cityNorm) {
          if (roomCity.includes(cityNorm)) {
            score += 4;
            reasons.push("City/area match");
          } else if (room.address?.toLowerCase().includes(cityNorm)) {
            score += 3;
            reasons.push("Address mentions your area");
          }
        }

        if (maxBudget && maxBudget > 0) {
          const price = Number(room.price || 0);
          if (price <= maxBudget) {
            score += 4;
            reasons.push("Within budget");
          } else if (price <= maxBudget * 1.2) {
            score += 1;
            reasons.push("Slightly over budget");
          }
        }

        if (womenOnly && room.allowsWomen) {
          score += 3;
          reasons.push("Women-friendly");
        }

        if (
          tenantType &&
          room.tenantTypes?.some(
            (item) => item.toLowerCase() === tenantType.toLowerCase(),
          )
        ) {
          score += 3;
          reasons.push("Tenant preference match");
        }

        amenityKeywords.forEach((keyword) => {
          if (roomAmenities.some((amenity) => amenity.includes(keyword))) {
            score += 1;
            reasons.push(`${keyword} available`);
          }
        });

        let distanceKm: number | undefined;
        if (
          userLat !== undefined &&
          userLng !== undefined &&
          room.location?.latitude !== undefined &&
          room.location?.longitude !== undefined
        ) {
          distanceKm = haversineKm(
            userLat,
            userLng,
            Number(room.location.latitude),
            Number(room.location.longitude),
          );
          if (distanceKm <= 5) {
            score += 4;
            reasons.push("Very close to you");
          } else if (distanceKm <= 10) {
            score += 2;
            reasons.push("Nearby");
          } else if (distanceKm <= 20) {
            score += 1;
            reasons.push("Within 20 km");
          }
        }

        return {
          room,
          score,
          reasons: Array.from(new Set(reasons)).slice(0, 4),
          distanceKm,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
          Number(a.room.price) - Number(b.room.price)
        );
      })
      .slice(0, 5);
  }, [rooms, preferences]);
}
