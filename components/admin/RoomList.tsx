"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Utensils,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomDrawer } from "./RoomDrawer";
import { formatPrice, formatDate } from "@/lib/utils";
import { RoomStatus, RoomCategory } from "@/types/room.types";

// Mock data - replace with API call
const mockRooms = [
  {
    id: "1",
    title: "Modern Studio Apartment",
    description: "Beautiful studio with city view",
    category: RoomCategory.STUDIO,
    price: 1200,
    address: "123 Main St, New York",
    status: RoomStatus.AVAILABLE,
    bathroomCapacity: 1,
    floorNumber: 3,
    ownerLivesInHouse: false,
    totalHouseCapacity: 4,
    rentedRoomsCount: 2,
    currentOccupants: 2,
    allowsWomen: true,
    roomCapacity: 2,
    roomArea: 45,
    contactPerson: "John Doe",
    contactPhone: "+1 234 567 8900",
    contactEmail: "john@example.com",
    amenities: ["WiFi", "AC", "Parking", "TV", "Kitchen"],
    images: [],
    createdAt: new Date().toISOString(),
    user: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    },
    location: {
      name: "Downtown Apartment",
      latitude: 40.7128,
      longitude: -74.006,
      city: "New York",
      state: "NY",
      country: "USA",
    },
    waterSupplyTimings: {
      morning: "06:00-09:00",
      evening: "17:00-20:00",
    },
  },
  // Add more mock rooms...
];

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1">
          <CheckCircle className="h-3 w-3" />
          Available
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case RoomStatus.OCCUPIED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1">
          <Users className="h-3 w-3" />
          Occupied
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getCategoryIcon = (category: RoomCategory) => {
  switch (category) {
    case RoomCategory.APARTMENT:
      return <Building2 className="h-4 w-4" />;
    case RoomCategory.STUDIO:
      return <Building2 className="h-4 w-4" />;
    case RoomCategory.HOSTEL:
      return <Users className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-3 w-3" />;
    case "ac":
      return <Snowflake className="h-3 w-3" />;
    case "parking":
      return <Car className="h-3 w-3" />;
    case "tv":
      return <Tv className="h-3 w-3" />;
    case "kitchen":
      return <Utensils className="h-3 w-3" />;
    default:
      return null;
  }
};

export function RoomList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock API call
  const { data: rooms = mockRooms, isLoading } = useQuery({
    queryKey: ["rooms", search, statusFilter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      let filteredRooms = [...mockRooms];

      if (search) {
        filteredRooms = filteredRooms.filter(
          (room) =>
            room.title.toLowerCase().includes(search.toLowerCase()) ||
            room.address.toLowerCase().includes(search.toLowerCase()),
        );
      }

      if (statusFilter !== "all") {
        filteredRooms = filteredRooms.filter(
          (room) => room.status === statusFilter,
        );
      }

      return filteredRooms;
    },
  });

  const handleViewRoom = (room: any) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === RoomStatus.AVAILABLE).length,
    occupied: rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length,
    pending: rooms.filter((r) => r.status === RoomStatus.PENDING).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              Rooms Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all room listings and approvals
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href="/admin/dashboard/rooms/create">
              <Plus className="h-4 w-4 mr-2" />
              Add New Room
            </a>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </CardContent>
          </Card>
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Available</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.available}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Occupied</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.occupied}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search rooms by title or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={RoomStatus.AVAILABLE}>
                      Available
                    </SelectItem>
                    <SelectItem value={RoomStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={RoomStatus.OCCUPIED}>
                      Occupied
                    </SelectItem>
                    <SelectItem value={RoomStatus.RENTED}>Rented</SelectItem>
                    <SelectItem value={RoomStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Room Details</TableHead>
                  <TableHead className="font-semibold">
                    Capacity & Facilities
                  </TableHead>
                  <TableHead className="font-semibold">
                    Location & Contact
                  </TableHead>
                  <TableHead className="font-semibold">
                    Status & Price
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(room.category)}
                            <span className="text-sm font-medium text-gray-500 capitalize">
                              {room.category}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {room.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {room.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.amenities?.slice(0, 3).map((amenity) => (
                              <Badge
                                key={amenity}
                                variant="outline"
                                className="text-xs gap-1"
                              >
                                {getAmenityIcon(amenity)}
                                {amenity}
                              </Badge>
                            ))}
                            {room.amenities?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{room.roomCapacity} persons</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bath className="h-4 w-4 text-gray-500" />
                              <span>{room.bathroomCapacity} bath</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4 text-gray-500" />
                              <span>{room.floorNumber} floor</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span>{room.roomArea} m²</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              House capacity: {room.totalHouseCapacity}
                            </p>
                            <p className="text-xs text-gray-500">
                              Occupied: {room.currentOccupants} /{" "}
                              {room.roomCapacity}
                            </p>
                            <Badge
                              variant={room.allowsWomen ? "default" : "outline"}
                              className={
                                room.allowsWomen
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {room.allowsWomen
                                ? "Women Allowed"
                                : "Women Not Allowed"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{room.address}</span>
                          </div>
                          {room.contactPerson && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span>{room.contactPerson}</span>
                            </div>
                          )}
                          {room.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <a
                                href={`tel:${room.contactPhone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {room.contactPhone}
                              </a>
                            </div>
                          )}
                          {room.contactEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <a
                                href={`mailto:${room.contactEmail}`}
                                className="text-blue-600 hover:underline"
                              >
                                {room.contactEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          <div>{getStatusBadge(room.status)}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="font-bold text-lg text-gray-900">
                                {formatPrice(room.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                /month
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Added: {formatDate(room.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleViewRoom(room)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                            asChild
                            title="Edit"
                          >
                            <a href={`/admin/dashboard/rooms/${room.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="More actions"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  // Handle delete
                                }}
                              >
                                Delete Room
                              </DropdownMenuItem>
                              {room.status === RoomStatus.PENDING && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Handle approve
                                    }}
                                  >
                                    Approve Room
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Handle reject
                                    }}
                                  >
                                    Reject Room
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Building2 className="h-16 w-16 text-gray-300" />
                        <div>
                          <h3 className="font-semibold text-lg text-gray-700">
                            No Rooms Found
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {search
                              ? "No rooms match your search"
                              : "Start by adding your first room"}
                          </p>
                        </div>
                        <Button
                          asChild
                          className="mt-2 bg-primary hover:bg-primary/90"
                        >
                          <a href="/admin/dashboard/rooms/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Room
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Room Details Drawer */}
      {selectedRoom && (
        <RoomDrawer
          room={selectedRoom}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      )}
    </>
  );
}
