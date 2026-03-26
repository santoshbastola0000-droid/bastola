"use client";

import { useState, useEffect } from "react";
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
  Home,
  Bed,
  Users,
  Ruler,
  Droplets,
  User,
  Phone,
  CheckCircle2,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Utensils,
  Shield,
  Sun,
  Moon,
  Instagram,
  Clock,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoomCategory } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { roomService } from "@/http/services/room.service";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import MapPicker from "@/components/admin/rooms/MapPicker";

// ─── Constants ───────────────────────────────────────────────────────────────

const amenitiesList = [
  { id: "wifi", label: "WiFi", icon: Wifi, description: "High-speed internet" },
  { id: "ac", label: "AC", icon: Snowflake, description: "Air conditioning" },
  {
    id: "parking",
    label: "Parking",
    icon: Car,
    description: "Vehicle parking",
  },
  { id: "tv", label: "TV", icon: Tv, description: "Cable TV" },
  {
    id: "modular-kitchen",
    label: "Modular Kitchen",
    icon: Utensils,
    description: "Modern modular kitchen",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: Utensils,
    description: "Shared kitchen",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "24/7 security",
  },
  { id: "water", label: "पानी", icon: Droplets, description: "पानी सुविधा" },
  {
    id: "furnished",
    label: "Furnished",
    icon: Home,
    description: "Fully furnished",
  },
];

const WATER_SUPPLY_OPTIONS = [
  { value: "24-hour", label: "२४ घण्टा पानी आउँछ" },
  { value: "morning-only", label: "बिहान मात्र" },
  { value: "evening-only", label: "साँझ मात्र" },
  { value: "morning-evening", label: "बिहान र साँझ दुवै" },
  { value: "alternate-days", label: "एक दिन छाडी" },
  { value: "tanker", label: "ट्याङ्कर पानी" },
  { value: "custom", label: "Other (specify)" },
];

const morningSlots = [
  "५:०० - ७:०० बिहान",
  "६:०० - ८:०० बिहान",
  "७:०० - ९:०० बिहान",
  "८:०० - १०:०० बिहान",
];
const eveningSlots = [
  "४:०० - ६:०० साँझ",
  "५:०० - ७:०० साँझ",
  "६:०० - ८:०० साँझ",
  "७:०० - ९:०० (राति)",
];
const morningSlotValues = [
  "05:00-07:00",
  "06:00-08:00",
  "07:00-09:00",
  "08:00-10:00",
];
const eveningSlotValues = [
  "16:00-18:00",
  "17:00-19:00",
  "18:00-20:00",
  "19:00-21:00",
];

const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.324;

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

