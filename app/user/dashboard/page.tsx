"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Star,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Wallet,
  MapPin,
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
import {
  Area,
  AreaChart,
  Bar,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useUserStore } from "@/stores/user-store";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ActivityItem {
  id: string;
  type: "booking" | "message" | "payment" | "review" | "room";
  title: string;
  description: string;
  time: string;
  status?: "success" | "pending" | "warning" | "info";
}

const earningsData = [
  { month: "Jan", earnings: 12500, bookings: 8 },
  { month: "Feb", earnings: 15000, bookings: 12 },
  { month: "Mar", earnings: 18000, bookings: 15 },
  { month: "Apr", earnings: 16500, bookings: 14 },
  { month: "May", earnings: 22000, bookings: 18 },
  { month: "Jun", earnings: 25000, bookings: 22 },
  { month: "Jul", earnings: 28000, bookings: 25 },
  { month: "Aug", earnings: 26000, bookings: 23 },
  { month: "Sep", earnings: 29000, bookings: 26 },
  { month: "Oct", earnings: 31000, bookings: 28 },
  { month: "Nov", earnings: 33500, bookings: 30 },
  { month: "Dec", earnings: 42000, bookings: 35 },
];

const bookingData = [
  { name: "Completed", value: 145, color: "#22c55e" },
  { name: "Pending", value: 23, color: "#eab308" },
  { name: "Cancelled", value: 12, color: "#ef4444" },
  { name: "In Progress", value: 34, color: "#3b82f6" },
];

const recentRooms = [
  {
    id: 1,
    title: "Luxury 3BHK in Thamel",
    location: "Thamel, Kathmandu",
    price: 25000,
    status: "approved",
    bookings: 24,
    rating: 4.8,
    revenue: 325000,
    image: "/images/room1.jpg",
  },
  {
    id: 2,
    title: "Modern Studio Apartment",
    location: "Lalitpur",
    price: 18000,
    status: "approved",
    bookings: 18,
    rating: 4.6,
    revenue: 245000,
    image: "/images/room2.jpg",
  },
  {
    id: 3,
    title: "Cozy 1BHK for Students",
    location: "Baluwatar",
    price: 12000,
    status: "pending",
    bookings: 0,
    rating: 0,
    revenue: 0,
    image: "/images/room3.jpg",
  },
  {
    id: 4,
    title: "Penthouse with Mountain View",
    location: "Budhanilkantha",
    price: 45000,
    status: "approved",
    bookings: 12,
    rating: 4.9,
    revenue: 485000,
    image: "/images/room4.jpg",
  },
];

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "booking",
    title: "New booking received",
    description: "John Doe booked 'Luxury 3BHK in Thamel' for 3 nights",
    time: "5 minutes ago",
    status: "success",
  },
  {
    id: "2",
    type: "message",
    title: "New message from guest",
    description: "Sarah asked about check-in time for your studio",
    time: "15 minutes ago",
    status: "info",
  },
  {
    id: "3",
    type: "payment",
    title: "Payment of ₹25,000 received",
    description: "Payment for booking #BKG-2024-0012",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: "4",
    type: "review",
    title: "New 5-star review",
    description: "Amazing place! Will definitely come back.",
    time: "3 hours ago",
    status: "success",
  },
  {
    id: "5",
    type: "room",
    title: "Room approval pending",
    description: "Your room 'Cozy Studio' is under review",
    time: "5 hours ago",
    status: "pending",
  },
  {
    id: "6",
    type: "booking",
    title: "Booking cancelled",
    description: "Guest cancelled 'Penthouse' booking",
    time: "1 day ago",
    status: "warning",
  },
];

