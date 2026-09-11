import { privateApi } from "@/http/api/privateApi";

export type SocialMusic = {
  musicUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
};

export type SocialUser = {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  isMonetized?: boolean;
  nearbyLabel?: string;
};

export type SocialReactionType =
  | "LIKE"
  | "LOVE"
  | "HAHA"
  | "WOW"
  | "SAD"
  | "ANGRY";

export type SocialReactionEntry = {
  user: SocialUser;
  reaction: SocialReactionType;
  createdAt: string;
};

export type SocialReactionSummary = {
  liked: boolean;
  reaction: SocialReactionType | null;
  likeCount: number;
  likePreview?: SocialReactionEntry[];
};

export type SocialPost = SocialMusic & {
  id: string;
  userId: string;
  content?: string | null;
  mediaUrls: string[];
  mediaTypes: Array<"IMAGE" | "VIDEO">;
  visibility: "PUBLIC" | "FRIENDS" | "GROUP";
  groupId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: SocialUser;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  reactionByMe?: SocialReactionType | null;
};

export type SocialFeedItem =
  | { type: "POST"; id: string; createdAt: string; post: SocialPost }
  | {
      type: "ROOM";
      id: string;
      createdAt: string;
      room: {
        id: string;
        title: string;
        price: number;
        category: string;
        image?: string | null;
        area?: string | null;
        city?: string | null;
        availableFrom?: string | null;
        listingStatus?: string | null;
      };
    }
  | {
      type: "JOB";
      id: string;
      createdAt: string;
      job: {
        id: string;
        jobCode?: number | null;
        jobTitle: string;
        companyName?: string | null;
        location: string;
        salary?: number | null;
        salaryMin?: number | null;
        salaryMax?: number | null;
        experience?: string | null;
      };
    }
  | {
      type: "SERVICE";
      id: string;
      createdAt: string;
      service: {
        key: string;
        title: string;
        body: string;
        href: string;
      };
    };

export type SocialStory = SocialMusic & {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string | null;
  visibility: "PUBLIC" | "FRIENDS";
  expiresAt: string;
  createdAt: string;
  viewedByMe: boolean;
  viewCount?: number;
  author: SocialUser;
};

export type SocialComment = {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  content: string;
  createdAt: string;
  author: SocialUser;
};

export type SocialGroup = {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  coverUrl?: string | null;
  memberCount: number;
  membership: "NONE" | "ACTIVE" | "PENDING";
  myRole?: "OWNER" | "ADMIN" | "MEMBER" | null;
};

export type SocialPreferences = {
  allowNearbySuggestions: boolean;
  allowContactDiscovery: boolean;
  socialPushOptIn: boolean;
  roomOpportunityEmailOptIn: boolean;
  jobVisitorEarningEmailOptIn: boolean;
};

export type SocialRelation = {
  targetUserId: string;
  blocked: boolean;
  muted: boolean;
};

export type SocialReport = {
  id: string;
  reporterUserId: string;
  targetType: "POST" | "COMMENT" | "STORY" | "USER";
  targetId: string;
  reason: string;
  status: "OPEN" | "REVIEWED" | "DISMISSED";
  createdAt: string;
};

