"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  GitFork,
  Search,
  Trophy,
  Users,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type LeaderboardUser = {
  userId: string;
  name: string;
  referralCode: string;
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

function ReferralTreeNode({
  node,
  level = 0,
}: {
  node: ReferralNode;
  level?: number;
}) {
  const [open, setOpen] = useState(level < 2);
  const hasChildren = node.children?.length > 0;

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-3 rounded-xl border bg-background p-3"
        style={{ marginLeft: `${Math.min(level, 6) * 18}px` }}
      >
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

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <ReferralTreeNode
            key={child.userId}
            node={child}
            level={level + 1}
          />
        ))}
    </div>
  );
}

export default function AdminReferralPage() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("userId");
    if (selected) setUserId(selected);
  }, []);

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const response = await privateApi.get("/referral/leaderboard");
      return response.data.data as LeaderboardUser[];
    },
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
          Verified referral chain र monthly leaderboard हेर्नुहोस्।
        </p>
      </div>

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
            Monthly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              अहिले qualified referral छैन।
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.referralCode}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {user.qualifiedReferrals} verified
                  </p>
                  <Link
                    href={`/admin/dashboard/referrals?userId=${user.userId}`}
                  >
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Chain
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
