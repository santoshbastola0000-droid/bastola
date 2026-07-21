"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { AMENITIES_LIST } from "@/lib/constants/app.constants";
import { RoomCategory } from "@/types/room.types";
import { userPreferenceSchema, type UserPreferenceValues } from "@/schema/user-preference.schema";
import { useMyPreferenceQuery } from "@/hooks/use-user-preference-queries";
import { useUpsertUserPreferenceMutation } from "@/http/mutations/user-preference.mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const roomTypeOptions = Object.values(RoomCategory);

export function UserPreferenceForm() {
  const { data, isLoading } = useMyPreferenceQuery();
  const { mutate: savePreference, isPending } = useUpsertUserPreferenceMutation();

  const form = useForm<UserPreferenceValues>({
    resolver: zodResolver(userPreferenceSchema),
    defaultValues: {
      preferredCity: "",
      preferredArea: "",
      budget: null,
      roomType: null,
      facilities: [],
      instantAlertsEnabled: true,
    },
  });

  useEffect(() => {
    if (!data?.data) return;

    form.reset({
      preferredCity: data.data.preferredCity ?? "",
      preferredArea: data.data.preferredArea ?? "",
      budget: data.data.budget ?? null,
      roomType: data.data.roomType ?? null,
      facilities: data.data.facilities ?? [],
      instantAlertsEnabled: data.data.instantAlertsEnabled ?? true,
    });
  }, [data, form]);

  const onSubmit = (values: UserPreferenceValues) => {
    savePreference({
      preferredCity: values.preferredCity?.trim(),
      preferredArea: values.preferredArea?.trim(),
      budget: values.budget ?? null,
      roomType: values.roomType ?? null,
      facilities: values.facilities,
      instantAlertsEnabled: values.instantAlertsEnabled,
    });
  };

  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bell className="w-5 h-5 text-red-500" />
          Smart Alert Preferences
        </CardTitle>
        <CardDescription>
          Save your city, area, budget, room type, and facilities so RoomKhoj can notify you when a matching room appears.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your preferences...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred city</FormLabel>
                      <FormControl>
                        <Input placeholder="Pokhara" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Used for AI alert matching.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred area</FormLabel>
                      <FormControl>
                        <Input placeholder="Lakeside" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Optional neighborhood or locality.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly budget</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="15000"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const rawValue = event.target.value;
                            field.onChange(rawValue === "" ? null : Number(rawValue));
                          }}
                        />
                      </FormControl>
                      <FormDescription>We will compare new rooms against this budget ceiling.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room type</FormLabel>
                      <Select
                        value={field.value ?? "all"}
                        onValueChange={(value) => field.onChange(value === "all" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Any room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Any room type</SelectItem>
                          {roomTypeOptions.map((roomType) => (
                            <SelectItem key={roomType} value={roomType}>
                              {roomType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="facilities"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-3 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-red-500" />
                      <div>
                        <FormLabel>Preferred facilities</FormLabel>
                        <FormDescription>
                          Choose the amenities that matter most to you.
                        </FormDescription>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {AMENITIES_LIST.map((amenity) => {
                        const checked = field.value?.includes(amenity.id) ?? false;

                        return (
                          <label
                            key={amenity.id}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-red-300"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                if (nextChecked) {
                                  field.onChange([...(field.value ?? []), amenity.id]);
                                  return;
                                }

                                field.onChange(
                                  (field.value ?? []).filter((value) => value !== amenity.id),
                                );
                              }}
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-900">{amenity.label}</p>
                              <p className="text-xs text-muted-foreground">{amenity.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instantAlertsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div className="space-y-1">
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Instant match alerts
                      </FormLabel>
                      <FormDescription>
                        Notify me automatically when a room matches this saved preference.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" className="rounded-full bg-red-600 hover:bg-red-700" isLoading={isPending}>
                  Save alert preferences
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
