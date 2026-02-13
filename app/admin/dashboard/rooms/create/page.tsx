"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Plus,
  Clock,
  Droplets,
  Users,
  Bath,
  Home,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Save,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { RoomCategory } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { useCreateRoomMutation } from "@/http/mutations/room.mutation";

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import("@/components/admin/rooms/MapPicker"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-[600px] w-full bg-muted rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.nativeEnum(RoomCategory),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  amenities: z.array(z.string()),
  bathroomCapacity: z.coerce.number().min(1).max(10),
  floorNumber: z.coerce.number().min(0),
  ownerLivesInHouse: z.boolean().default(false),
  totalHouseCapacity: z.coerce.number().min(1),
  allowsWomen: z.boolean().default(true),
  roomCapacity: z.coerce.number().min(1),
  roomArea: z.coerce.number().min(1),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactWhatsapp: z.string().optional(),
  waterSupplyTimings: z.object({
    morning: z.string(),
    evening: z.string(),
    notes: z.string().optional(),
  }),
  location: z.object({
    name: z.string(),
    formattedAddress: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }),
});

const amenitiesList = [
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "ac", label: "AC", icon: "❄️" },
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "tv", label: "TV", icon: "📺" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "laundry", label: "Laundry", icon: "🧺" },
  { id: "hot-water", label: "Hot Water", icon: "🚿" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "furnished", label: "Furnished", icon: "🛋️" },
  { id: "balcony", label: "Balcony", icon: "🏞️" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "pool", label: "Swimming Pool", icon: "🏊" },
];

const timeSlots = [
  "05:00-07:00",
  "06:00-08:00",
  "07:00-09:00",
  "08:00-10:00",
  "16:00-18:00",
  "17:00-19:00",
  "18:00-20:00",
  "19:00-21:00",
];

export default function CreateRoomPage() {
  const router = useRouter();
  const createRoomMutation = useCreateRoomMutation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "wifi",
    "ac",
    "parking",
  ]);
  const [activeTab, setActiveTab] = useState("basic");
  const locationSet = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: RoomCategory.STUDIO,
      price: 500,
      address: "",
      amenities: selectedAmenities,
      bathroomCapacity: 1,
      floorNumber: 0,
      ownerLivesInHouse: false,
      totalHouseCapacity: 4,
      allowsWomen: true,
      roomCapacity: 2,
      roomArea: 30,
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      contactWhatsapp: "",
      waterSupplyTimings: {
        morning: "06:00-08:00",
        evening: "17:00-19:00",
        notes: "",
      },
      location: {
        name: "",
        formattedAddress: "",
        latitude: 27.7172,
        longitude: 85.324,
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },
    },
  });

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId],
    );
  };

  const handleLocationSelect = (location: any) => {
    if (locationSet.current) return;
    locationSet.current = true;

    form.setValue("location", {
      name:
        location.name ||
        location.formattedAddress?.split(",")[0] ||
        "Selected Location",
      formattedAddress: location.formattedAddress,
      latitude: location.lat,
      longitude: location.lng,
      city: location.city,
      state: location.state,
      country: location.country,
      postalCode: location.postalCode,
    });

    if (location.formattedAddress) {
      form.setValue("address", location.formattedAddress);
    }

    if (location.city) {
      form.setValue("location.city", location.city);
    }
    if (location.country) {
      form.setValue("location.country", location.country);
    }

    toast.success("Location selected successfully!", {
      description: location.formattedAddress || "Location has been set",
    });

    setActiveTab("details");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    values.amenities = selectedAmenities;

    createRoomMutation.mutate({
      data: values,
      onSuccess: () => {
        router.push("/admin/dashboard/rooms");
      },
    });
  };

  const isValidLocation = form.watch("location.latitude") !== 27.7172;

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href="/admin/dashboard/rooms"
              className="hover:text-primary transition-colors"
            >
              Rooms
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create Room</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Create New Room
            </span>
          </h1>
          <p className="text-muted-foreground">
            Add a new room listing to the platform. All fields marked with * are
            required.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="hidden sm:flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 w-full h-auto p-1 bg-muted/50">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Location
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="amenities"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Amenities
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Contact
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic details about the room
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Modern Studio with City View"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a catchy title that describes the room
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the room in detail..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include details about the room, neighborhood, and
                          nearby amenities
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(RoomCategory).map((category) => (
                                <SelectItem
                                  key={category}
                                  value={category}
                                  className="capitalize"
                                >
                                  {category.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Price ($) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab with Map */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location & Map
                  </CardTitle>
                  <CardDescription>
                    Set the exact location of the room on the map
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isValidLocation && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please select a location on the map to continue. This is
                        required for listing your room.
                      </AlertDescription>
                    </Alert>
                  )}

                  <MapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      form.watch("location.latitude") !== 27.7172
                        ? {
                            lat: form.watch("location.latitude"),
                            lng: form.watch("location.longitude"),
                          }
                        : null
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <FormField
                      control={form.control}
                      name="location.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Downtown Apartment"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                  <CardDescription>
                    Specify the capacity and facilities of the room
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="roomCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Capacity *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>Number of people</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathroomCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathroom Capacity *</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} {num === 1 ? "person" : "people"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="floorNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor Number *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>0 for ground floor</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roomArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Area (m²) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="0.1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalHouseCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total House Capacity *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Water Supply Timings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="waterSupplyTimings.morning"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Morning Timing *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="waterSupplyTimings.evening"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Evening Timing *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
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
                      name="waterSupplyTimings.notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Alternate days, Tanker water available"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Rules & Restrictions</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="allowsWomen"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Women Allowed
                              </FormLabel>
                              <FormDescription>
                                Allow women to stay in this room
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerLivesInHouse"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Owner Lives in House
                              </FormLabel>
                              <FormDescription>
                                Does the owner live in the same house?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Amenities Tab */}
            <TabsContent value="amenities">
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                  <CardDescription>
                    Select all amenities available in the room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenitiesList.map((amenity) => (
                      <motion.div
                        key={amenity.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="button"
                          variant={
                            selectedAmenities.includes(amenity.id)
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "w-full h-auto py-3 flex flex-col items-center gap-2",
                            selectedAmenities.includes(amenity.id) &&
                              "bg-primary hover:bg-primary/90",
                          )}
                          onClick={() => toggleAmenity(amenity.id)}
                        >
                          <span className="text-2xl">{amenity.icon}</span>
                          <span className="text-xs">{amenity.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Provide contact details for enquiries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactWhatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createRoomMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-w-[140px]"
                disabled={createRoomMutation.isPending || !isValidLocation}
              >
                {createRoomMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
