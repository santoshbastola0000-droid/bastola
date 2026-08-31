import { privateApi } from "@/http/api/privateApi";
import type {
  ChatMessage,
  MessageConversation,
} from "@/http/services/message.service";

export interface ManagedMessageAccount {
  userId: string;
  selectedAt: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface ManagedMessageCandidate {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export const adminManagedMessageService = {
  searchUsers: async (
    query = "",
  ): Promise<ManagedMessageCandidate[]> => {
    const response = await privateApi.get(
      "/message/admin-managed/users",
      { params: { q: query } },
    );

    return response.data || [];
  },

  getAccounts: async (): Promise<
    ManagedMessageAccount[]
  > => {
    const response = await privateApi.get(
      "/message/admin-managed/accounts",
    );

    return response.data || [];
  },

  setAccounts: async (
    userIds: string[],
  ): Promise<ManagedMessageAccount[]> => {
    const response = await privateApi.put(
      "/message/admin-managed/accounts",
      { userIds },
    );

    return response.data || [];
  },

  getConversations: async (
    accountId: string,
  ): Promise<{
    account: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
    };
    conversations: MessageConversation[];
  }> => {
    const response = await privateApi.get(
      `/message/admin-managed/accounts/${accountId}/conversations`,
    );

    return response.data;
  },

  getMessages: async (
    accountId: string,
    conversationId: string,
  ): Promise<ChatMessage[]> => {
    const response = await privateApi.get(
      `/message/admin-managed/accounts/${accountId}/conversations/${conversationId}/messages`,
    );

    return response.data || [];
  },

  reply: async (
    accountId: string,
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> => {
    const response = await privateApi.post(
      `/message/admin-managed/accounts/${accountId}/conversations/${conversationId}/reply`,
      { content },
    );

    return response.data.message;
  },
};
