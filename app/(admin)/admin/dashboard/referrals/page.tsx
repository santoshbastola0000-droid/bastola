"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  GitFork,
  MousePointerClick,
  Search,
  Trophy,
  Users,
  Save,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type LeaderboardUser = {
  name: string;
  qualifiedReferrals: string | number;
};

type ReferralNode = {
  userId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  referralCode: string | null;
  directReferralCount: number;
  referralStatus?: "PENDING" | "QUALIFIED" | "REJECTED";
  children: ReferralNode[];
  hasMore?: boolean;
};

type ReferralContentSettings = {
  title: string;
  introText: string;
  earningRulesText: string;
  promoText: string;
  disclaimerText: string;
  updatedAt?: string | null;
};

type ReferralOfferClickAnalytics = {
  summary: {
    clicks: number;
    uniqueClickers: number;
    lastClickedAt: string | null;
  };
  recentClicks: Array<{
    id: string;
    userId: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    clickedAt: string | null;
    createdAt: string;
    metadata?: {
      placement?: string;
      fromPath?: string;
    };
  }>;
};

function ReferralTreeNode({
  node,
  level = 0,
  parentName,
}: {
  node: ReferralNode;
  level?: number;
  parentName?: string;
}) {
  const [open, setOpen] = useState(level < 2);
  const hasChildren = node.children?.length > 0;

  return (
    <div
      className={
        level === 0
          ? "space-y-2"
          : "relative ml-4 space-y-2 border-l-2 border-violet-200 pl-5"
      }
    >
      {level > 0 && (
        <span className="absolute left-0 top-8 h-0.5 w-5 -translate-x-px bg-violet-200" />
      )}
      <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-background p-3 shadow-sm">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded p-1 hover:bg-muted"
            aria-label={open ? "Collapse referrals" : "Expand referrals"}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <div className="min-w-0 flex-1">
          <p className="font-semibold">{node.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {node.email || node.phoneNumber || node.userId}
          </p>
        </div>

        <div className="hidden text-right text-xs sm:block">
          <p>{node.directReferralCount} direct referrals</p>
          {parentName && (
            <p className="max-w-44 truncate text-muted-foreground">
              Referred by: {parentName}
            </p>
          )}
          {node.referralStatus && (
            <p
              className={
                node.referralStatus === "QUALIFIED"
                  ? "text-emerald-600"
                  : "text-amber-600"
              }
            >
              {node.referralStatus}
            </p>
          )}
        </div>

        {node.isVerified ? (
          <CircleCheck className="h-5 w-5 text-emerald-600" />
        ) : (
          <Clock className="h-5 w-5 text-amber-500" />
        )}
      </div>

      <div className="grid gap-2 rounded-xl border border-dashed bg-muted/30 p-3 text-xs sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Referred by</span>
          <span className="max-w-[62%] truncate text-right font-semibold">
            {parentName || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Referred users</span>
          <span className="font-semibold">{node.directReferralCount}</span>
        </div>
        {node.children?.length > 0 && (
          <div>
            <p className="mb-1 text-muted-foreground">Who came from this referral</p>
            <div className="flex flex-wrap gap-1.5">
              {node.children.map((child) => (
                <span
                  key={child.userId}
                  className="rounded-full border bg-background px-2 py-1 font-medium"
                >
                  {child.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {node.referralStatus && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <span
              className={
                node.referralStatus === "QUALIFIED"
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-amber-600"
              }
            >
              {node.referralStatus}
            </span>
          </div>
        )}
      </div>

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <ReferralTreeNode
            key={child.userId}
            node={child}
            level={level + 1}
            parentName={node.name}
          />
        ))}
    </div>
  );
}

export default function AdminReferralPage() {
  const [userId, setUserId] = useState("");
  const [savingContent, setSavingContent] = useState(false);
  const [contentForm, setContentForm] = useState<ReferralContentSettings>({
    title: "Invite & Earn",
    introText: "",
    earningRulesText: "",
    promoText: "",
    disclaimerText: "",
  });

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("userId");
    if (selected) setUserId(selected);
  }, []);

  const { data: referralContent } = useQuery({
    queryKey: ["admin-referral-content"],
    queryFn: async () => {
      const response = await privateApi.get("/referral/content");
      return response.data.data as ReferralContentSettings;
    },
  });

  useEffect(() => {
    if (!referralContent) return;
    setContentForm({
      title: referralContent.title || "Invite & Earn",
      introText: referralContent.introText || "",
      earningRulesText: referralContent.earningRulesText || "",
      promoText: referralContent.promoText || "",
      disclaimerText: referralContent.disclaimerText || "",
      updatedAt: referralContent.updatedAt || null,
    });
  }, [referralContent]);

  const saveReferralContent = async () => {
    try {
      setSavingContent(true);
      const response = await privateApi.patch(
        "/referral/admin/content",
        contentForm,
      );
      const next = response.data.data as ReferralContentSettings;
      setContentForm(next);
      toast.success("Refer & Earn text updated");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Referral text update गर्न सकिएन.",
      );
    } finally {
      setSavingContent(false);
    }
  };

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const response = await privateApi.get("/referral/leaderboard");
      return response.data.data as LeaderboardUser[];
    },
  });

  const { data: offerClicks, isLoading: offerClicksLoading } = useQuery({
    queryKey: ["header-referral-offer-clicks"],
    queryFn: async () => {
      const response = await privateApi.get(
        "/notifications/admin/referral-offer-clicks",
        { params: { limit: 100 } },
      );
      return response.data as ReferralOfferClickAnalytics;
    },
    refetchInterval: 30_000,
  });

  const {
    data: treeData,
    isLoading: treeLoading,
    error: treeError,
  } = useQuery({
    queryKey: ["admin-referral-tree", userId],
    queryFn: async () => {
      const response = await privateApi.get(`/referral/admin/tree/${userId}`);
      return response.data.data as { root: ReferralNode; maxDepth: number };
    },
    enabled: Boolean(userId),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <GitFork className="h-7 w-7 text-primary" />
          Referral Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mobile र desktop दुवैमा को कसको referral बाट आयो र कसले क-कसलाई ल्यायो हेर्नुहोस्।
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Save className="h-5 w-5 text-primary" />
            Edit Refer & Earn User Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold">Page title</p>
            <Input
              value={contentForm.title}
              onChange={(event) =>
                setContentForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              maxLength={160}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Intro text</p>
            <Textarea
              value={contentForm.introText}
              onChange={(event) =>
                setContentForm((current) => ({
                  ...current,
                  introText: event.target.value,
                }))
              }
              rows={4}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Network earning rules</p>
            <Textarea
              value={contentForm.earningRulesText}
              onChange={(event) =>
                setContentForm((current) => ({
                  ...current,
                  earningRulesText: event.target.value,
                }))
              }
              rows={6}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Default payout engine: RoomKhoj 5% · direct referrer 5% · second level 2.5% · remaining amount agent.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Premium / promo explanation</p>
            <Textarea
              value={contentForm.promoText}
              onChange={(event) =>
                setContentForm((current) => ({
                  ...current,
                  promoText: event.target.value,
                }))
              }
              rows={4}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Disclaimer / important note</p>
            <Textarea
              value={contentForm.disclaimerText}
              onChange={(event) =>
                setContentForm((current) => ({
                  ...current,
                  disclaimerText: event.target.value,
                }))
              }
              rows={4}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void saveReferralContent()}
              disabled={savingContent}
            >
              <Save className="mr-2 h-4 w-4" />
              {savingContent ? "Saving..." : "Save User Text"}
            </Button>
            {contentForm.updatedAt && (
              <span className="text-xs text-muted-foreground">
                Last updated {new Date(contentForm.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/70 to-rose-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MousePointerClick className="h-5 w-5 text-rose-500" />
            Header Refer & Earn Offer Clicks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offerClicksLoading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Total clicks</p>
                  <p className="mt-1 text-2xl font-black">{offerClicks?.summary.clicks || 0}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Unique users</p>
                  <p className="mt-1 text-2xl font-black">{offerClicks?.summary.uniqueClickers || 0}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Last click</p>
                  <p className="mt-1 text-sm font-bold">
                    {offerClicks?.summary.lastClickedAt
                      ? new Date(offerClicks.summary.lastClickedAt).toLocaleString()
                      : "No clicks yet"}
                  </p>
                </div>
              </div>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border bg-white">
                {offerClicks?.recentClicks?.length ? (
                  offerClicks.recentClicks.map((click) => (
                    <div
                      key={click.id}
                      className="flex flex-col gap-1 border-b px-3 py-2 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{click.name || "RoomKhoj user"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {click.phoneNumber || click.email || click.userId}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right">
                        <p>{click.clickedAt ? new Date(click.clickedAt).toLocaleString() : "-"}</p>
                        <p>{click.metadata?.placement || "HEADER"} · {click.metadata?.fromPath || "/"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">अहिलेसम्म offer click भएको छैन।</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            Open Referral Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={userId}
            onChange={(event) => setUserId(event.target.value.trim())}
            placeholder="Paste user ID, or open Chain from Users page"
          />
          <Button
            type="button"
            onClick={() => setUserId((value) => value)}
            disabled={!userId}
            className="cursor-pointer"
          >
            View Chain
          </Button>
        </CardContent>
      </Card>

      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Referral Chain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {treeLoading && <Skeleton className="h-48 w-full" />}
            {treeError && (
              <p className="text-sm text-destructive">
                Referral chain load हुन सकेन। User ID सही छ कि जाँच्नुहोस्।
              </p>
            )}
            {treeData?.root && <ReferralTreeNode node={treeData.root} />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              अहिले qualified referral छैन।
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div
                  key={`${user.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-semibold">
                    {user.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
