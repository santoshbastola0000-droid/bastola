// src/http/mutations/room.mutation.ts
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roomService } from "@/http/services/room.service";
import { ROOM_QUERY_KEYS } from "@/hooks/rooms/use-room-queries";
import { STATUS_CODES } from "@/lib/constants/app.constants";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";
import { RoomStatus } from "@/types/room.types";
import { useUserRole } from "@/stores/user-store";
import { UserRole } from "@/types/user.types";

// Toast messages
export const CreateRoom = {
  success: {
    title: "Room Created Successfully",
    description: "Your room has been created and is pending approval.",
  },
  error: {
    title: "Failed to Create Room",
    description: "An error occurred while creating the room. Please try again.",
  },
  alreadyExists: {
    title: "Room Already Exists",
    description: "A room with this title already exists.",
  },
};

export const UpdateRoom = {
  success: {
    title: "Room Updated Successfully",
    description: "Your room has been updated successfully.",
  },
  error: {
    title: "Failed to Update Room",
    description: "An error occurred while updating the room. Please try again.",
  },
  alreadyExists: {
    title: "Room Already Exists",
    description: "A room with this title already exists.",
  },
};

export const DeleteRoom = {
  success: {
    title: "Room Deleted Successfully",
    description: "The room has been deleted successfully.",
  },
  error: {
    title: "Failed to Delete Room",
    description: "An error occurred while deleting the room. Please try again.",
  },
};

export const UpdateApprovalStatus = {
  success: {
    title: "Approval Status Updated",
    description: "Room approval status has been updated successfully.",
  },
  error: {
    title: "Failed to Update Approval Status",
    description: "An error occurred while updating the approval status.",
  },
};

export const UpdateListingStatus = {
  success: {
    title: "Listing Status Updated",
    description: "Room listing status has been updated successfully.",
  },
  error: {
    title: "Failed to Update Listing Status",
    description: "An error occurred while updating the listing status.",
  },
};

interface RoomData {
  id?: string;
  data: any;
  onSuccess?: () => void;
}

/**
 * Mutation for creating a room
 */
export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUserRole();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.CREATE_ROOM],
    mutationFn: async (data: RoomData) => {
      const response = await roomService.createRoom(data.data);
      return response;
    },
    onSuccess: (_, variables) => {
      variables.onSuccess?.();
      if (user?.role !== UserRole.ADMIN) {
        toast.success(CreateRoom.success.title, {
          description: CreateRoom.success.description,
          style: { background: SUCCESSTOAST, color: "#fff" },
        });
      }
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
  });

  return mutation;
};

/**
 * Mutation for updating a room
 */
export const useUpdateRoomMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.UPDATE_ROOM],
    mutationFn: async (data: RoomData) => {
      const response = await roomService.updateRoom(data.id!, data.data);
      return response;
    },
    onSuccess: (_, variables) => {
      variables.onSuccess?.();
      toast.success(UpdateRoom.success.title, {
        description: UpdateRoom.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
    onError: (error: AxiosError) => {
      if (error.status === STATUS_CODES.CONFLICT) {
        toast.error(UpdateRoom.alreadyExists.title, {
          description: UpdateRoom.alreadyExists.description,
          style: { background: FAILURETOAST, color: "#fff" },
        });
        return;
      }
      toast.error(UpdateRoom.error.title, {
        description: UpdateRoom.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  return mutation;
};

/**
 * Mutation for deleting a room
 */
export const useDeleteRoomMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.DELETE_ROOM],
    mutationFn: async (id: string) => {
      await roomService.deleteRoom(id);
    },
    onSuccess: () => {
      toast.success(DeleteRoom.success.title, {
        description: DeleteRoom.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
    onError: () => {
      toast.error(DeleteRoom.error.title, {
        description: DeleteRoom.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  return mutation;
};

/**
 * Mutation for updating approval status
 */
export const useUpdateApprovalStatusMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.UPDATE_APPROVAL_STATUS],
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: RoomStatus.APPROVED | RoomStatus.REJECTED;
      reason?: string;
    }) => {
      const response = await roomService.updateApprovalStatus(
        id,
        status,
        reason,
      );
      return response;
    },
    onSuccess: (_, variables) => {
      toast.success(UpdateApprovalStatus.success.title, {
        description: UpdateApprovalStatus.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
    onError: () => {
      toast.error(UpdateApprovalStatus.error.title, {
        description: UpdateApprovalStatus.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  return mutation;
};

/**
 * Mutation for updating listing status
 */
export const useUpdateListingStatusMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.UPDATE_LISTING_STATUS],
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: RoomStatus.AVAILABLE | RoomStatus.RENTED | RoomStatus.ARCHIVED;
    }) => {
      const response = await roomService.updateListingStatus(id, status);
      return response;
    },
    onSuccess: (_, variables) => {
      toast.success(UpdateListingStatus.success.title, {
        description: UpdateListingStatus.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
    onError: () => {
      toast.error(UpdateListingStatus.error.title, {
        description: UpdateListingStatus.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  return mutation;
};
