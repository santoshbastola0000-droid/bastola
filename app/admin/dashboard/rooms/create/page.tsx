"use client";

import { useState, useRef, useEffect } from "react";
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
  Image as ImageIcon,
  IndianRupee,
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

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import("@/components/admin/rooms/MapPicker"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-[400px] md:h-[500px] w-full bg-muted rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
});

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
  {
    id: "hot-water",
    label: "Hot Water",
    icon: Droplets,
    description: "24/7 hot water",
  },
  {
    id: "furnished",
    label: "Furnished",
    icon: Home,
    description: "Fully furnished",
  },
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

// Form progress calculator
const calculateFormProgress = (formValues: any, totalFields: number) => {
  const filledFields = Object.entries(formValues).filter(([key, value]) => {
    if (key === "amenities") return (value as any[])?.length > 0;
    if (key === "location") {
      const loc = value as any;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserRole();

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
    mode: "onChange",
  });

  const formValues = form.watch();
  const formErrors = form.formState.errors;
  const totalFields = 25; // Approximate number of required fields
  const progress = calculateFormProgress(formValues, totalFields);

  // Update validation errors for better messaging
  useEffect(() => {
    const errors: Record<string, string> = {};
    Object.entries(formErrors).forEach(([key, error]) => {
      if (error?.message) {
        errors[key] = error.message;
      }
    });
    setValidationErrors(errors);
  }, [formErrors]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const newAmenities = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", newAmenities, { shouldValidate: true });
      return newAmenities;
    });
  };

  const handleLocationSelect = (location: any) => {
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

    toast.success("📍 Location selected successfully!", {
      description: "You can now continue with other details.",
      duration: 3000,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidFiles.length > 0) {
      toast.error("Invalid file type", {
        description: "Please upload only image files (JPEG, PNG, GIF, WEBP)",
      });
      return;
    }

    // Validate file sizes
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);

    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} image(s) exceed 5MB limit`, {
        description: "Please compress or choose smaller images.",
      });
    }

    // Check total count
    if (images.length + validFiles.length > 10) {
      toast.error("Maximum 10 images allowed", {
        description: "You can only upload up to 10 images per room.",
      });
      return;
    }

    // Simulate upload progress
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
      toast.success(`${validFiles.length} image(s) uploaded successfully!`);
    }, 1000);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed", {
      description: "You can upload a different image if needed.",
    });
  };

  const validateForm = () => {
    const missingFields: string[] = [];

    if (!formValues.title) missingFields.push("Title");
    if (!formValues.description) missingFields.push("Description");
    if (!formValues.price) missingFields.push("Price");
    if (!formValues.address) missingFields.push("Address");
    if (selectedAmenities.length === 0) missingFields.push("Amenities");
    if (images.length === 0) missingFields.push("Images");

    const isLocationSelected =
      formValues.location.latitude !== DEFAULT_LAT ||
      formValues.location.longitude !== DEFAULT_LNG;
    if (!isLocationSelected) missingFields.push("Location on map");

    return missingFields;
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    // Validate images
    if (images.length === 0) {
      toast.error("📸 Photos required", {
        description: "Please upload at least one photo of the room.",
        duration: 5000,
      });
      setActiveTab("images");
      return;
    }

    // Validate location
    const isLocationSelected =
      values.location.latitude !== DEFAULT_LAT ||
      values.location.longitude !== DEFAULT_LNG;

    if (!isLocationSelected) {
      toast.error("📍 Location required", {
        description: "Please click on the map to set the room's location.",
        duration: 5000,
      });
      setActiveTab("location");
      return;
    }

    // Validate amenities
    if (selectedAmenities.length === 0) {
      toast.error("✨ Amenities required", {
        description: "Please select at least one amenity.",
        duration: 5000,
      });
      setActiveTab("amenities");
      return;
    }

    values.amenities = selectedAmenities;

    const formData = new FormData();

    // Helper function to safely append to FormData
    const appendToFormData = (key: string, value: any) => {
      if (value === undefined || value === null) return;

      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    };

    // Append all fields
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

    // Handle tiktokUrl only if it exists
    if (values.tiktokUrl) {
      appendToFormData("tiktokUrl", values.tiktokUrl);
    }

    // Handle amenities as JSON string
    formData.append("amenities", JSON.stringify(selectedAmenities));

    // Append images
    images.forEach((image) => {
      formData.append("images", image);
    });

    // Show loading toast
    const loadingToast = toast.loading("Creating your room listing...", {
      description: "Please wait while we process your request.",
    });

    createRoomMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.dismiss(loadingToast);

          // Role-based success message and routing
          if (user?.role === "Admin") {
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
        onError: (error: any) => {
          toast.dismiss(loadingToast);
          toast.error("Failed to create room", {
            description:
              error?.response?.data?.message || "Please try again later.",
            duration: 5000,
          });
        },
      },
    );
  };

  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;

  // Get friendly field labels
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: "Room Title",
      description: "Description",
      price: "Monthly Price",
      address: "Address",
      amenities: "Amenities",
      location: "Location",
      images: "Photos",
    };
    return labels[field] || field;
  };

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
                <span className="text-foreground font-medium">Create Room</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  List Your Room
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
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
              <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1 bg-muted/50 overflow-x-auto">
                {[
                  { value: "basic", label: "Basic Info", icon: Home },
                  { value: "location", label: "Location", icon: MapPin },
                  { value: "details", label: "Details", icon: Bed },
                  { value: "amenities", label: "Amenities", icon: Wifi },
                  { value: "images", label: "Photos", icon: ImageIcon },
                  { value: "contact", label: "Contact", icon: User },
                ].map((tab) => {
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
                      <Icon className="h-4 w-4 md:hidden" />
                      <span className="hidden md:inline flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </span>
                      {hasError && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                        >
                          !
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Tell us about your room. Be descriptive to attract more
                      tenants.
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
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Choose a catchy title like "Modern Studio
                                    with City View"
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Modern Studio Apartment with AC"
                              {...field}
                              className={cn(
                                formErrors.title && "border-red-500",
                              )}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 3 characters. Make it descriptive and
                            appealing.
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
                              placeholder="Describe your room in detail. Include information about the neighborhood, nearby amenities, and what makes your room special..."
                              className={cn(
                                "min-h-[120px]",
                                formErrors.description && "border-red-500",
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 10 characters. Be thorough to help tenants
                            make informed decisions.
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
                                <SelectTrigger>
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
                              Monthly Price (NPR){" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="5000"
                                  className={cn(
                                    "pl-9",
                                    formErrors.price && "border-red-500",
                                  )}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter amount in Nepali Rupees (NPR)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Map
                    </CardTitle>
                    <CardDescription>
                      Click on the map to set the exact location of your room.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isValidLocation && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Location required</AlertTitle>
                        <AlertDescription>
                          Please click on the map to set your room's location.
                          This helps tenants find your property easily.
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

                    {/* Address Details */}
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
                                <Input
                                  placeholder="e.g., Kathmandu"
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

                      <FormField
                        control={form.control}
                        name="location.formattedAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Full address will appear here after selecting on map"
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
                        <div className="flex gap-4 p-3 bg-primary/5 rounded-lg">
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
                            className="bg-green-50 text-green-700"
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

              {/* Details Tab */}
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-primary" />
                      Room Details & Specifications
                    </CardTitle>
                    <CardDescription>
                      Provide detailed information about the room's features.
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
                                />
                              </div>
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
                            <FormLabel>Bathroom Capacity</FormLabel>
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
                            <FormLabel>Floor Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              0 for ground floor
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
                              <Input type="number" min="1" {...field} />
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
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Water Supply Timings */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-primary" />
                        Water Supply Timings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="waterSupplyTimings.morning"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <Sun className="h-3 w-3" />
                                Morning Timing
                              </FormLabel>
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
                              <FormLabel className="flex items-center gap-1">
                                <Moon className="h-3 w-3" />
                                Evening Timing
                              </FormLabel>
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

                    {/* Rules & Restrictions */}
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
                                  Women Allowed
                                </FormLabel>
                                <FormDescription>
                                  Allow women tenants in this room
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

              {/* Amenities Tab */}
              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-primary" />
                      Amenities
                    </CardTitle>
                    <CardDescription>
                      Select all amenities available in your room.
                      <span className="text-red-500 ml-1">*</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedAmenities.length === 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Select at least one amenity</AlertTitle>
                        <AlertDescription>
                          Please choose the amenities that come with your room.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                              <span className="text-xs font-medium">
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

              {/* Images Tab */}
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Room Photos
                    </CardTitle>
                    <CardDescription>
                      Upload clear photos of your room. High-quality images get
                      more inquiries.
                      <span className="text-red-500 ml-1">*</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {images.length === 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Photos required</AlertTitle>
                          <AlertDescription>
                            Please upload at least one photo of your room.
                          </AlertDescription>
                        </Alert>
                      )}

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

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {images.length}/10 photos
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Max 5MB each
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
                              exit={{ opacity: 0, scale: 0.9 }}
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
                            </motion.div>
                          ))}
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
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      How can potential tenants reach you?
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
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="e.g., John Doe"
                                className="pl-9"
                                {...field}
                              />
                            </div>
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
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="+977 98XXXXXXXX"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
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
                              <div className="relative">
                                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="+977 98XXXXXXXX"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
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
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="contact@example.com"
                                className="pl-9"
                                {...field}
                              />
                            </div>
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
                            TikTok Profile (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://tiktok.com/@username"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Share your TikTok profile to showcase your property
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
                          Create Room
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick validation summary */}
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
                              {getFieldLabel(field)}: {error}
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
