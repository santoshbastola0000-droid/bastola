import type { MetadataRoute } from "next";

import type { JobPosting } from "@/http/services/job-posting.service";

const baseUrl = "https://www.roomkhoj.com";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://api.roomkhoj.com";

type SocialSeoIndex = {
  posts: Array<{
    id: string;
    updatedAt: string;
  }>;
  hashtags: Array<{
    tag: string;
    count: number;
  }>;
};

function jobSlug(job: JobPosting) {
  const title = job.jobTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${job.id}-${title || "vacancy"}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs: JobPosting[] = [];
  let socialSeo: SocialSeoIndex = { posts: [], hashtags: [] };

  await Promise.all([
    (async () => {
      try {
        const response = await fetch(
          `${API_URL}/job-posting/approved`,
          {
            next: {
              revalidate: 3600,
            },
          },
        );

        if (response.ok) {
          jobs = await response.json();
        }
      } catch {
        jobs = [];
      }
    })(),
    (async () => {
      try {
        const response = await fetch(
          `${API_URL}/public/social/seo-index`,
          {
            next: {
              revalidate: 1800,
            },
          },
        );

        if (response.ok) {
          socialSeo = await response.json();
        }
      } catch {
        socialSeo = { posts: [], hashtags: [] };
      }
    })(),
  ]);

  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/rooms`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/rooms/pokhara`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs/pokhara`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/hashtags`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...jobs.map((job) => ({
      url: `${baseUrl}/job/${jobSlug(job)}`,
      lastModified: new Date(job.updatedAt || job.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...socialSeo.posts.map((post) => ({
      url: `${baseUrl}/post/${post.id}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...socialSeo.hashtags.map(({ tag }) => ({
      url: `${baseUrl}/hashtag/${encodeURIComponent(tag)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];
}
