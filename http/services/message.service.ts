import { privateApi } from "@/http/api/privateApi";

export interface MessageConversation {
  id: string;
  userOneId: string;
  userTwoId: string;
  contextType: string;
  contextId?: string | null;

  otherUser?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;

  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  createdAt: string;
}

export const messageService = {
  startByContact: async (
    contact: string,
  ) => {
    const response = await privateApi.post(
      "/message/start-by-contact",
      { contact },
    );

    return response.data as {
      conversation: MessageConversation;
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
      };
    };
  },

  startByPhone: async (
    phoneNumber: string,
  ) => {
    const response = await privateApi.post(
      "/message/start-by-phone",
      { phoneNumber },
    );

    return response.data as {
      conversation: MessageConversation;
      user: {
        id: string;
        name: string;
        phoneNumber: string;
      };
    };
  },

  createConversation: async (
    otherUserId: string,
    contextType = "USER",
    contextId?: string | null,
  ): Promise<MessageConversation> => {
    const response = await privateApi.post(
      "/message/conversations",
      {
        otherUserId,
        contextType,
        contextId: contextId || null,
      },
    );

    return response.data;
  },

  getUnreadCount: async () => {
    const response = await privateApi.get(
      "/message/unread-count",
    );

    return response.data as {
      count: number;
      display: string;
    };
  },

  getConversations: async (): Promise<
    MessageConversation[]
  > => {
    const response = await privateApi.get(
      "/message/conversations",
    );

    return response.data || [];
  },

  getMessages: async (
    conversationId: string,
  ): Promise<ChatMessage[]> => {
    const response = await privateApi.get(
      `/message/conversations/${conversationId}/messages`,
    );

    return response.data || [];
  },

  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> => {
    const response = await privateApi.post(
      `/message/conversations/${conversationId}/messages`,
      { content },
    );

    return response.data;
  },

  markSeen: async (
    conversationId: string,
  ): Promise<{ success: boolean }> => {
    const response = await privateApi.patch(
      `/message/conversations/${conversationId}/seen`,
    );

    return response.data;
  },
};
