import type { MetadataRoute } from "next";

import type { JobPosting } from "@/http/services/job-posting.service";

const baseUrl =
  "https://www.roomkhoj.com";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://api.roomkhoj.com";

function jobSlug(job: JobPosting) {
  const title = job.jobTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${job.id}-${title || "vacancy"}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs: JobPosting[] = [];

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
    ...jobs.map((job) => ({
      url:
        `${baseUrl}/job/${jobSlug(job)}`,
      lastModified:
        new Date(job.updatedAt || job.createdAt),
      changeFrequency:
        "daily" as const,
      priority: 0.9,
    })),
  ];
}
