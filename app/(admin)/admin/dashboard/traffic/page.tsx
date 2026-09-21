"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bot,
  ExternalLink,
  Globe2,
  MousePointerClick,
  Radar,
  Users,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type CrawlerAnalytics = {
  days: number;
  summary: {
    requests: number;
    uniqueBots: number;
    lastSeen: string | null;
  };
  bots: Array<{
    bot: string;
    family: string;
    requests: number;
    lastSeen: string | null;
  }>;
  daily: Array<{
    date: string;
    requests: number;
  }>;
  recent: Array<{
    id: string;
    bot: string;
    family: string;
    path: string;
    host?: string | null;
    verification: string;
    createdAt: string;
  }>;
  topPaths: Array<{
    bot: string;
    path: string;
    requests: number;
    lastSeen: string | null;
  }>;
  verification: string;
};

type TrafficAnalytics = {
  days: number;
  summary: {
    pageViews: number;
    uniqueSessions: number;
    entries: number;
  };
  sources: Array<{
    source: string;
    pageViews: number;
    uniqueSessions: number;
  }>;
  daily: Array<{
    date: string;
    pageViews: number;
    uniqueSessions: number;
  }>;
  topPages: Array<{
    path: string;
    pageViews: number;
    uniqueSessions: number;
  }>;
  topLandingPages: Array<{
    landingPath: string;
    sessions: number;
  }>;
  campaigns: Array<{
    campaign: string;
    source: string;
    sessions: number;
  }>;
};

const sourceLabels: Record<string, string> = {
  GOOGLE: "Google",
  CHATGPT: "ChatGPT",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  BING: "Bing",
  YAHOO: "Yahoo",
  LINKEDIN: "LinkedIn",
  X: "X / Twitter",
  WHATSAPP: "WhatsApp",
  REDDIT: "Reddit",
  THREADS: "Threads",
  EMAIL: "Email",
  PUSH: "Push",
  DIRECT: "Direct",
  REFERRAL: "Other Referral",
  OTHER: "Other",
};

function number(value: unknown) {
  return Number(value || 0).toLocaleString();
}

