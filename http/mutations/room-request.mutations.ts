import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roomRequestService } from "@/http/services/room-request.service";
import { ROOM_REQUEST_QUERY_KEYS } from "@/hooks/room-requests/use-room-request-queries";
import type {
  CreateRoomRequestDTO,
  RoomRequestStatus,
} from "@/types/room-request.types";

const ROOM_REQUEST_STATUS_LABELS: Record<RoomRequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

export const useCreateRoomRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [ROOM_REQUEST_QUERY_KEYS.CREATE],
    mutationFn: async (payload: CreateRoomRequestDTO) => {
      return roomRequestService.createRequest(payload);
    },
    onSuccess: () => {
      toast.success("Request sent", {
        description: "The owner can now review your request.",
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_SENT],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_RECEIVED],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to send request", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    },
  });
};

export const useUpdateRoomRequestStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [ROOM_REQUEST_QUERY_KEYS.UPDATE_STATUS],
    mutationFn: async ({ id, status }: { id: string; status: RoomRequestStatus }) => {
      return roomRequestService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      toast.success("Request updated", {
        description: `Status changed to ${ROOM_REQUEST_STATUS_LABELS[variables.status]}.`,
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_SENT],
      });
      queryClient.invalidateQueries({
        queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_RECEIVED],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update request", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    },
  });
};
