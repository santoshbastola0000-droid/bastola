"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CalendarClock, MessageCircle, SendHorizontal } from "lucide-react";
import { createRoomRequestSchema, type CreateRoomRequestValues } from "@/schema/room-request.schema";
import { createReportSchema, type CreateReportValues } from "@/schema/report.schema";
import { useCreateRoomRequestMutation } from "@/http/mutations/room-request.mutations";
import { useCreateReportMutation } from "@/http/mutations/report.mutations";
import { RoomRequestIntent } from "@/types/room-request.types";
import { ReportType } from "@/types/report.types";
import { useUserStore } from "@/stores/user-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const REQUEST_META: Record<RoomRequestIntent, { title: string; description: string }> = {
  [RoomRequestIntent.REQUEST_VISIT]: {
    title: "Request room visit",
    description: "Ask the owner for an on-site or virtual visit.",
  },
  [RoomRequestIntent.CONTACT_OWNER]: {
    title: "Contact owner",
    description: "Start a conversation directly with the owner from RoomKhoj.",
  },
  [RoomRequestIntent.BOOKING_INTEREST]: {
    title: "Send booking interest",
    description: "Let the owner know you want to reserve this room.",
  },
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.FAKE_ROOM]: "Fake room",
  [ReportType.WRONG_INFORMATION]: "Wrong information",
  [ReportType.FRAUD_OWNER]: "Fraud owner",
  [ReportType.SPAM]: "Spam",
};

const REQUEST_PLACEHOLDERS: Record<RoomRequestIntent, string> = {
  [RoomRequestIntent.REQUEST_VISIT]: "Hi, I would like to schedule a room visit for this listing.",
  [RoomRequestIntent.CONTACT_OWNER]: "Hi, I am interested in this listing and would like to talk with you.",
  [RoomRequestIntent.BOOKING_INTEREST]: "Hi, I am interested in booking this room. Please share the next steps.",
};

export function RoomActionCenter({
  roomId,
  ownerId,
  roomTitle,
  isAuthenticated,
  ownerPhone,
}: {
  roomId: string;
  ownerId: string;
  roomTitle: string;
  isAuthenticated: boolean;
  ownerPhone?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<RoomRequestIntent>(RoomRequestIntent.REQUEST_VISIT);
  const { mutate: createRequest, isPending: isCreatingRequest } = useCreateRoomRequestMutation();
  const { mutate: createReport, isPending: isCreatingReport } = useCreateReportMutation();

  const isOwnerView = useMemo(() => user?.id === ownerId, [ownerId, user?.id]);

  const requestForm = useForm<CreateRoomRequestValues>({
    resolver: zodResolver(createRoomRequestSchema),
    defaultValues: {
      roomId,
      ownerId,
      requestType,
      message: REQUEST_PLACEHOLDERS[requestType],
    },
  });

  const reportForm = useForm<CreateReportValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      targetId: roomId,
      type: ReportType.WRONG_INFORMATION,
      description: "",
    },
  });

  useEffect(() => {
    requestForm.setValue("roomId", roomId);
    requestForm.setValue("ownerId", ownerId);
  }, [ownerId, requestForm, roomId]);

  useEffect(() => {
    reportForm.setValue("targetId", roomId);
  }, [reportForm, roomId]);

  const ensureAuthenticated = () => {
    if (isAuthenticated) return true;

    toast.error("Login required", {
      description: "Please login to send a request or submit a safety report.",
    });
    router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    return false;
  };

  const openRequestDialog = (intent: RoomRequestIntent) => {
    if (!ensureAuthenticated()) return;

    setRequestType(intent);
    requestForm.reset({
      roomId,
      ownerId,
      requestType: intent,
      message: REQUEST_PLACEHOLDERS[intent],
    });
    setRequestDialogOpen(true);
  };

  const openReportDialog = () => {
    if (!ensureAuthenticated()) return;
    setReportDialogOpen(true);
  };

  const onSubmitRequest = (values: CreateRoomRequestValues) => {
    createRequest(values, {
      onSuccess: () => {
        setRequestDialogOpen(false);
      },
    });
  };

  const onSubmitReport = (values: CreateReportValues) => {
    createReport(values, {
      onSuccess: () => {
        reportForm.reset({
          targetId: roomId,
          type: ReportType.WRONG_INFORMATION,
          description: "",
        });
        setReportDialogOpen(false);
      },
    });
  };

  if (isOwnerView) {
    return null;
  }

  return (
    <>
      <Card className="rounded-2xl border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Action center</CardTitle>
          <CardDescription>
            Request a visit, contact the owner, send booking interest, or report a safety issue for <span className="font-medium text-slate-900">{roomTitle}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-2xl h-auto p-4"
              onClick={() => openRequestDialog(RoomRequestIntent.REQUEST_VISIT)}
            >
              <CalendarClock className="w-4 h-4 text-red-500" /> Request visit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-2xl h-auto p-4"
              onClick={() => openRequestDialog(RoomRequestIntent.CONTACT_OWNER)}
            >
              <MessageCircle className="w-4 h-4 text-red-500" /> Contact owner
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-2xl h-auto p-4"
              onClick={() => openRequestDialog(RoomRequestIntent.BOOKING_INTEREST)}
            >
              <SendHorizontal className="w-4 h-4 text-red-500" /> Booking interest
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-2xl h-auto p-4 border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={openReportDialog}
            >
              <AlertTriangle className="w-4 h-4" /> Report listing
            </Button>
          </div>
          {ownerPhone && (
            <p className="text-xs text-muted-foreground">
              Prefer direct chat?{" "}
              <Link
                href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in: ${roomTitle}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-green-600 hover:text-green-700"
              >
                Open WhatsApp
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{REQUEST_META[requestType].title}</DialogTitle>
            <DialogDescription>{REQUEST_META[requestType].description}</DialogDescription>
          </DialogHeader>
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(onSubmitRequest)} className="space-y-4">
              <FormField
                control={requestForm.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const nextValue = value as RoomRequestIntent;
                        const previousValue = requestForm.getValues("requestType");
                        const currentMessage = requestForm.getValues("message");

                        field.onChange(nextValue);
                        setRequestType(nextValue);

                        if (
                          !currentMessage.trim() ||
                          currentMessage === REQUEST_PLACEHOLDERS[previousValue]
                        ) {
                          requestForm.setValue("message", REQUEST_PLACEHOLDERS[nextValue], {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose request type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(REQUEST_META).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={requestForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" className="rounded-full bg-red-600 hover:bg-red-700" isLoading={isCreatingRequest}>
                  Send request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
            <DialogDescription>
              Help keep RoomKhoj safe by reporting fake rooms, spam, or wrong information.
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(onSubmitReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ReportType).map((value) => (
                          <SelectItem key={value} value={value}>
                            {REPORT_TYPE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Tell us what seems unsafe or suspicious..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" className="rounded-full bg-rose-600 hover:bg-rose-700" isLoading={isCreatingReport}>
                  Submit report
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