export default function AdminTrafficPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-traffic-analytics", days],
    queryFn: async () => {
      const response = await privateApi.get(
        `/notifications/admin/traffic-analytics?days=${days}`,
      );
      return response.data as TrafficAnalytics;
    },
    refetchInterval: 60_000,
  });

  const {
    data: crawlerData,
    isLoading: crawlerLoading,
    isFetching: crawlerFetching,
  } = useQuery({
    queryKey: ["admin-crawler-analytics", days],
    queryFn: async () => {
      const response = await privateApi.get(
        `/notifications/admin/crawler-analytics?days=${days}`,
      );
      return response.data as CrawlerAnalytics;
    },
    refetchInterval: 60_000,
  });

  const maxDaily = Math.max(
    1,
    ...(data?.daily || []).map((item) => Number(item.uniqueSessions || 0)),
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Traffic Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google, ChatGPT, Facebook, Instagram, TikTok, YouTube र अन्य sources बाट RoomKhoj मा आएको traffic।
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[7, 30, 90, 365].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={days === value ? "default" : "outline"}
              onClick={() => setDays(value)}
            >
              {value === 365 ? "1 Year" : `${value} Days`}
            </Button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Unique sessions</p>
                  <p className="text-3xl font-black">{number(data.summary.uniqueSessions)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <MousePointerClick className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Page views</p>
                  <p className="text-3xl font-black">{number(data.summary.pageViews)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Globe2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Entry visits</p>
                  <p className="text-3xl font-black">{number(data.summary.entries)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Traffic by source
                {isFetching && <span className="text-xs font-normal text-muted-foreground">Updating…</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Traffic data आउन थालेपछि यहाँ source breakdown देखिन्छ।</p>
              ) : (
                data.sources.map((item) => {
                  const total = Math.max(1, Number(data.summary.uniqueSessions || 0));
                  const width = Math.max(
                    2,
                    Math.round((Number(item.uniqueSessions || 0) / total) * 100),
                  );
                  return (
                    <div key={item.source} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{sourceLabels[item.source] || item.source}</p>
                        <p className="text-sm font-semibold">
                          {number(item.uniqueSessions)} sessions · {number(item.pageViews)} views
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5" />
                Crawler / AI Bots
                {crawlerFetching && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Updating…
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {crawlerLoading || !crawlerData ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bot requests
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {number(crawlerData.summary.requests)}
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Detected bots
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {number(crawlerData.summary.uniqueBots)}
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Last seen
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {crawlerData.summary.lastSeen
                          ? new Date(crawlerData.summary.lastSeen).toLocaleString()
                          : "No crawler seen yet"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Radar className="h-4 w-4 text-primary" />
                      <h3 className="font-black">Detected crawler types</h3>
                    </div>
                    {crawlerData.bots.length === 0 ? (
                      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        Googlebot, OAI-SearchBot, Bingbot वा अन्य crawler आएपछि यहाँ देखिन्छ।
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {crawlerData.bots.map((item) => (
                          <div
                            key={item.bot}
                            className="rounded-xl border bg-card p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black">{item.bot}</p>
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                  {item.family.replaceAll("_", " ")}
                                </p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                                {number(item.requests)}
                              </span>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                              Last:{" "}
                              {item.lastSeen
                                ? new Date(item.lastSeen).toLocaleString()
                                : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <h3 className="mb-3 font-black">Recent crawler requests</h3>
                      <div className="space-y-2">
                        {crawlerData.recent.slice(0, 15).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-bold">{item.bot}</p>
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {item.path}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-black">Most crawled pages</h3>
                      <div className="space-y-2">
                        {crawlerData.topPaths.slice(0, 15).map((item, index) => (
                          <div
                            key={`${item.bot}-${item.path}-${index}`}
                            className="rounded-xl border p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-bold">{item.bot}</p>
                              <span className="text-xs font-black">
                                {number(item.requests)} hits
                              </span>
                            </div>
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {item.path}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    Bot identity अहिले User-Agent बाट detect हुन्छ। त्यसैले
                    “Googlebot” देखिनु request को User-Agent evidence हो; reverse-DNS
                    verified identity होइन। Exact final HTTP 200/404/403 status हेर्न
                    Cloudflare/Vercel edge logs चाहिन्छ।
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily traffic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.daily.slice(-31).map((item) => (
                  <div key={item.date} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{item.date.slice(5)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.max(
                            2,
                            (Number(item.uniqueSessions || 0) / maxDaily) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold">{number(item.uniqueSessions)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top landing pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topLandingPages.slice(0, 12).map((item) => (
                  <div key={item.landingPath} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                    <p className="min-w-0 break-all text-sm font-medium">{item.landingPath}</p>
                    <span className="shrink-0 text-sm font-bold">{number(item.sessions)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topPages.slice(0, 15).map((item) => (
                  <div key={item.path} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold">{item.path}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{number(item.uniqueSessions)} unique sessions</p>
                    </div>
                    <span className="shrink-0 text-sm font-black">{number(item.pageViews)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ExternalLink className="h-5 w-5" />
                  UTM campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    utm_source / utm_campaign भएको marketing links चलाएपछि campaign data यहाँ देखिन्छ।
                  </p>
                ) : (
                  data.campaigns.map((item, index) => (
                    <div key={`${item.campaign}-${item.source}-${index}`} className="rounded-xl border p-3">
                      <p className="font-bold">{item.campaign}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sourceLabels[String(item.source).toUpperCase()] || item.source} · {number(item.sessions)} sessions
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Privacy: यो tracker ले traffic source/session/landing page मात्र aggregate गर्छ। IP address वा precise location analytics table मा store गर्दैन।
          </p>
        </>
      )}
    </div>
  );
}
