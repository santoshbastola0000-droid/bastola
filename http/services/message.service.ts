import { privateApi } from "@/http/api/privateApi";

export interface MessageConversation {
  id: string;
  userOneId: string;
  userTwoId: string;
  contextType: string;
  contextId?: string | null;
  otherUserId?: string;

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
  mediaUrl?: string | null;
  mediaOriginalName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  mediaStorage?: string | null;
}

export const messageService = {
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
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
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

  findProfileByContact: async (contact: string) => {
    const response = await privateApi.post("/message/find-profile-by-contact", { contact });
    return response.data as { id: string; name: string; phoneNumber: string };
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

  startForJob: async (jobId: string) => {
    const response = await privateApi.post(
      `/message/jobs/${jobId}`,
    );

    return response.data as {
      conversation: MessageConversation;
    };
  },

  startForRoom: async (roomId: string, content?: string) => {
    const response = await privateApi.post(`/message/rooms/${roomId}`, {
      content,
    });

    return response.data as {
      conversation: MessageConversation;
      room: { id: string; title: string; price: string | number; images: string[] };
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
  ): Promise<ChatMessage> => {
    const response = await privateApi.post(
      `/message/conversations/${conversationId}/messages`,
      { content },
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