export const socialService = {
  async feed(before?: string) {
    const response = await privateApi.get("/social/feed", {
      params: { limit: 20, before },
    });
    return response.data as { items: SocialFeedItem[]; nextCursor: string | null };
  },

  async uploadProfilePhoto(file: File) {
    const form = new FormData();
    form.append("media", file);
    const response = await privateApi.post("/social/profile-photo", form);
    return response.data as { profilePhotoUrl: string; createdAt: string };
  },

  async myProfilePhoto() {
    const response = await privateApi.get("/social/profile-photo/me");
    return response.data as { profilePhotoUrl: string | null; createdAt: string | null };
  },

  async profilePhoto(userId: string) {
    const response = await privateApi.get(`/social/profile-photo/${userId}`);
    return response.data as { profilePhotoUrl: string | null; createdAt: string | null };
  },

  async uploadMusic(file: File) {
    const form = new FormData();
    form.append("music", file);
    const response = await privateApi.post("/social-music/upload", form);
    return response.data as Required<Pick<SocialMusic, "musicUrl" | "musicTitle">> & Pick<SocialMusic, "musicArtist">;
  },

  async attachPostMusic(postId: string, music: SocialMusic) {
    const response = await privateApi.patch(`/social-music/posts/${postId}`, music);
    return response.data as { success: boolean } & SocialMusic;
  },

  async attachStoryMusic(storyId: string, music: SocialMusic) {
    const response = await privateApi.patch(`/social-music/stories/${storyId}`, music);
    return response.data as { success: boolean } & SocialMusic;
  },

  async postMusic(postId: string) {
    const response = await privateApi.get(`/social-music/posts/${postId}`);
    return response.data as SocialMusic;
  },

  async createPost(input: {
    content: string;
    visibility: "PUBLIC" | "FRIENDS" | "GROUP";
    groupId?: string;
    files: File[];
  }) {
    const form = new FormData();
    form.append("content", input.content);
    form.append("visibility", input.visibility);
    if (input.groupId) form.append("groupId", input.groupId);
    input.files.forEach((file) => form.append("media", file));
    const response = await privateApi.post("/social/posts", form);
    return response.data as SocialPost;
  },

  async updatePost(
    postId: string,
    input: { content?: string; visibility?: "PUBLIC" | "FRIENDS" },
  ) {
    const response = await privateApi.patch(`/social/posts/${postId}`, input);
    return response.data as { success: boolean };
  },

  async toggleLike(postId: string, reaction: SocialReactionType = "LOVE") {
    const response = await privateApi.post(`/social/posts/${postId}/reaction`, {
      reaction,
    });
    return response.data as SocialReactionSummary;
  },

  async removeLike(postId: string) {
    const response = await privateApi.delete(`/social/posts/${postId}/reaction`);
    return response.data as SocialReactionSummary;
  },

  async likes(postId: string, limit = 50) {
    const response = await privateApi.get(`/social/posts/${postId}/reactions`, {
      params: { limit },
    });
    return response.data as SocialReactionEntry[];
  },

  async comments(postId: string) {
    const response = await privateApi.get(`/social/posts/${postId}/comments`);
    return response.data as SocialComment[];
  },

  async addComment(postId: string, content: string, parentCommentId?: string) {
    const response = await privateApi.post(`/social/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data as SocialComment;
  },

  async replyComment(commentId: string, postId: string, content: string) {
    const response = await privateApi.post(`/social/comments/${commentId}/reply`, {
      postId,
      content,
    });
    return response.data as SocialComment;
  },

  async updateComment(commentId: string, content: string) {
    const response = await privateApi.patch(`/social/comments/${commentId}`, { content });
    return response.data as { success: boolean; content: string; updatedAt: string };
  },

  async deleteComment(commentId: string) {
    const response = await privateApi.delete(`/social/comments/${commentId}`);
    return response.data as { success: boolean };
  },

  async registerShare(postId: string, channel: string) {
    const response = await privateApi.post(`/social/posts/${postId}/share`, { channel });
    return response.data as { shareCount: number };
  },

  async deletePost(postId: string) {
    const response = await privateApi.delete(`/social/posts/${postId}`);
    return response.data;
  },

  async stories() {
    const response = await privateApi.get("/social/stories");
    const stories = (response.data || []) as SocialStory[];
    if (!stories.length) return stories;

    try {
      const musicResponse = await privateApi.get("/social-music/stories", {
        params: { ids: stories.map((story) => story.id).join(",") },
      });
      const musicMap = (musicResponse.data || {}) as Record<string, SocialMusic>;
      return stories.map((story) => ({ ...story, ...(musicMap[story.id] || {}) }));
    } catch {
      return stories;
    }
  },

  async createStory(input: {
    file: File;
    caption?: string;
    visibility?: "PUBLIC" | "FRIENDS";
  }) {
    const form = new FormData();
    form.append("media", input.file);
    form.append("caption", input.caption || "");
    form.append("visibility", input.visibility || "PUBLIC");
    const response = await privateApi.post("/social/stories", form);
    return response.data as SocialStory;
  },

  async viewStory(storyId: string) {
    const response = await privateApi.post(`/social/stories/${storyId}/view`);
    return response.data;
  },

  async deleteStory(storyId: string) {
    const response = await privateApi.delete(`/social/stories/${storyId}`);
    return response.data as { success: boolean };
  },

  async friendRequests() {
    const response = await privateApi.get("/social/friend-requests");
    return response.data as Array<SocialUser & { requestedAt: string }>;
  },

  async nearbySuggestions() {
    const response = await privateApi.get("/social/friend-suggestions/nearby", {
      params: { limit: 12 },
    });
    return response.data as {
      enabled: boolean;
      reason?: string | null;
      suggestions: SocialUser[];
    };
  },

  async contactSuggestions(hashes: string[]) {
    const response = await privateApi.post("/social/friend-suggestions/contacts", { hashes });
    return response.data as SocialUser[];
  },

  async sendFriendRequest(userId: string) {
    const response = await privateApi.post(`/friend/request/${userId}`);
    return response.data;
  },

  async acceptFriendRequest(userId: string) {
    const response = await privateApi.post(`/friend/accept/${userId}`);
    return response.data;
  },

  async rejectFriendRequest(userId: string) {
    const response = await privateApi.delete(`/friend/${userId}`);
    return response.data;
  },

  async groups() {
    const response = await privateApi.get("/social/groups");
    return response.data as SocialGroup[];
  },

  async createGroup(input: {
    name: string;
    description?: string;
    privacy?: "PUBLIC" | "PRIVATE";
  }) {
    const response = await privateApi.post("/social/groups", input);
    return response.data as SocialGroup;
  },

  async joinGroup(groupId: string) {
    const response = await privateApi.post(`/social/groups/${groupId}/join`);
    return response.data as SocialGroup;
  },

  async leaveGroup(groupId: string) {
    const response = await privateApi.delete(`/social/groups/${groupId}/leave`);
    return response.data;
  },

  async relations() {
    const response = await privateApi.get("/social/relations");
    return response.data as SocialRelation[];
  },

  async updateRelation(
    targetUserId: string,
    input: { blocked?: boolean; muted?: boolean },
  ) {
    const response = await privateApi.patch(
      `/social/relations/${targetUserId}`,
      input,
    );
    return response.data as SocialRelation;
  },

  async preferences() {
    const response = await privateApi.get("/social/preferences");
    return response.data as SocialPreferences;
  },

  async updatePreferences(input: Partial<SocialPreferences>) {
    const response = await privateApi.patch("/social/preferences", input);
    return response.data as SocialPreferences;
  },

  async report(input: {
    targetType: "POST" | "COMMENT" | "STORY" | "USER";
    targetId: string;
    reason: string;
  }) {
    const response = await privateApi.post("/social/reports", input);
    return response.data;
  },

  async adminReports(status: "OPEN" | "REVIEWED" | "DISMISSED" = "OPEN") {
    const response = await privateApi.get("/social/admin/reports", {
      params: { status, limit: 100 },
    });
    return response.data as SocialReport[];
  },

  async moderateReport(
    reportId: string,
    action: "REMOVE_TARGET" | "REVIEWED" | "DISMISSED",
  ) {
    const response = await privateApi.post(
      `/social/admin/reports/${reportId}/moderate`,
      { action },
    );
    return response.data as { success: boolean; status: string };
  },
};

export async function hashContactValue(value: string) {
  const normalizedEmail = value.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  let normalized = normalizedEmail;
  if (digits.length >= 10 && !normalizedEmail.includes("@")) {
    normalized = digits.length === 10 ? `977${digits}` : digits;
  }

  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
