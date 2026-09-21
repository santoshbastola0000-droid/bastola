import { NextRequest, NextResponse } from "next/server";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

const crawlerPattern =
  /OAI-SearchBot|ChatGPT-User|GPTBot|PerplexityBot|ClaudeBot|Claude-Web|anthropic-ai|Google-InspectionTool|GoogleOther|Googlebot|bingbot|Applebot|DuckDuckBot|YandexBot|Baiduspider|PetalBot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Pinterestbot|Bytespider|AhrefsBot|SemrushBot|bot|crawler|spider/i;

const assetPattern =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|woff2?|ttf|eot|mp4|webm|mp3|wav)$/i;

export async function proxy(request: NextRequest) {
  const userAgent = String(request.headers.get("user-agent") || "");
  const pathname = request.nextUrl.pathname;

  if (!userAgent || !crawlerPattern.test(userAgent) || assetPattern.test(pathname)) {
    return NextResponse.next();
  }

  const host = String(request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();

  // Do not mix localhost or Vercel preview crawls into production analytics.
  if (host !== "roomkhoj.com" && host !== "www.roomkhoj.com") {
    return NextResponse.next();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    await fetch(`${backendUrl}/notifications/crawler/visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RoomKhoj-Crawler-Tracker/1.0",
      },
      body: JSON.stringify({
        path: `${pathname}${request.nextUrl.search}`.slice(0, 500),
        host,
        userAgent: userAgent.slice(0, 700),
      }),
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => undefined);

    clearTimeout(timeout);
  } catch {
    // Crawler analytics must never block a real page response.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/).*)"],
};
