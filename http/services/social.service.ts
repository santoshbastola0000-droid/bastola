import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";

const DIRECT_UPLOAD_BASE_URL = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

const directMultipartConfig = {
  baseURL: DIRECT_UPLOAD_BASE_URL,
  // Uploads can take a while on mobile data. Axios defaults to no timeout,
  // keep that behavior explicit for larger social videos.
  timeout: 0,
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
  mutualFriends?: number;
  sameArea?: boolean;
  contentScore?: number;
  priorityTier?: number;
  reason?: string;
  previewMediaUrls?: string[];
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

export type SocialPost = {
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

export type StoryMusicTrack = {
  provider: "JAMENDO" | string;
  trackId: string;
  title: string;
  artist: string;
  audioUrl: string;
  imageUrl?: string | null;
  licenseUrl?: string | null;
  duration?: number | null;
  selectedAutomatically?: boolean;
};

export type StoryReactionType = "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export type SocialStoryViewer = {
  user: SocialUser;
  viewedAt: string;
  reaction?: StoryReactionType | null;
};

export type SocialStoryReply = {
  id: string;
  content: string;
  createdAt: string;
  user: SocialUser;
};

export type SocialStory = {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string | null;
  visibility: "PUBLIC" | "FRIENDS";
  expiresAt: string;
  createdAt: string;
  viewedByMe: boolean;
  viewCount?: number;
  reactionCount?: number;
  reactionCounts?: Partial<Record<StoryReactionType, number>>;
  reactionByMe?: StoryReactionType | null;
  music?: StoryMusicTrack | null;
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

export type GlobalSearchResult = {
  query: string;
  users: Array<{
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    href: string;
  }>;
  posts: Array<SocialPost & { href: string }>;
  rooms: Array<{
    id: string;
    title: string;
    description?: string | null;
    address?: string | null;
    price: number;
    images?: string[];
    href: string;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    companyName?: string | null;
    location: string;
    salary?: number | null;
    href: string;
  }>;
  services: Array<{
    key: string;
    title: string;
    body: string;
    href: string;
  }>;
};

export type SearchSuggestion = {
  query: string;
  source: "PERSONAL" | "POPULAR";
  searchCount: number;
};

export const socialService = {
  async userPosts(userId: string, limit = 50): Promise<SocialPost[]> {
    const response = await privateApi.get(
      `/social/users/${userId}/posts`,
      { params: { limit } },
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async trackSearch(input: {
    query: string;
    context?: "GLOBAL" | "ROOM" | "JOB" | "PEOPLE" | "MESSAGE" | "CANDIDATE";
    filters?: Record<string, unknown>;
    resultCount?: number | null;
  }) {
    const response = await privateApi.post("/social/search-events", input);
    return response.data;
  },

  async searchSuggestions(
    query = "",
    context: "GLOBAL" | "ROOM" | "JOB" | "PEOPLE" | "MESSAGE" | "CANDIDATE" = "GLOBAL",
    limit = 8,
  ) {
    const response = await privateApi.get("/social/search-suggestions", {
      params: { q: query, context, limit },
    });
    return response.data as SearchSuggestion[];
  },

  async search(query: string, limit = 8) {
    const response = await privateApi.get("/social/search", {
      params: { q: query, limit },
    });
    return response.data as GlobalSearchResult;
  },

  async mentionOptions(query = "") {
    const response = await privateApi.get("/social/mention-options", {
      params: { q: query },
    });
    return response.data as Array<
      SocialUser & { mentionType: "FRIEND" | "OFFICIAL" }
    >;
  },

  async post(postId: string) {
    const response = await privateApi.get(`/social/posts/${postId}`);
    return response.data as SocialPost;
  },

  async feed(before?: string) {
    const response = await privateApi.get("/social/feed", {
      params: { limit: 20, before },
    });
    return response.data as { items: SocialFeedItem[]; nextCursor: string | null };
  },

  async reels(before?: string, limit = 12) {
    const response = await privateApi.get("/social/reels", {
      params: { limit, before },
    });
    return response.data as { items: SocialFeedItem[]; nextCursor: string | null };
  },


  async createLiveInput(name = "RoomKhoj Live") {
    const response = await privateApi.post("/social/stream/live-input", { name });
    return response.data as {
      uid: string;
      publishUrl: string;
      playbackUrl: string;
      rtmpsUrl: string;
      rtmpsKey: string;
    };
  },

  async liveInput(uid: string) {
    const response = await privateApi.get(
      `/social/stream/live-input/${encodeURIComponent(uid)}`,
    );
    return response.data as {
      uid: string;
      playbackUrl: string;
      hlsUrl: string;
      status: string;
    };
  },

  async createStreamUpload(input: {
    name?: string;
    maxDurationSeconds?: number;
  }) {
    const response = await privateApi.post("/social/stream/direct-upload", input);
    return response.data as {
      configured: boolean;
      uid: string | null;
      uploadURL: string | null;
    };
  },

  async finalizeStreamPost(input: {
    uid: string;
    content: string;
    visibility: "PUBLIC" | "FRIENDS" | "GROUP";
    groupId?: string;
    mentionUserIds?: string[];
  }) {
    const response = await privateApi.post("/social/stream/finalize", input);
    return response.data as {
      ready: boolean;
      post?: SocialPost;
      stream: {
        uid: string;
        readyToStream: boolean;
        state: string;
        pctComplete: string;
        duration: number;
        hlsUrl: string;
        dashUrl: string;
        thumbnailUrl: string;
      };
    };
  },

  async startReelFallbackUpload(file: File) {
    const response = await privateApi.post("/social/reels/fallback/start", {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    });
    return response.data as {
      uploadId: string;
      chunkSize: number;
      totalChunks: number;
      maxSize: number;
    };
  },

  async uploadReelFallbackChunk(
    uploadId: string,
    index: number,
    chunk: Blob,
    _originalName: string,
  ) {
    const token = useTokenStore.getState().token;

    const sendRaw = async (url: string, credentials: RequestCredentials) => {
      const headers = new Headers({
        "Content-Type": "application/octet-stream",
      });
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: chunk,
        credentials,
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        let payload: any = null;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = null;
        }

        const error: any = new Error(
          String(
            payload?.message ||
              text ||
              `Chunk upload failed (${response.status})`,
          ),
        );
        error.response = {
          status: response.status,
          data: payload || text,
        };
        throw error;
      }

      return response.json();
    };

    const relativeUrl =
      `/api/social/reels/fallback/${encodeURIComponent(uploadId)}/raw/${index}`;

    try {
      return (await sendRaw(relativeUrl, "include")) as {
        ok: boolean;
        index: number;
        receivedBytes: number;
        totalChunks: number;
      };
    } catch (firstError: any) {
      if (firstError?.response?.status) throw firstError;

      const directUrl =
        `${DIRECT_UPLOAD_BASE_URL}/social/reels/fallback/${encodeURIComponent(uploadId)}/raw/${index}`;

      return (await sendRaw(directUrl, "include")) as {
        ok: boolean;
        index: number;
        receivedBytes: number;
        totalChunks: number;
      };
    }
  },

  async completeReelFallbackUpload(
    uploadId: string,
    input: {
      content: string;
      visibility: "PUBLIC" | "FRIENDS" | "GROUP";
      groupId?: string;
      mentionUserIds?: string[];
    },
  ) {
    const response = await privateApi.post(
      `/social/reels/fallback/${encodeURIComponent(uploadId)}/complete`,
      input,
    );
    return response.data as SocialPost;
  },

  async uploadProfilePhoto(file: File) {
    const form = new FormData();
    form.append("media", file);
    const response = await privateApi.post("/social/profile-photo", form, directMultipartConfig);
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

  async createPost(input: {
    content: string;
    visibility: "PUBLIC" | "FRIENDS" | "GROUP";
    groupId?: string;
    files: File[];
    mentionUserIds?: string[];
  }) {
    const form = new FormData();
    form.append("content", input.content);
    form.append("visibility", input.visibility);
    if (input.groupId) form.append("groupId", input.groupId);
    if (input.mentionUserIds?.length) {
      form.append("mentionUserIds", JSON.stringify(input.mentionUserIds));
    }
    input.files.forEach((file) => form.append("media", file));
    const response = await privateApi.post("/social/posts", form, directMultipartConfig);
    return response.data;
  },

  async updatePost(
    postId: string,
    input: { content?: string; visibility?: "PUBLIC" | "FRIENDS" },
  ) {
    const response = await privateApi.patch(`/social/posts/${postId}`, input);
    return response.data as { success: boolean };
  },

  async toggleLike(postId: string, reaction: SocialReactionType = "LOVE") {
    const send = () =>
      privateApi.post(`/social/posts/${postId}/reaction`, {
        reaction,
      });

    // Reaction POST is idempotent on the API. Retry once so a brief mobile/network
    // failure does not make the optimistic Like appear and then immediately vanish.
    let response;
    try {
      response = await send();
    } catch {
      response = await send();
    }
    return response.data as SocialReactionSummary;
  },

  async removeLike(postId: string) {
    const remove = () => privateApi.delete(`/social/posts/${postId}/reaction`);
    let response;
    try {
      response = await remove();
    } catch {
      response = await remove();
    }
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

  async addComment(
    postId: string,
    content: string,
    parentCommentId?: string,
    mentionUserIds?: string[],
  ) {
    const response = await privateApi.post(`/social/posts/${postId}/comments`, {
      content,
      parentCommentId,
      mentionUserIds,
    });
    return response.data as SocialComment;
  },

  async replyComment(
    commentId: string,
    postId: string,
    content: string,
    mentionUserIds?: string[],
  ) {
    const response = await privateApi.post(`/social/comments/${commentId}/reply`, {
      postId,
      content,
      mentionUserIds,
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
    return response.data as SocialStory[];
  },

  async searchStoryMusic(
    query = "",
    options?: { automatic?: boolean; limit?: number },
  ) {
    const response = await privateApi.get("/social/story-music", {
      params: {
        q: query,
        auto: options?.automatic ? "true" : "false",
        limit: options?.limit || 12,
      },
    });

    return response.data as {
      configured: boolean;
      provider: "JAMENDO" | string;
      tracks: StoryMusicTrack[];
    };
  },

  async createStory(input: {
    file: File;
    caption?: string;
    visibility?: "PUBLIC" | "FRIENDS";
    musicTrackId?: string;
    musicAutoSelected?: boolean;
  }) {
    const form = new FormData();
    form.append("media", input.file);
    form.append("caption", input.caption || "");
    form.append("visibility", input.visibility || "PUBLIC");
    if (input.musicTrackId) {
      form.append("musicTrackId", input.musicTrackId);
      form.append(
        "musicAutoSelected",
        input.musicAutoSelected ? "true" : "false",
      );
    }
    const response = await privateApi.post("/social/stories", form, directMultipartConfig);
    return response.data as SocialStory;
  },

  async viewStory(storyId: string) {
    const response = await privateApi.post(`/social/stories/${storyId}/view`);
    return response.data;
  },

  async storyViewers(storyId: string) {
    const response = await privateApi.get(
      `/social/stories/${storyId}/viewers`,
    );
    return response.data as {
      storyId: string;
      viewCount: number;
      reactionCount: number;
      replyCount: number;
      replies: SocialStoryReply[];
      viewers: SocialStoryViewer[];
    };
  },

  async reactStory(storyId: string, reaction: StoryReactionType) {
    const response = await privateApi.post(
      `/social/stories/${storyId}/reaction`,
      { reaction },
    );
    return response.data as {
      storyId: string;
      reaction: StoryReactionType;
      reactionCount: number;
      reactionCounts: Partial<Record<StoryReactionType, number>>;
    };
  },

  async replyStory(storyId: string, content: string) {
    const response = await privateApi.post(
      `/social/stories/${storyId}/reply`,
      { content },
    );
    return response.data as SocialStoryReply & { storyId: string };
  },

  async removeStoryReaction(storyId: string) {
    const response = await privateApi.delete(
      `/social/stories/${storyId}/reaction`,
    );
    return response.data as {
      storyId: string;
      reaction: null;
      reactionCount: number;
    };
  },

  async deleteStory(storyId: string) {
    const response = await privateApi.delete(`/social/stories/${storyId}`);
    return response.data as { success: boolean };
  },

  async friendRequests() {
    const response = await privateApi.get("/social/friend-requests");
    return response.data as Array<SocialUser & { requestedAt: string }>;
  },

  async friendSuggestions() {
    const response = await privateApi.get("/friend/suggestions");
    return response.data as SocialUser[];
  },

  async friendOnboarding() {
    const response = await privateApi.get("/friend/onboarding");
    return response.data as {
      isNewUser: boolean;
      required: number;
      sent: number;
      remaining: number;
      complete: boolean;
      suggestions: SocialUser[];
    };
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
