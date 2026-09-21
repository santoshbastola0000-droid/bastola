import type { MetadataRoute } from "next";

const privatePaths = [
  "/admin/",
  "/user/dashboard/",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.roomkhoj.com";

  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
