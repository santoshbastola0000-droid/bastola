"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Save,
  Instagram,
  Image as ImageIcon,
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
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";

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

const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.324;

export default function CreateRoomPage() {
  const router = useRouter();
  const createRoomMutation = useCreateRoomMutation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "wifi",
    "ac",
    "parking",
  ]);
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      category: RoomCategory.APARTMENT,
      price: 500,
      address: "",
      amenities: selectedAmenities,
      bathroomCapacity: 1,
      floorNumber: 0,
      ownerLivesInHouse: false,
      totalHouseCapacity: 4,
      rentedRoomsCount: 0,
      currentOccupants: 0,
      allowsWomen: true,
      roomCapacity: 2,
      roomArea: 30,
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      contactWhatsapp: "",
      tiktokUrl: "",
      waterSupplyTimings: {
        morning: "06:00-08:00",
        evening: "17:00-19:00",
        notes: "",
      },
      location: {
        name: "",
        formattedAddress: "",
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },
    },
  });

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const newAmenities = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", newAmenities);
      return newAmenities;
    });
  };

  // ── FIXED: No auto tab navigation, properly populate all address fields ──
  const handleLocationSelect = (location: any) => {
    // Update all location fields in the form
    form.setValue("location.latitude", location.lat);
    form.setValue("location.longitude", location.lng);
    form.setValue("location.name", location.name || "Selected Location");
    form.setValue("location.formattedAddress", location.formattedAddress || "");
    form.setValue("location.city", location.city || "");
    form.setValue("location.state", location.state || "");
    form.setValue("location.country", location.country || "");
    form.setValue("location.postalCode", location.postalCode || "");

    // Also update the top-level address field
    if (location.formattedAddress) {
      form.setValue("address", location.formattedAddress);
    }

    // Trigger validation so the form knows the fields are filled
    form.trigger("location");

    toast.success(
      "Location selected! You can review the address fields below.",
    );
    // ✅ REMOVED: setActiveTab("details") — no more unwanted tab switch
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} image(s) exceed 5MB limit`);
    }

    if (images.length + validFiles.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      setActiveTab("images");
      return;
    }

    values.amenities = selectedAmenities;

    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "location" || key === "waterSupplyTimings") {
        formData.append(key, JSON.stringify(value));
      } else if (key !== "amenities" && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    formData.append("amenities", JSON.stringify(values.amenities));

    images.forEach((image) => {
      formData.append("images", image);
    });

    createRoomMutation.mutate({
      data: formData,
      onSuccess: () => {
        router.push("/admin/dashboard/rooms");
      },
    });
  };

  // A location is considered "valid" (user has selected one) if it differs from defaults
  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/dashboard"
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href="/admin/dashboard/rooms"
              className="hover:text-primary transition-colors cursor-pointer"
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
          className="hidden sm:flex items-center gap-2 cursor-pointer"
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
            <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full h-auto p-1 bg-muted/50">
              {[
                { value: "basic", label: "Basic Info" },
                { value: "location", label: "Location" },
                { value: "details", label: "Details" },
                { value: "amenities", label: "Amenities" },
                { value: "images", label: "Images" },
                { value: "contact", label: "Contact" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
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
                    Click on the map or use "Use current location" to set the
                    room's location. The address fields below will auto-fill.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isValidLocation && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please select a location on the map. Click anywhere on
                        the map or use the "Use current location" button.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Map */}
                  <MapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      isValidLocation
                        ? { lat: currentLat, lng: currentLng }
                        : null
                    }
                  />

                  {/* Address fields — auto-populated from map, but still editable */}
                  <div className="space-y-4 pt-2">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Address Details (auto-filled from map selection)
                    </h3>

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
                      name="location.formattedAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full address will appear here after selecting on map"
                              className="min-h-[70px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Kathmandu" {...field} />
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
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Bagmati" {...field} />
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
                              <Input placeholder="e.g., Nepal" {...field} />
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
                              <Input placeholder="e.g., 44600" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Show coordinates when a location is selected */}
                    {isValidLocation && (
                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="location.latitude"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input
                                  readOnly
                                  className="bg-muted text-muted-foreground"
                                  value={field.value.toFixed(6)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location.longitude"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Longitude</FormLabel>
                              <FormControl>
                                <Input
                                  readOnly
                                  className="bg-muted text-muted-foreground"
                                  value={field.value.toFixed(6)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
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
                            "w-full h-auto py-3 flex flex-col items-center gap-2 cursor-pointer",
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

            {/* Images Tab */}
            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Room Images
                  </CardTitle>
                  <CardDescription>
                    Upload photos of the room (max 10 images, 5MB each)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-4">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer"
                        variant="outline"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Select Images
                      </Button>

                      <p className="text-sm text-muted-foreground flex items-center">
                        {images.length}/10 images selected
                      </p>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Room ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {images.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No images selected. Click the button above to upload.
                        </p>
                      </div>
                    )}
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

                  <Separator />

                  <FormField
                    control={form.control}
                    name="tiktokUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          TikTok URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://tiktok.com/@username"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Link to your TikTok profile
                        </FormDescription>
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
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-w-[140px] cursor-pointer"
                disabled={
                  createRoomMutation.isPending ||
                  !isValidLocation ||
                  images.length === 0
                }
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