// Stat Card Component
const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            <div className="flex items-center gap-1 mt-2">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  change > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs last month
              </span>
            </div>
          </div>
          <div className={cn("p-3 rounded-xl", bgColor)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
        </div>
        <div className="mt-4 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all group-hover:scale-x-105",
              color.replace("text", "bg"),
            )}
            style={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Activity Icon Helper
const getActivityIcon = (
  type: ActivityItem["type"],
  status?: ActivityItem["status"],
) => {
  switch (type) {
    case "booking":
      return <Calendar className="h-4 w-4" />;
    case "message":
      return <MessageSquare className="h-4 w-4" />;
    case "payment":
      return <DollarSign className="h-4 w-4" />;
    case "review":
      return <Star className="h-4 w-4" />;
    case "room":
      return <Home className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getActivityColor = (
  type: ActivityItem["type"],
  status?: ActivityItem["status"],
) => {
  if (status === "success") return "bg-green-100 text-green-600";
  if (status === "pending") return "bg-yellow-100 text-yellow-600";
  if (status === "warning") return "bg-orange-100 text-orange-600";
  if (status === "info") return "bg-blue-100 text-blue-600";

  switch (type) {
    case "booking":
      return "bg-purple-100 text-purple-600";
    case "message":
      return "bg-blue-100 text-blue-600";
    case "payment":
      return "bg-green-100 text-green-600";
    case "review":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Main Dashboard Component
export default function UserDashboard() {
  const router = useRouter();
  const { user } = useUserStore();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    {
      title: "Total Revenue",
      value: "₹3,42,500",
      change: 23.5,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Bookings",
      value: "214",
      change: 18.2,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Rooms",
      value: "8",
      change: 33.3,
      icon: Home,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg. Rating",
      value: "4.8",
      change: 5.1,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Welcome back, {user?.name?.split(" ")[0] || "User"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Kathmandu, Nepal •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2"
            onClick={() => router.push("/user/rooms/create")}
          >
            <Home className="h-4 w-4" />
            Add New Room
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2"
            onClick={() => router.push("/user/wallet/withdrawals")}
          >
            <Wallet className="h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

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
                  Your monthly earnings and bookings
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
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="earnings"
                      name="Earnings (₹)"
                      stroke="hsl(var(--primary))"
                      fill="url(#earningsGradient)"
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="bookings"
                      name="Bookings"
                      fill="hsl(var(--primary) / 0.3)"
                      radius={[4, 4, 0, 0]}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Booking Distribution</CardTitle>
              <CardDescription>Status of your bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              <div className="grid grid-cols-2 gap-2 mt-4">
                {bookingData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium ml-auto">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Rooms & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Rooms</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer gap-1"
                onClick={() => router.push("/user/rooms")}
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-accent/5 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/user/rooms/${room.id}`)}
                  >
                    <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden">
                      {room.image ? (
                        <img
                          src={room.image}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Home className="h-6 w-6 text-primary/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                            {room.title}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {room.location}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "capitalize",
                            room.status === "approved" &&
                              "bg-green-100 text-green-700",
                            room.status === "pending" &&
                              "bg-yellow-100 text-yellow-700",
                          )}
                        >
                          {room.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-500" />₹
                          {room.price.toLocaleString()}/mo
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          {room.bookings} bookings
                        </span>
                        {room.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {room.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and notifications
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer gap-1"
                onClick={() => router.push("/user/notifications")}
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/user/activities/${activity.id}`)
                    }
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        getActivityColor(activity.type, activity.status),
                      )}
                    >
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Response Rate
                    </p>
                    <p className="text-lg font-bold text-primary">98%</p>
                    <Progress value={98} className="mt-2 h-1" />
                  </div>
                  <div className="text-center p-3 bg-green-500/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Avg. Response
                    </p>
                    <p className="text-lg font-bold text-green-600">15 min</p>
                    <Progress
                      value={85}
                      className="mt-2 h-1 bg-green-100 [&>div]:bg-green-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>How your listings are performing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Occupancy Rate
                  </span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-green-600">↑ 12% vs last month</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Booking Conversion
                  </span>
                  <span className="text-sm font-medium">64%</span>
                </div>
                <Progress value={64} className="h-2" />
                <p className="text-xs text-green-600">↑ 8% vs last month</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Guest Satisfaction
                  </span>
                  <span className="text-sm font-medium">4.8/5</span>
                </div>
                <Progress value={96} className="h-2" />
                <p className="text-xs text-green-600">↑ 0.3 vs last month</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Repeat Guests
                  </span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <Progress value={42} className="h-2" />
                <p className="text-xs text-yellow-600">→ Stable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary cursor-pointer"
          onClick={() => router.push("/user/rooms/create")}
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
          <span className="text-xs text-muted-foreground">Balance: ₹3.42L</span>
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
          <span className="text-xs text-muted-foreground">8 pending</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-500/5 hover:border-purple-500 cursor-pointer"
          onClick={() => router.push("/user/analytics")}
        >
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="font-medium">View Analytics</span>
          <span className="text-xs text-muted-foreground">
            Detailed insights
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