// Helper function to extract the first meaningful location name from full address
const extractLocationName = (formattedAddress: string): string => {
  if (!formattedAddress) return "";

  const patterns = [
    /^([^,]+(?:चोक|चोक्|टोल|गाउँ|बजार|मार्ग|रोड|Road|Chowk))/i,
    /^([^,]+)/,
  ];

  for (const pattern of patterns) {
    const match = formattedAddress.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return formattedAddress.split(",")[0]?.trim() || "";
};

// Water supply helpers
const buildWaterTimings = (
  type: string,
  morning: string,
  evening: string,
  customNote: string,
): { morning: string; evening: string; notes: string } => {
  switch (type) {
    case "24-hour":
      return { morning: "", evening: "", notes: "TYPE:24-hour" };
    case "morning-only":
      return { morning, evening: "", notes: "TYPE:morning-only" };
    case "evening-only":
      return { morning: "", evening, notes: "TYPE:evening-only" };
    case "morning-evening":
      return { morning, evening, notes: "TYPE:morning-evening" };
    case "alternate-days":
      return { morning: "", evening: "", notes: "TYPE:alternate-days" };
    case "tanker":
      return { morning: "", evening: "", notes: "TYPE:tanker" };
    case "custom":
      return { morning: "", evening: "", notes: customNote };
    default:
      return { morning, evening, notes: "" };
  }
};

const detectWaterType = (timings?: {
  morning?: string;
  evening?: string;
  notes?: string;
}): string => {
  if (!timings) return "morning-evening";
  const note = timings.notes || "";
  if (note.startsWith("TYPE:")) return note.replace("TYPE:", "");
  if (timings.morning === "00:00-24:00") return "24-hour";
  if (note.includes("ट्याङ्कर")) return "tanker";
  if (note.includes("एक दिन छाडी")) return "alternate-days";
  if (timings.morning && !timings.evening) return "morning-only";
  if (!timings.morning && timings.evening) return "evening-only";
  return "morning-evening";
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const { user } = useUserRole();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const [customWaterNote, setCustomWaterNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomService.getRoomById(id),
    enabled: !!id,
  });

  const room = data?.data;

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      category: RoomCategory.APARTMENT, // Default to APARTMENT
      price: 5000,
      address: "",
      amenities: [],
      bathroomCapacity: 1,
      floorNumber: 0,
      ownerLivesInHouse: false,
      totalHouseCapacity: 4,
      rentedRoomsCount: 0,
      currentOccupants: 0,
      allowsWomen: true,
      roomCapacity: 2,
      roomArea: 30,
      contactPhone: "",
      contactPerson: "",
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
    mode: "onChange",
  });

  // Pre-fill when room loads
  useEffect(() => {
    if (!room) return;

    console.log("Room data loaded:", room);
    console.log("Room category from API:", room.category);
    console.log("Available categories:", Object.values(RoomCategory));

    const detectedType = detectWaterType(room.waterSupplyTimings);
    setWaterSupplyType(detectedType);

    if (detectedType === "custom") {
      setCustomWaterNote(room.waterSupplyTimings?.notes || "");
    }

    // Validate and set category - ensure it's a valid enum value
    let validCategory = room.category;
    const isValidCategory = Object.values(RoomCategory).includes(
      room.category as RoomCategory,
    );

    if (!isValidCategory || !room.category) {
      console.warn(
        "Invalid or empty category:",
        room.category,
        "defaulting to APARTMENT",
      );
      validCategory = RoomCategory.APARTMENT;
    }

    // Reset form with all values
    form.reset({
      title: room.title || "",
      description: room.description || "",
      category: validCategory,
      price: room.price || 5000,
      address: room.address || "",
      amenities: room.amenities || [],
      bathroomCapacity: room.bathroomCapacity || 1,
      floorNumber: room.floorNumber ?? 0,
      ownerLivesInHouse: room.ownerLivesInHouse || false,
      totalHouseCapacity: room.totalHouseCapacity || 4,
      rentedRoomsCount: room.rentedRoomsCount || 0,
      currentOccupants: room.currentOccupants || 0,
      allowsWomen: room.allowsWomen ?? true,
      roomCapacity: room.roomCapacity || 2,
      roomArea: room.roomArea || 30,
      contactPhone: room.contactPhone || "",
      contactPerson: room.contactPerson || "",
      tiktokUrl: room.tiktokUrl || "",
      waterSupplyTimings: {
        morning: room.waterSupplyTimings?.morning || "06:00-08:00",
        evening: room.waterSupplyTimings?.evening || "17:00-19:00",
        notes: room.waterSupplyTimings?.notes || "",
      },
      location: {
        name: room.location?.name || "",
        formattedAddress: room.location?.formattedAddress || "",
        latitude: room.location?.latitude
          ? Number(room.location.latitude)
          : DEFAULT_LAT,
        longitude: room.location?.longitude
          ? Number(room.location.longitude)
          : DEFAULT_LNG,
        city: room.location?.city || "",
        state: room.location?.state || "",
        country: room.location?.country || "",
        postalCode: room.location?.postalCode || "",
      },
    });

    if (room.amenities) setSelectedAmenities(room.amenities);

    // Set form as ready after a short delay to ensure all values are set
    setTimeout(() => {
      setIsFormReady(true);
    }, 100);
  }, [room, form]);

  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;
  const formattedAddress = form.watch("location.formattedAddress");
  const currentCategory = form.watch("category");

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", next, { shouldValidate: true });
      return next;
    });
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    name?: string;
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => {
    const extractedName = location.formattedAddress
      ? extractLocationName(location.formattedAddress)
      : location.name || "Selected Location";

    form.setValue("location.latitude", location.lat);
    form.setValue("location.longitude", location.lng);
    form.setValue("location.name", extractedName);
    form.setValue("location.formattedAddress", location.formattedAddress || "");
    form.setValue("location.city", location.city || "");
    form.setValue("location.state", location.state || "");
    form.setValue("location.country", location.country || "");
    form.setValue("location.postalCode", location.postalCode || "");
    if (location.formattedAddress)
      form.setValue("address", location.formattedAddress);
    form.trigger("location");
    toast.success("📍 Location updated!");
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    setIsSubmitting(true);
    values.amenities = selectedAmenities;

    const waterTimings = buildWaterTimings(
      waterSupplyType,
      values.waterSupplyTimings.morning || "06:00-08:00",
      values.waterSupplyTimings.evening || "17:00-19:00",
      waterSupplyType === "custom" ? customWaterNote : "",
    );

    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      price: values.price,
      address: values.address,
      amenities: selectedAmenities,
      bathroomCapacity: values.bathroomCapacity,
      floorNumber: values.floorNumber,
      ownerLivesInHouse: values.ownerLivesInHouse,
      totalHouseCapacity: values.totalHouseCapacity,
      rentedRoomsCount: values.rentedRoomsCount,
      currentOccupants: values.currentOccupants,
      waterSupplyTimings: waterTimings,
      allowsWomen: values.allowsWomen,
      roomCapacity: values.roomCapacity,
      roomArea: values.roomArea,
      contactPerson: values.contactPerson,
      contactPhone: values.contactPhone,
      location: values.location,
      ...(isAdmin && values.tiktokUrl ? { tiktokUrl: values.tiktokUrl } : {}),
    };

    const loadingToast = toast.loading("Saving changes...");

    try {
      await roomService.updateRoom(id, payload);
      toast.dismiss(loadingToast);
      toast.success("🎉 Room updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      router.push("/admin/dashboard/rooms");
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Update failed", {
        description: err?.response?.data?.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isFormReady) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Room not found</AlertTitle>
          <AlertDescription>Could not load this room.</AlertDescription>
        </Alert>
        <Button
          className="mt-4 cursor-pointer"
          variant="outline"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const tabs = [
    {
      value: "basic",
      label: "Basic Info",
      icon: Home,
      tooltip: "आधारभूत जानकारी",
    },
    {
      value: "location",
      label: "Location",
      icon: MapPin,
      tooltip: "स्थान र नक्सा",
    },
    { value: "details", label: "Details", icon: Bed, tooltip: "कोठाको विवरण" },
    {
      value: "amenities",
      label: "Amenities",
      icon: Wifi,
      tooltip: "सुविधाहरू",
    },
    {
      value: "contact",
      label: "Contact",
      icon: User,
      tooltip: "सम्पर्क जानकारी",
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
                <Link
                  href={`/admin/dashboard/rooms/${id}`}
                  className="hover:text-primary transition-colors cursor-pointer truncate max-w-[150px]"
                >
                  {room.title}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">Edit</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Edit Room
                </span>
              </h1>
            </div>
            <Button variant="outline" asChild className="cursor-pointer">
              <Link href={`/admin/dashboard/rooms/${id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>

          {/* Existing images strip */}
          {room.images && room.images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {room.images.map((img, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/20"
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-image.jpg";
                    }}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground self-center flex-shrink-0 ml-2">
                {room.images.length} photos (photo editing not supported)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TooltipProvider>
                <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full h-auto p-1 bg-muted/50 gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Tooltip key={tab.value}>
                        <TooltipTrigger asChild>
                          <TabsTrigger
                            value={tab.value}
                            className="data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer py-2 px-1 md:px-3"
                          >
                            <Icon className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline text-xs">
                              {tab.label}
                            </span>
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{tab.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TabsList>
              </TooltipProvider>

              {/* BASIC TAB */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Update the basic details of your room.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Room Title <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Modern Room with AC & WiFi"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Description <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="कोठाको बारेमा लेख्नुहोस्। छिमेक, नजिकैका सुविधाहरू, र कोठाको विशेषता उल्लेख गर्नुहोस्..."
                              className="min-h-[120px]"
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
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Room Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                console.log("Category changed to:", value);
                                field.onChange(value);
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select room type">
                                    {field.value && (
                                      <span className="capitalize">
                                        {field.value.replace(/_/g, " ")}
                                      </span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(RoomCategory).map((cat) => (
                                  <SelectItem
                                    key={cat}
                                    value={cat}
                                    className="cursor-pointer capitalize"
                                  >
                                    {cat.replace(/_/g, " ")}
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
                            <FormLabel>
                              मासिक भाडा (रु.){" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                                  रु.
                                </span>
                                <Input
                                  type="number"
                                  placeholder="5000"
                                  className="pl-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              नेपाली रुपैयाँमा मासिक भाडा लेख्नुहोस्।
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LOCATION TAB - With Editable Full Address */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Map
                    </CardTitle>
                    <CardDescription>
                      Click on the map to update the room location or edit the
                      address manually.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <MapPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        isValidLocation
                          ? { lat: currentLat, lng: currentLng }
                          : null
                      }
                    />

                    {/* Editable Full Address Field */}
                    <FormField
                      control={form.control}
                      name="location.formattedAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Pencil className="h-3 w-3" />
                            Full Address / पूरा ठेगाना
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="नक्सामा स्थान चयन गरेपछि स्वत: भरिनेछ वा म्यानुअल रूपमा लेख्नुहोस् | Auto-filled from map or edit manually"
                              className="min-h-[80px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            तपाईं यो ठेगाना सम्पादन गर्न सक्नुहुन्छ। You can
                            edit this address manually.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name / स्थानको नाम</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Lazimpat Apartment, Srijana Chowk"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              प्रमुख स्थानको नाम (जस्तै: श्रीजना चोक, लाजिम्पाट)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City / शहर</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Kathmandu, Pokhara"
                                {...field}
                              />
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
                              <Input placeholder="e.g. Bagmati" {...field} />
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
                              <Input placeholder="Nepal" {...field} />
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
                              <Input placeholder="e.g. 44600" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isValidLocation && (
                      <div className="flex flex-wrap gap-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex-1 min-w-[100px]">
                          <p className="text-xs text-muted-foreground">
                            Latitude
                          </p>
                          <p className="font-mono text-sm">
                            {currentLat.toFixed(6)}
                          </p>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <p className="text-xs text-muted-foreground">
                            Longitude
                          </p>
                          <p className="font-mono text-sm">
                            {currentLng.toFixed(6)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 self-center"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Location Set
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DETAILS TAB */}
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-primary" />
                      Room Details & Specifications
                    </CardTitle>
                    <CardDescription>
                      Fill in the details about your room.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="roomCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Capacity / कोठा क्षमता</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="1"
                                  className="pl-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              How many people can stay
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bathroomCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathroom Capacity / बाथरुम</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(parseInt(v))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem
                                    key={n}
                                    value={n.toString()}
                                    className="cursor-pointer"
                                  >
                                    {n} {n === 1 ? "person" : "people"} / जना
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
                            <FormLabel>Floor Number / तला नं.</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  className="pl-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Ground floor = 0 / भुइँ तला = ०
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roomArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Area (m²) / क्षेत्रफल</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.1"
                                  className="pl-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </div>
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
                            <FormLabel>
                              Total House Capacity / घरको क्षमता
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentOccupants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Current Occupants / हाल बस्ने संख्या
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Water Supply */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-primary" />
                        पानी आपूर्ति (Water Supply)
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {WATER_SUPPLY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setWaterSupplyType(option.value)}
                            className={cn(
                              "p-3 text-xs rounded-lg border-2 text-left transition-all cursor-pointer font-medium",
                              waterSupplyType === option.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50 text-foreground",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {waterSupplyType === "24-hour" && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">
                            24-hour water available
                          </AlertTitle>
                          <AlertDescription className="text-green-700">
                            यस कोठामा दिनभर पानी आउँछ।
                          </AlertDescription>
                        </Alert>
                      )}

                      {(waterSupplyType === "morning-only" ||
                        waterSupplyType === "morning-evening") && (
                        <FormField
                          control={form.control}
                          name="waterSupplyTimings.morning"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <Sun className="h-3 w-3 text-yellow-500" />
                                बिहान (Morning) Time
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {morningSlots.map((slot, i) => (
                                    <SelectItem
                                      key={morningSlotValues[i]}
                                      value={morningSlotValues[i]}
                                      className="cursor-pointer"
                                    >
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {(waterSupplyType === "evening-only" ||
                        waterSupplyType === "morning-evening") && (
                        <FormField
                          control={form.control}
                          name="waterSupplyTimings.evening"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <Moon className="h-3 w-3 text-blue-500" />
                                साँझ (Evening) Time
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {eveningSlots.map((slot, i) => (
                                    <SelectItem
                                      key={eveningSlotValues[i]}
                                      value={eveningSlotValues[i]}
                                      className="cursor-pointer"
                                    >
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {waterSupplyType === "custom" && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Additional Notes (optional)
                          </label>
                          <Input
                            value={customWaterNote}
                            onChange={(e) => setCustomWaterNote(e.target.value)}
                            placeholder="e.g. No water on Saturdays, tanker available..."
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Rules */}
                    <div className="space-y-4">
                      <h3 className="font-medium">
                        Rules & Restrictions / नियमहरू
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="allowsWomen"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  महिला भाडाटारु अनुमति छ?
                                </FormLabel>
                                <FormDescription>
                                  Allow women tenants
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
                                  घरधनी घरमा बस्छन्?
                                </FormLabel>
                                <FormDescription>
                                  Does the owner live in the same building?
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

              {/* AMENITIES TAB */}
              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-primary" />
                      Amenities / सुविधाहरू
                    </CardTitle>
                    <CardDescription>
                      Select all amenities available in your room.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {amenitiesList.map((amenity) => {
                        const Icon = amenity.icon;
                        const isSelected = selectedAmenities.includes(
                          amenity.id,
                        );
                        return (
                          <motion.div
                            key={amenity.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "w-full h-auto py-4 px-3 flex flex-col items-center gap-2 cursor-pointer relative",
                                isSelected &&
                                  "bg-primary hover:bg-primary/90 text-white",
                              )}
                              onClick={() => toggleAmenity(amenity.id)}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs font-medium text-center leading-tight">
                                {amenity.label}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-white" />
                              )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-1">
                              {amenity.description}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedAmenities.length} amenities
                      </p>
                      {selectedAmenities.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Good to go!
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONTACT TAB */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Contact Information / सम्पर्क जानकारी
                    </CardTitle>
                    <CardDescription>
                      How can interested tenants reach you?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Alert className="border-primary/30 bg-primary/5">
                      <User className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary">
                        घरधनीको सम्पर्क जानकारी भर्नुहोस्
                      </AlertTitle>
                      <AlertDescription className="text-foreground/80 space-y-2">
                        <p>
                          कृपया घरधनीको नाम र फोन नम्बर भर्नुहोस्। भाडामा बस्न
                          चाहनेहरूले यसै मार्फत सम्पर्क गर्नेछन्।
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Please provide the owner's name and phone number.
                          Interested tenants will contact you using this
                          information.
                        </p>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Owner Name / घरधनीको नाम
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Ram Prasad Sharma"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              घरधनी वा सम्पर्क व्यक्तिको पुरा नाम | Full name of
                              the owner or contact person
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Owner Phone Number / घरधनीको फोन नम्बर
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="+977 98XXXXXXXX"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              सम्पर्कको लागि घरधनीको फोन नम्बर | Owner's contact
                              number for inquiries
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isAdmin && (
                      <>
                        <Separator />
                        <FormField
                          control={form.control}
                          name="tiktokUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Instagram className="h-4 w-4" />
                                TikTok Profile URL (Admin only)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://tiktok.com/@username"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Share your TikTok to showcase the property
                                (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4 md:-mx-6 lg:-mx-8">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">
                    <span className="text-primary font-bold mr-1">✏️</span>
                    Editing: {room.title}
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {room.approvalStatus}
                  </Badge>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="cursor-pointer flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 cursor-pointer flex-1 sm:flex-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
