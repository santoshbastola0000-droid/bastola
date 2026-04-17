"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Home,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Star,
  AlertCircle,
  ChevronRight,
  Wallet,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { dashboardService } from "@/http/services/dashboard.service";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { api } from "@/http/api/api";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
  trend = "neutral",
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
                {trend === "down" && (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-gray-500",
                  )}
                >
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl",
              bgColor,
              "group-hover:scale-110 transition-transform",
            )}
          >
            <Icon className={cn("h-5 w-5", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function UserDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ["dashboard-earnings", selectedPeriod],
    queryFn: () => dashboardService.getEarningsData(selectedPeriod),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => dashboardService.getRecentActivity(),
  });

  if (!mounted) return null;

  if (statsLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load dashboard
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please try refreshing the page
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Earned",
      value: `₹${formatNepaliCurrency(stats?.totalEarned || 0)}`,
      change: 23.5,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "up" as const,
    },
    {
      title: "Wallet Balance",
      value: `₹${formatNepaliCurrency(stats?.walletBalance || 0)}`,
      change: 18.2,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "up" as const,
    },
    {
      title: "Total Rooms",
      value: stats?.total || 0,
      change: 33.3,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "up" as const,
    },
    {
      title: "Avg. Rating",
      value: "4.8",
      change: 5.1,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      trend: "up" as const,
    },
  ];

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    const cleanImagePath = imagePath.replace(/^\//, "");
    const baseUrl = api.defaults.baseURL || "";
    return `${baseUrl}/${cleanImagePath}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className=" w-screen justify-between flex items-center gap-2">
          <Button
            size="sm"
            className="cursor-pointer gap-2 bg-primary hover:bg-primary/90"
            onClick={() => router.push("/user/dashboard/rooms/create")}
          >
            <Home className="h-4 w-4" />
            Add New Room
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Room Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Approved</p>
                <p className="text-xl font-bold text-green-900">
                  {stats?.approved || 0}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700">Pending</p>
                <p className="text-xl font-bold text-yellow-900">
                  {stats?.pending || 0}
                </p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Rejected</p>
                <p className="text-xl font-bold text-red-900">
                  {stats?.rejected || 0}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Available</p>
                <p className="text-xl font-bold text-blue-900">
                  {stats?.available || 0}
                </p>
              </div>
              <Home className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payout Alert */}
      {(stats?.pendingBalance || 0) > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <IndianRupee className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">
                    Pending Payout
                  </h3>
                  <p className="text-sm text-purple-700">
                    You have ₹{formatNepaliCurrency(stats?.pendingBalance || 0)}{" "}
                    pending approval
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => router.push("/user/rooms?status=pending")}
              >
                View Rooms
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                  Your earnings and bookings over time
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedPeriod === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("week")}
                  className="cursor-pointer"
                >
                  Week
                </Button>
                <Button
                  variant={selectedPeriod === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("month")}
                  className="cursor-pointer"
                >
                  Month
                </Button>
                <Button
                  variant={selectedPeriod === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("year")}
                  className="cursor-pointer"
                >
                  Year
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {earningsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earningsData}>
                      <defs>
                        <linearGradient
                          id="earningsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: any) => [
                          `₹${value.toLocaleString()}`,
                          "",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="earnings"
                        name="Earnings"
                        stroke="hsl(var(--primary))"
                        fill="url(#earningsGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : activities?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          activity.status === "success" &&
                            "bg-green-100 text-green-600",
                          activity.status === "pending" &&
                            "bg-yellow-100 text-yellow-600",
                          activity.status === "info" &&
                            "bg-blue-100 text-blue-600",
                          !activity.status && "bg-gray-100 text-gray-600",
                        )}
                      >
                        {activity.type === "payment" && (
                          <DollarSign className="h-4 w-4" />
                        )}
                        {activity.type === "room" && (
                          <Home className="h-4 w-4" />
                        )}
                        {activity.type === "booking" && (
                          <Calendar className="h-4 w-4" />
                        )}
                        {activity.type === "review" && (
                          <Star className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Rooms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Recent Rooms</CardTitle>
              <CardDescription>
                Manage your latest property listings
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-1"
              onClick={() => router.push("/user/dashboard/rooms")}
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.recentRooms?.map((room: any) => (
                <Link
                  key={room.id}
                  href={`/user/dashboard/rooms`}
                  className="block group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-4">
                      <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        {room.images?.[0] ? (
                          <img
                            src={getImageUrl(room.images[0])}
                            alt={room.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-8 w-8 text-primary/30" />
                          </div>
                        )}
                        <Badge
                          className={cn(
                            "absolute top-2 right-2",
                            room.status === "Approved" &&
                              "bg-green-100 text-green-800",
                            room.status === "Pending" &&
                              "bg-yellow-100 text-yellow-800",
                            room.status === "Rejected" &&
                              "bg-red-100 text-red-800",
                          )}
                        >
                          {room.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {room.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {room.address}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(room.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(room.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary cursor-pointer"
          onClick={() => router.push("/user/dashboard/rooms/create")}
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-medium">Add New Room</span>
          <span className="text-xs text-muted-foreground">
            List your property
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-500/5 hover:border-green-500 cursor-pointer"
          onClick={() => router.push("/user/wallet")}
        >
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-medium">Withdraw Funds</span>
          <span className="text-xs text-muted-foreground">
            Balance: ₹{formatNepaliCurrency(stats?.walletBalance || 0)}
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-500/5 hover:border-blue-500 cursor-pointer"
          onClick={() => router.push("/user/bookings")}
        >
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="font-medium">Manage Bookings</span>
          <span className="text-xs text-muted-foreground">
            {stats?.rented || 0} active
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
