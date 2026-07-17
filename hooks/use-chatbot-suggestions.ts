"use client";

import { useState, useCallback } from "react";
import { chatbotService } from "@/http/services/chatbot.service";
import type { Room } from "@/types/room.types";
import type { UserPreferenceProfile } from "@/lib/chatbot-training";
import { useRoomRecommendations } from "./use-room-recommendations";

interface UseChatbotSuggestionsReturn {
  loading: boolean;
  rooms: Room[];
  error: string | null;
  fetch: (preferences: UserPreferenceProfile) => Promise<void>;
}

export function useChatbotSuggestions(): UseChatbotSuggestionsReturn {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPreferences, setLastPreferences] = useState<UserPreferenceProfile>({});

  const recommendations = useRoomRecommendations(rooms, lastPreferences);

  const fetch = useCallback(async (preferences: UserPreferenceProfile) => {
    setLoading(true);
    setError(null);
    setLastPreferences(preferences);

    try {
      const response = await chatbotService.suggestRooms({
        ...preferences,
        take: 50,
      });
      setRooms(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    rooms,
    error,
    fetch,
    recommendations,
  } as UseChatbotSuggestionsReturn & {
    recommendations: ReturnType<typeof useRoomRecommendations>;
  };
}
