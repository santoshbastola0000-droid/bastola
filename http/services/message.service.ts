import { privateApi } from "@/http/api/privateApi";

export interface MessageConversation {
  id: string;
  userOneId: string;
  userTwoId: string;
  contextType: string;
  contextId?: string | null;
  contextPost?: {
    type: "ROOM" | "JOB";
    id: string;
    title: string;
    subtitle?: string | null;
    price?: number | null;
    image?: string | null;
    url: string;
  } | null;
  otherUserId?: string;

  otherUser?: {
    id: string;
    name: string;
  } | null;

  lastMessageAt?: string | null;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
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
  mediaUrl?: string | null;
  mediaOriginalName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  mediaStorage?: string | null;
  attachment?: {
    type: "ROOM";
    id: string;
    title: string;
    price: number;
    address?: string | null;
    image?: string | null;
    url: string;
  } | null;
}

export const messageService = {

  adminListUsers: async (query = "") => {
    const response = await privateApi.get("/message/admin/users", {
      params: query.trim() ? { q: query.trim() } : undefined,
    });
    return response.data as Array<{
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      role: string;
      isVerified: boolean;
    }>;
  },

  adminGetUserConversations: async (userId: string) => {
    const response = await privateApi.get(
      `/message/admin/users/${userId}/conversations`,
    );
    return response.data as {
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
      };
      conversations: MessageConversation[];
    };
  },

  adminGetConversationMessages: async (
    conversationId: string,
  ): Promise<ChatMessage[]> => {
    const response = await privateApi.get(
      `/message/admin/conversations/${conversationId}/messages`,
    );
    return response.data || [];
  },

  getCallCredentials: async () => {
    const response = await privateApi.get("/message/call-credentials");
    return response.data as { iceServers: RTCIceServer[] };
  },
  sendMedia: async (
    conversationId: string,
    file: File,
    caption?: string,
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file,
    );

    if (caption?.trim()) {
      formData.append(
        "caption",
        caption.trim(),
      );
    }

    const response =
      await privateApi.post(
        `/message/conversations/${conversationId}/media`,
        formData,
      );

    return response.data;
  },

  getMediaBlob: async (
    messageId: string,
  ) => {
    const response =
      await privateApi.get(
        `/message/media/${messageId}`,
        {
          responseType: "blob",
        },
      );

    return response.data as Blob;
  },

  startByUser: async (
    userId: string,
  ) => {
    const response =
      await privateApi.post(
        `/message/start-by-user/${userId}`,
      );

    return response.data;
  },

  searchMessages: async (
    query: string,
  ) => {
    const response = await privateApi.get(
      "/message/search-messages",
      {
        params: { q: query },
      },
    );

    return response.data as Array<{
      id: string;
      conversationId: string;
      content: string;
      createdAt: string;
      otherUser: {
        id: string;
        name: string;
      } | null;
    }>;
  },

  searchUsersByPhone: async (
    query: string,
  ) => {
    const response = await privateApi.get(
      "/message/search-users",
      {
        params: { q: query },
      },
    );

    return response.data as Array<{
      id: string;
      name: string;
    }>;
  },

  findProfileByContact: async (contact: string) => {
    const response = await privateApi.post("/message/find-profile-by-contact", { contact });
    return response.data as { id: string; name: string };
  },

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

  startForJob: async (jobId: string) => {
    const response = await privateApi.post(
      `/message/jobs/${jobId}`,
    );

    return response.data as {
      conversation: MessageConversation;
    };
  },

  sendRoomInquiry: async (
    roomId: string,
    content: string,
  ) => {
    const response = await privateApi.post(
      `/message/rooms/${roomId}/send`,
      { content },
    );

    return response.data as {
      conversation: MessageConversation;
      message: ChatMessage;
      room: {
        id: string;
        title: string;
        price: string | number;
        address?: string | null;
        images: string[];
      };
    };
  },

  startForRoom: async (roomId: string, content?: string) => {
    const response = await privateApi.post(`/message/rooms/${roomId}`, {
      content,
    });

    return response.data as {
      conversation: MessageConversation;
      message?: ChatMessage | null;
      room: {
        id: string;
        title: string;
        price: string | number;
        address?: string | null;
        images: string[];
      };
    };
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
    roomId?: string,
  ): Promise<ChatMessage> => {
    const response = await privateApi.post(
      `/message/conversations/${conversationId}/messages`,
      {
        content,
        roomId: roomId || undefined,
      },
    );

    return response.data;
  },


  createPaymentRequest: async (
    conversationId: string,
    amount: number,
  ) => {
    const response = await privateApi.post(
      `/message/conversations/${conversationId}/payment-requests`,
      { amount },
    );
    return response.data as { payment: any; message: ChatMessage };
  },

  payPaymentRequest: async (paymentId: string) => {
    const response = await privateApi.post(
      `/message/payments/${paymentId}/pay`,
    );
    return response.data as { payment: any; message: ChatMessage };
  },

  requestPaymentRelease: async (paymentId: string) => {
    const response = await privateApi.post(
      `/message/payments/${paymentId}/release-request`,
    );
    return response.data as { payment: any; message: ChatMessage };
  },

  confirmPaymentRelease: async (paymentId: string) => {
    const response = await privateApi.post(
      `/message/payments/${paymentId}/release`,
    );
    return response.data as { payment: any; message: ChatMessage };
  },

  disputePayment: async (paymentId: string, reason?: string) => {
    const response = await privateApi.post(
      `/message/payments/${paymentId}/dispute`,
      { reason },
    );
    return response.data as { payment: any; message: ChatMessage };
  },

  deleteMessage: async (
    messageId: string,
  ): Promise<{
    success: boolean;
    messageId: string;
    conversationId: string;
  }> => {
    const response = await privateApi.delete(
      `/message/messages/${messageId}`,
    );

    return response.data;
  },

  recordMissedCall: async (
    conversationId: string,
    mode: "audio" | "video",
  ): Promise<ChatMessage> => {
    const response = await privateApi.post(
      `/message/conversations/${conversationId}/missed-call`,
      { mode },
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
