"use client";

import { useState, useRef, useEffect } from "react";
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
  Image as ImageIcon,
  Home,
  Bed,
  Users,
  Ruler,
  Droplets,
  User,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoomCategory } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { useCreateRoomMutation } from "@/http/mutations/room.mutation";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import MapPicker from "@/components/admin/rooms/MapPicker";

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

// Water supply options
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

// Internal slot values (English, stored in DB)
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

const calculateFormProgress = (
  formValues: CreateRoomFormValues,
  totalFields: number,
) => {
  const filledFields = Object.entries(formValues).filter(([key, value]) => {
    if (key === "amenities") return (value as string[])?.length > 0;
    if (key === "location") {
      const loc = value as CreateRoomFormValues["location"];
      return loc?.latitude !== DEFAULT_LAT || loc?.longitude !== DEFAULT_LNG;
    }
    if (key === "waterSupplyTimings") return true;
    return value !== undefined && value !== null && value !== "";
  }).length;
  return Math.min(100, Math.round((filledFields / totalFields) * 100));
};

export default function CreateRoomPage() {
  const router = useRouter();
  const createRoomMutation = useCreateRoomMutation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserRole();

  const isAdmin = user?.role === UserRole.ADMIN;

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      category: RoomCategory.APARTMENT,
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

  const formValues = form.watch();
  const formErrors = form.formState.errors;
  const totalFields = 25;
  const progress = calculateFormProgress(formValues, totalFields);

  useEffect(() => {
    const errors: Record<string, string> = {};
    Object.entries(formErrors).forEach(([key, error]) => {
      if ((error as { message?: string })?.message) {
        errors[key] = (error as { message: string }).message;
      }
    });
    setValidationErrors(errors);
  }, [formErrors]);

  // Sync water supply type to form notes
  useEffect(() => {
    if (waterSupplyType === "24-hour") {
      form.setValue("waterSupplyTimings.notes", "२४ घण्टा पानी उपलब्ध");
      form.setValue("waterSupplyTimings.morning", "00:00-24:00");
      form.setValue("waterSupplyTimings.evening", "00:00-24:00");
    } else if (waterSupplyType === "alternate-days") {
      form.setValue("waterSupplyTimings.notes", "एक दिन छाडी पानी आउँछ");
    } else if (waterSupplyType === "tanker") {
      form.setValue("waterSupplyTimings.notes", "ट्याङ्कर पानी उपलब्ध");
    }
  }, [waterSupplyType, form]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const newAmenities = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", newAmenities, { shouldValidate: true });
      return newAmenities;
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
    form.setValue("location.latitude", location.lat);
    form.setValue("location.longitude", location.lng);
    form.setValue("location.name", location.name || "Selected Location");
    form.setValue("location.formattedAddress", location.formattedAddress || "");
    form.setValue("location.city", location.city || "");
    form.setValue("location.state", location.state || "");
    form.setValue("location.country", location.country || "");
    form.setValue("location.postalCode", location.postalCode || "");
    if (location.formattedAddress) {
      form.setValue("address", location.formattedAddress);
    }
    form.trigger("location");
    toast.success("📍 Location selected!", {
      description: "You can now fill in the other details.",
      duration: 3000,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidFiles.length > 0) {
      toast.error("Invalid file type", {
        description: "Please upload JPEG, PNG, GIF or WEBP images only.",
      });
      return;
    }
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} photo(s) exceed 10MB`, {
        description: "Please choose smaller images.",
      });
    }
    if (images.length + validFiles.length > 10) {
      toast.error("Maximum 10 photos allowed", {
        description: "You can only upload up to 10 photos per room.",
      });
      return;
    }
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    setImages((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(0);
      toast.success(`${validFiles.length} photo(s) uploaded successfully!`);
    }, 1000);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    toast.info("Photo removed.");
  };

  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;

  const onSubmit = async (values: CreateRoomFormValues) => {
    if (images.length === 0) {
      toast.error("📸 Photos required", {
        description: "Please upload at least one photo of the room.",
        duration: 5000,
      });
      setActiveTab("images");
      return;
    }
    if (!isValidLocation) {
      toast.error("📍 Location required", {
        description: "Please click on the map to set the location.",
        duration: 5000,
      });
      setActiveTab("location");
      return;
    }
    if (selectedAmenities.length === 0) {
      toast.error("✨ Amenities required", {
        description: "Please select at least one amenity for your room.",
        duration: 5000,
      });
      setActiveTab("amenities");
      return;
    }

    values.amenities = selectedAmenities;

    const formData = new FormData();

    const appendToFormData = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    };

    appendToFormData("title", values.title);
    appendToFormData("description", values.description);
    appendToFormData("category", values.category);
    appendToFormData("price", values.price);
    appendToFormData("address", values.address);
    appendToFormData("bathroomCapacity", values.bathroomCapacity);
    appendToFormData("floorNumber", values.floorNumber);
    appendToFormData("ownerLivesInHouse", values.ownerLivesInHouse);
    appendToFormData("totalHouseCapacity", values.totalHouseCapacity);
    appendToFormData("rentedRoomsCount", values.rentedRoomsCount);
    appendToFormData("currentOccupants", values.currentOccupants);
    appendToFormData("waterSupplyTimings", values.waterSupplyTimings);
    appendToFormData("allowsWomen", values.allowsWomen);
    appendToFormData("roomCapacity", values.roomCapacity);
    appendToFormData("roomArea", values.roomArea);
    appendToFormData("contactPerson", values.contactPerson);
    appendToFormData("contactPhone", values.contactPhone);
    appendToFormData("contactEmail", values.contactEmail);
    appendToFormData("contactWhatsapp", values.contactWhatsapp);
    appendToFormData("location", values.location);
    if (values.tiktokUrl) appendToFormData("tiktokUrl", values.tiktokUrl);
    formData.append("amenities", JSON.stringify(selectedAmenities));
    images.forEach((image) => {
      formData.append("images", image);
    });

    const loadingToast = toast.loading("Creating your room listing...", {
      description: "Please wait while we process your request.",
    });

    createRoomMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.dismiss(loadingToast);
          if (isAdmin) {
            toast.success("🎉 Room added successfully!", {
              description: "The room has been added to the system.",
              duration: 5000,
            });
            router.push("/admin/dashboard/rooms");
          } else {
            toast.success("🎉 Room created successfully!", {
              description: "Your room has been submitted for admin approval.",
              duration: 5000,
            });
            router.push("/user/dashboard/rooms");
          }
        },
        onError: (error: unknown) => {
          toast.dismiss(loadingToast);
          const err = error as { response?: { data?: { message?: string } } };
          toast.error("Failed to create room", {
            description:
              err?.response?.data?.message || "Please try again later.",
            duration: 5000,
          });
        },
      },
    );
  };

  const tabs = [
    { value: "basic", label: "Basic Info", icon: Home },
    { value: "location", label: "Location", icon: MapPin },
    { value: "details", label: "Details", icon: Bed },
    { value: "amenities", label: "Amenities", icon: Wifi },
    { value: "images", label: "Photos", icon: ImageIcon },
    { value: "contact", label: "Contact", icon: User },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <span className="text-foreground font-medium">Add Room</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  List Your Room
                </span>
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Form completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="px-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full h-auto p-1 bg-muted/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const hasError =
                    (tab.value === "basic" &&
                      (!formValues.title ||
                        !formValues.description ||
                        !formValues.price)) ||
                    (tab.value === "location" && !isValidLocation) ||
                    (tab.value === "amenities" &&
                      selectedAmenities.length === 0) ||
                    (tab.value === "images" && images.length === 0);

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer relative",
                        hasError &&
                          "border-red-200 text-red-600 data-[state=active]:bg-red-600",
                      )}
                    >
                      <Icon className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline text-xs">
                        {tab.label}
                      </span>
                      {hasError && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]"
                        >
                          !
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* ─── BASIC INFO TAB ─── */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      कोठाको बारेमा विवरण दिनुहोस्। राम्रो description ले बढी
                      भाडाटारु आकर्षित गर्छ।
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Room Title <span className="text-red-500">*</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>e.g. "Modern Studio with AC & WiFi"</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Modern Room with AC & WiFi"
                              {...field}
                              className={cn(
                                formErrors.title && "border-red-500",
                              )}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 3 characters. राम्रो title ले बढी भाडाटारु
                            आउँछन्।
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
                          <FormLabel className="flex items-center gap-1">
                            Description <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="कोठाको बारेमा लेख्नुहोस्। छिमेक, नजिकैका सुविधाहरू, र कोठाको विशेषता उल्लेख गर्नुहोस्..."
                              className={cn(
                                "min-h-[120px]",
                                formErrors.description && "border-red-500",
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 10 characters. भाडाटारुलाई सबै जानकारी
                            दिनुहोस्।
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
                            <FormLabel>
                              Room Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(RoomCategory).map((category) => (
                                  <SelectItem
                                    key={category}
                                    value={category}
                                    className="capitalize cursor-pointer"
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
                                  className={cn(
                                    "pl-9",
                                    formErrors.price && "border-red-500",
                                  )}
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

              {/* ─── LOCATION TAB ─── */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Map
                    </CardTitle>
                    <CardDescription>
                      Click on the map to pin your room's exact location.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isValidLocation && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Location required</AlertTitle>
                        <AlertDescription>
                          Please click on the map to set the location.
                        </AlertDescription>
                      </Alert>
                    )}

                    <MapPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        isValidLocation
                          ? { lat: currentLat, lng: currentLng }
                          : null
                      }
                    />

                    <div className="space-y-4 pt-4">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="location.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Lazimpat Apartment"
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
                                <Input
                                  placeholder="e.g. Kathmandu"
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

                      <FormField
                        control={form.control}
                        name="location.formattedAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Auto-filled after selecting on map"
                                className="min-h-[70px] resize-none bg-muted"
                                {...field}
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isValidLocation && (
                        <div className="flex gap-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              Latitude
                            </p>
                            <p className="font-mono text-sm">
                              {currentLat.toFixed(6)}
                            </p>
                          </div>
                          <div className="flex-1">
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── DETAILS TAB ─── */}
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
                            <FormLabel>Room Capacity</FormLabel>
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
                            <FormLabel>Bathroom Capacity</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <SelectItem
                                    key={num}
                                    value={num.toString()}
                                    className="cursor-pointer"
                                  >
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
                            <FormLabel>Floor Number</FormLabel>
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
                            <FormDescription>Ground floor = 0</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roomArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Area (m²)</FormLabel>
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
                            <FormLabel>Total House Capacity</FormLabel>
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
                            <FormLabel>Current Occupants</FormLabel>
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

                    {/* ─── Water Supply Section ─── */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-primary" />
                        पानी आपूर्ति (Water Supply)
                      </h3>

                      {/* Water supply type selector */}
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

                      {/* Show time pickers only if relevant */}
                      {waterSupplyType === "24-hour" && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">
                            २४ घण्टा पानी उपलब्ध
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
                                defaultValue={field.value}
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
                                defaultValue={field.value}
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

                      <FormField
                        control={form.control}
                        name="waterSupplyTimings.notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Additional Notes (optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. No water on Saturdays, tanker available..."
                                {...field}
                                disabled={waterSupplyType === "24-hour"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Rules */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Rules & Restrictions</h3>
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

              {/* ─── AMENITIES TAB ─── */}
              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-primary" />
                      Amenities
                    </CardTitle>
                    <CardDescription>
                      Select all amenities available in your room.{" "}
                      <span className="text-red-500">*</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedAmenities.length === 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          Please select at least one amenity
                        </AlertTitle>
                        <AlertDescription>
                          Choose the amenities that come with this room.
                        </AlertDescription>
                      </Alert>
                    )}

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

              {/* ─── IMAGES TAB ─── */}
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Room Photos
                    </CardTitle>
                    <CardDescription>
                      Upload clear photos of your room. Good photos attract more
                      tenants. <span className="text-red-500">*</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {images.length === 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Photos required</AlertTitle>
                          <AlertDescription>
                            Please upload at least one photo.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Upload guidelines */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-800">
                              Tips for good photos
                            </p>
                            <p className="text-xs text-blue-700">
                              Shoot in natural daylight
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-800">
                              File size
                            </p>
                            <p className="text-xs text-blue-700">
                              Max 10MB per photo
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-800">
                              File type
                            </p>
                            <p className="text-xs text-blue-700">
                              JPEG, PNG, GIF, WEBP मात्र
                            </p>
                          </div>
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        className="hidden"
                      />

                      {/* Upload area */}
                      <div
                        className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground">
                          Click here to select photos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or drag and drop files here
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <Badge variant="secondary">
                            {images.length}/10 photos
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Max 10MB each
                          </span>
                        </div>
                      </div>

                      {uploadProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                          {imagePreviews.map((preview, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group"
                            >
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                                <img
                                  src={preview}
                                  alt={`Room ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Badge
                                variant="secondary"
                                className="absolute bottom-1 left-1 text-[10px]"
                              >
                                {index + 1}
                              </Badge>
                              {index === 0 && (
                                <Badge className="absolute bottom-1 right-1 text-[10px] bg-primary">
                                  Main
                                </Badge>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── CONTACT TAB ─── */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      How can interested tenants reach you?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Nepali helper note for users */}
                    <Alert className="border-primary/30 bg-primary/5">
                      <User className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary">
                        सम्पर्क जानकारी भर्नुहोस्
                      </AlertTitle>
                      <AlertDescription className="text-foreground/80">
                        कृपया आफ्नो नाम, फोन नम्बर, भर्नुहोस्। भाडामा बस्न
                        चाहनेहरूले यसै मार्फत सम्पर्क गर्नेछन्।
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Phone Number
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
                              Primary contact number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* TikTok — Admin only */}
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

            {/* ─── Sticky Footer Actions ─── */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4 md:-mx-6 lg:-mx-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                      <span className="text-red-500 mr-1">*</span> Required
                      fields
                    </Badge>
                    {Object.keys(validationErrors).length > 0 && (
                      <Badge variant="destructive" className="text-sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {Object.keys(validationErrors).length} issue(s) to fix
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={createRoomMutation.isPending}
                      className="cursor-pointer flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 cursor-pointer flex-1 sm:flex-none"
                      disabled={
                        createRoomMutation.isPending ||
                        images.length === 0 ||
                        !isValidLocation
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
                          List Room
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Please fix the following:
                    </p>
                    <ul className="mt-2 text-sm text-destructive/80 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(validationErrors).map(
                        ([field, error]) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                            <span className="capitalize">
                              {field}: {error}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
