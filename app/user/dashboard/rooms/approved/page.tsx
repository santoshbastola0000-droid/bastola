"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Search, Inbox, RefreshCw, Users } from "lucide-react";
import { roomService } from "@/http/services/room.service";
import { Room, RoomStatus } from "@/types/room.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomCard } from "@/components/user/rooms/RoomCard";
import { StatusTabs } from "@/components/user/rooms/StatusTabs";
import { RoomDrawer } from "@/components/admin/RoomDrawer";

export default function UserApprovedRoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["user-approved-rooms", debouncedSearch],
    queryFn: () =>
      roomService.getMyRooms({
        approvalStatus: RoomStatus.APPROVED,
        search: debouncedSearch || undefined,
      }),
  });

  const rooms = data?.data || [];

  console.log("rooms", data);

  const approvedRooms = rooms.filter(
    (room) => room.approvalStatus === RoomStatus.APPROVED,
  );

  const availableRooms = approvedRooms.filter(
    (room) => room.listingStatus === RoomStatus.AVAILABLE,
  );
  const rentedRooms = approvedRooms.filter(
    (room) => room.listingStatus === RoomStatus.RENTED,
  );
  const archivedRooms = approvedRooms.filter(
    (room) => room.listingStatus === RoomStatus.ARCHIVED,
  );

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setShowDetailsDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowDetailsDrawer(false);
    setTimeout(() => setSelectedRoom(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                My Rooms
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your approved room listings
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-gray-300"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Status Tabs */}
          <StatusTabs />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your approved rooms by title or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {availableRooms.length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Rented</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {rentedRooms.length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Archived</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {archivedRooms.length}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Inbox className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : approvedRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Approved Rooms
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {searchTerm
                  ? "No rooms match your search criteria"
                  : "You don't have any approved rooms yet"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() =>
                    (window.location.href = "/user/dashboard/rooms/add")
                  }
                  className="mt-6 bg-primary hover:bg-primary/90"
                >
                  List a New Room
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Room Details Drawer */}
        {selectedRoom && (
          <RoomDrawer
            room={selectedRoom}
            open={showDetailsDrawer}
            onOpenChange={handleDrawerClose}
          />
        )}
      </div>
    </div>
  );
}
