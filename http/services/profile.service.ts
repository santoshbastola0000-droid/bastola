import { privateApi } from "@/http/api/privateApi";

export interface PublicProfileUser {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  profilePhotoUrl?: string | null;
  coverPhotoUrl?: string | null;
}

export interface PublicProfile {
  user: PublicProfileUser;
  rooms: any[];
  jobs: any[];
}

export type FriendStatus =
  | "SELF"
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIENDS";

export const profileService = {
  getProfile: async (
    userId: string,
  ): Promise<PublicProfile> => {
    const res = await privateApi.get(
      `/user/profile/${userId}`,
    );

    return res.data;
  },

  updateProfile: async (
    data: {
      name?: string;
      bio?: string;
      location?: string;
      website?: string;
    },
  ) => {
    const res = await privateApi.patch(
      "/user/profile",
      data,
    );

    return res.data;
  },

  uploadProfilePhoto: async (
    file: File,
  ) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await privateApi.post(
      "/user/profile/photo",
      fd,
    );

    return res.data;
  },

  uploadCoverPhoto: async (
    file: File,
  ) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await privateApi.post(
      "/user/profile/cover",
      fd,
    );

    return res.data;
  },

  getFriendStatus: async (
    userId: string,
  ): Promise<{
    status: FriendStatus;
  }> => {
    const res = await privateApi.get(
      `/friend/status/${userId}`,
    );

    return res.data;
  },

  sendFriendRequest: async (
    userId: string,
  ) => {
    const res = await privateApi.post(
      `/friend/request/${userId}`,
    );

    return res.data;
  },

  acceptFriendRequest: async (
    userId: string,
  ) => {
    const res = await privateApi.post(
      `/friend/accept/${userId}`,
    );

    return res.data;
  },

  removeFriend: async (
    userId: string,
  ) => {
    const res = await privateApi.delete(
      `/friend/${userId}`,
    );

    return res.data;
  },

  getFriends: async (
    userId: string,
  ) => {
    const res = await privateApi.get(
      `/friend/list/${userId}`,
    );

    return res.data;
  },
};
