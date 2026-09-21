import { privateApi } from "@/http/api/privateApi";

export interface PublicProfileUser {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  isBanned?: boolean;
  isSynthetic?: boolean;
  profilePhotoUrl?: string | null;
  coverPhotoUrl?: string | null;
}

export interface PublicProfile {
  user: PublicProfileUser;
  posts: any[];
  rooms: any[];
  jobs: any[];
}

export type FriendStatus =
  | "SELF"
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIENDS";

export type ProfileViewSummary = {
  totalViews: number;
  uniqueViewers: number;
  viewers: Array<{
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    viewCount: number;
    lastViewedAt: string;
  }>;
};

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

  deleteProfilePhoto: async () => {
    const res = await privateApi.delete(
      "/user/profile/photo",
    );

    return res.data;
  },

  getProfileUiSettings: async (): Promise<{
    verifiedBadgeEnabled: boolean;
    updatedAt?: string | null;
  }> => {
    const res = await privateApi.get(
      "/user/profile-ui-settings",
    );
    return res.data;
  },

  updateProfileUiSettings: async (
    verifiedBadgeEnabled: boolean,
  ): Promise<{
    verifiedBadgeEnabled: boolean;
    updatedAt?: string | null;
  }> => {
    const res = await privateApi.patch(
      "/user/admin/profile-ui-settings",
      { verifiedBadgeEnabled },
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

  recordProfileView: async (
    userId: string,
  ) => {
    const res = await privateApi.post(
      `/user/profile/${userId}/view`,
    );

    return res.data as {
      recorded: boolean;
    };
  },

  getMyProfileViews: async (
    limit = 50,
  ): Promise<ProfileViewSummary> => {
    const res = await privateApi.get(
      "/user/me/profile-views",
      {
        params: { limit },
      },
    );

    return res.data;
  },
};
