"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, Inbox, RefreshCw } from "lucide-react";
import { roomService } from "@/http/services/room.service";
import { Room, RoomStatus } from "@/types/room.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomCard } from "@/components/user/rooms/RoomCard";
import { RoomDrawer } from "@/components/admin/RoomDrawer";

export default function UserPendingRoomsPage() {
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
    queryKey: ["user-pending-rooms", debouncedSearch],
    queryFn: () =>
      roomService.getMyRooms({
        approvalStatus: RoomStatus.PENDING,
        search: debouncedSearch || undefined,
      }),
  });

  const rooms = data?.data || [];
  const pendingRooms = rooms.filter(
    (room) => room.approvalStatus === RoomStatus.PENDING,
  );

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setShowDetailsDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowDetailsDrawer(false);
    // Don't clear selected room immediately to avoid flicker
    setTimeout(() => setSelectedRoom(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                My Rooms
              </h1>
              <p className="text-gray-600 mt-1">
                Track your room listings and their approval status
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-gray-300 cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your pending rooms by title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {pendingRooms.length} room
                  {pendingRooms.length !== 1 ? "s" : ""} pending approval
                </p>
                <p className="text-xs text-yellow-600">
                  Your rooms are under review. You'll be notified once they're
                  approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
        ) : pendingRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRooms.map((room) => (
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
              <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
                <Inbox className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Pending Rooms
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {searchTerm
                  ? "No rooms match your search criteria"
                  : "You don't have any rooms waiting for approval"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() =>
                    (window.location.href = "/user/dashboard/rooms/create")
                  }
                  className="mt-6 bg-primary hover:bg-primary/90 cursor-pointer"
                >
                  List a New Room
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Room Details Drawer - Only render when open */}
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
