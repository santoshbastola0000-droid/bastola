"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Room } from "@/types/room.types";
import { RoomDetailsContent } from "./RoomDetailsContent";

interface RoomDetailsDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
}: RoomDetailsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!room) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Room Details
            </DialogTitle>
            <DialogDescription>
              View complete information about this room
            </DialogDescription>
          </DialogHeader>
          <RoomDetailsContent room={room} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Room Details</DrawerTitle>
          <DrawerDescription>
            View complete information about this room
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto p-4">
          <RoomDetailsContent room={room} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
