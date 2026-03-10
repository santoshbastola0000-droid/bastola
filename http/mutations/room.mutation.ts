import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roomService } from "@/http/services/room.service";
import { ROOM_QUERY_KEYS } from "@/hooks/rooms/use-room-queries";
import { STATUS_CODES } from "@/lib/constants/app.constants";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";
import { RoomStatus } from "@/types/room.types";

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

export const UpdateRoomStatus = {
  success: {
    title: "Status Updated",
    description: "Room status has been updated successfully.",
  },
  error: {
    title: "Failed to Update Status",
    description: "An error occurred while updating the status.",
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

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.CREATE_ROOM],
    mutationFn: async (data: RoomData) => {
      const response = await roomService.createRoom(data.data);
      return response;
    },
    onSuccess: (_, variables) => {
      variables.onSuccess?.();
      toast.success(CreateRoom.success.title, {
        description: CreateRoom.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
      });
    },
    onError: (error: AxiosError) => {
      if (error.status === STATUS_CODES.CONFLICT) {
        toast.error(CreateRoom.alreadyExists.title, {
          description: CreateRoom.alreadyExists.description,
          style: { background: FAILURETOAST, color: "#fff" },
        });
        return;
      }
      toast.error(CreateRoom.error.title, {
        description: CreateRoom.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
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
 * Mutation for updating room status
 */
export const useUpdateRoomStatusMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [ROOM_QUERY_KEYS.UPDATE_ROOM_STATUS],
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: RoomStatus;
      reason?: string;
    }) => {
      const response = await roomService.updateRoomStatus(id, status, reason);
      return response;
    },
    onSuccess: (_, variables) => {
      toast.success(UpdateRoomStatus.success.title, {
        description: UpdateRoomStatus.success.description,
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOMS],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_QUERY_KEYS.GET_ROOM, variables.id],
      });
    },
    onError: () => {
      toast.error(UpdateRoomStatus.error.title, {
        description: UpdateRoomStatus.error.description,
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  return mutation;
};
