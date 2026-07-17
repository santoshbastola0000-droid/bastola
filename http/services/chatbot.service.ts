import { api } from "@/http/api/api";
import type { Room } from "@/types/room.types";
import type { UserPreferenceProfile } from "@/lib/chatbot-training";

export interface ChatbotRoomSuggestionParams extends UserPreferenceProfile {
  page?: number;
  take?: number;
}

export interface ChatbotSuggestionResponse {
  data: Room[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}

class ChatbotService {
  private readonly baseUrl = "/chatbot";

  async suggestRooms(
    params: ChatbotRoomSuggestionParams,
  ): Promise<ChatbotSuggestionResponse> {
    const response = await api.get(`${this.baseUrl}/suggest-rooms`, {
      params: {
        ...params,
        amenities: params.amenities?.join(","),
      },
    });
    return response.data;
  }
}

export const chatbotService = new ChatbotService();
