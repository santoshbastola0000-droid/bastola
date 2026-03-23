"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Home,
  DollarSign,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  ChevronRight,
  Eye,
  UserPlus,
  Archive,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { adminDashboardService } from "@/http/services/admin-dashboard.service";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  trend,
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
            {trend && (
              <div className="flex items-center gap-1">
                {trend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.direction === "up"
                      ? "text-green-500"
                      : "text-red-500",
                  )}
                >
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {trend.label}
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

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#a855f7",
  "#ec4899",
];

export default function AdminDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => adminDashboardService.getStats(),
  });

  // Fetch chart data
  const {
    data: chartData,
    isLoading: chartLoading,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["admin-dashboard-chart", selectedPeriod],
    queryFn: () => adminDashboardService.getRoomChartData(selectedPeriod),
  });

  // Fetch category distribution
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["admin-dashboard-categories"],
    queryFn: () => adminDashboardService.getCategoryDistribution(),
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["admin-dashboard-activity"],
    queryFn: () => adminDashboardService.getRecentActivity(),
  });

  // Fetch recent withdrawals
  const { data: recentWithdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["admin-dashboard-withdrawals"],
    queryFn: () => adminDashboardService.getRecentWithdrawals(5),
  });

  // Fetch recent rooms
  const { data: recentRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["admin-dashboard-rooms"],
    queryFn: () => adminDashboardService.getRecentRooms(5),
  });

  const handleRefresh = () => {
    refetchStats();
    refetchChart();
  };

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
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: {
        value: ((stats?.newUsersToday || 0) / (stats?.totalUsers || 1)) * 100,
        label: "new today",
        direction: "up" as const,
      },
    },
    {
      title: "Total Rooms",
      value: stats?.totalRooms || 0,
      icon: Home,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: {
        value: ((stats?.roomsAddedToday || 0) / (stats?.totalRooms || 1)) * 100,
        label: "added today",
        direction: "up" as const,
      },
    },
    {
      title: "Total Revenue",
      value: `₹${formatNepaliCurrency(stats?.totalCommissionPaid || 0)}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: {
        value: 12.5,
        label: "vs last month",
        direction: "up" as const,
      },
    },
    {
      title: "Pending Withdrawals",
      value: stats?.pendingWithdrawals || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      trend: {
        value:
          ((stats?.pendingWithdrawalAmount || 0) /
            (stats?.totalWithdrawalAmount || 1)) *
          100,
        label: "of total",
        direction: "down" as const,
      },
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your platform's performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="cursor-pointer gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">
                  Approved Rooms
                </p>
                <p className="text-xl font-bold text-green-900">
                  {stats?.approvedRooms || 0}
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
                <p className="text-xs font-medium text-yellow-700">
                  Pending Rooms
                </p>
                <p className="text-xl font-bold text-yellow-900">
                  {stats?.pendingRooms || 0}
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
                <p className="text-xs font-medium text-red-700">
                  Rejected Rooms
                </p>
                <p className="text-xl font-bold text-red-900">
                  {stats?.rejectedRooms || 0}
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
                <p className="text-xs font-medium text-blue-700">
                  Available Rooms
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {stats?.availableRooms || 0}
                </p>
              </div>
              <Home className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Room Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Room Statistics</CardTitle>
                <CardDescription>
                  Number of rooms added over time
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
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Room Categories</CardTitle>
              <CardDescription>Distribution by property type</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="flex items-center justify-center h-[250px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="category"
                        label={({ category }) => category}
                      >
                        {categoryData?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData?.slice(0, 4).map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium ml-auto">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity and Withdrawals */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Withdrawals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Withdrawals</CardTitle>
                <CardDescription>Latest withdrawal requests</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer gap-1"
                onClick={() => router.push("/admin/dashboard/wallet")}
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentWithdrawals?.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No withdrawals yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWithdrawals?.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            withdrawal.status === "Pending" && "bg-yellow-100",
                            withdrawal.status === "Approved" && "bg-green-100",
                            withdrawal.status === "Rejected" && "bg-red-100",
                          )}
                        >
                          <Wallet
                            className={cn(
                              "h-4 w-4",
                              withdrawal.status === "Pending" &&
                                "text-yellow-600",
                              withdrawal.status === "Approved" &&
                                "text-green-600",
                              withdrawal.status === "Rejected" &&
                                "text-red-600",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {withdrawal.userName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {withdrawal.paymentMethod} • ₹
                            {formatNepaliCurrency(withdrawal.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={cn(
                            withdrawal.status === "Pending" &&
                              "bg-yellow-100 text-yellow-800",
                            withdrawal.status === "Approved" &&
                              "bg-green-100 text-green-800",
                            withdrawal.status === "Rejected" &&
                              "bg-red-100 text-red-800",
                          )}
                        >
                          {withdrawal.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activities</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentActivity?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          activity.type === "user" &&
                            "bg-blue-100 text-blue-600",
                          activity.type === "room" &&
                            "bg-green-100 text-green-600",
                          activity.type === "withdrawal" &&
                            "bg-purple-100 text-purple-600",
                        )}
                      >
                        {activity.type === "user" && (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {activity.type === "room" && (
                          <Home className="h-4 w-4" />
                        )}
                        {activity.type === "withdrawal" && (
                          <Wallet className="h-4 w-4" />
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
                      {activity.status && (
                        <Badge
                          className={cn(
                            activity.status === "success" &&
                              "bg-green-100 text-green-800",
                            activity.status === "pending" &&
                              "bg-yellow-100 text-yellow-800",
                            activity.status === "info" &&
                              "bg-blue-100 text-blue-800",
                          )}
                        >
                          {activity.status}
                        </Badge>
                      )}
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
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Rooms</CardTitle>
              <CardDescription>Latest property listings</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-1"
              onClick={() => router.push("/admin/dashboard/rooms")}
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentRooms?.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No rooms yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentRooms?.map((room) => (
                  <Link
                    key={room.id}
                    href={`/admin/dashboard/rooms/${room.id}`}
                    className="block group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            className={cn(
                              room.approvalStatus === "Approved" &&
                                "bg-green-100 text-green-800",
                              room.approvalStatus === "Pending" &&
                                "bg-yellow-100 text-yellow-800",
                              room.approvalStatus === "Rejected" &&
                                "bg-red-100 text-red-800",
                            )}
                          >
                            {room.approvalStatus}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {room.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                          {room.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          by {room.userName}
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
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {formatNepaliCurrency(stats?.totalWalletBalance || 0)}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Balance</p>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {formatNepaliCurrency(stats?.totalPendingBalance || 0)}
                </p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Commission Earned
                </p>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {formatNepaliCurrency(stats?.totalCommissionEarned || 0)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.activeUsers || 0}
                </p>
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
