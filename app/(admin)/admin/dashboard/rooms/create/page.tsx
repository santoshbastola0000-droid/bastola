"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  Trash2,
  ChevronRight,
  Star,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RoomCategory } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { useCreateRoomMutation } from "@/http/mutations/room.mutation";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import MapPicker from "@/components/admin/rooms/MapPicker";
import { FAILURETOAST, SUCCESSTOAST } from "@/lib/constants/app.constants";

const amenitiesList = [
  { id: "wifi", label: "WiFi", icon: Wifi, description: "High-speed internet" },
  { id: "ac", label: "AC", icon: Snowflake, description: "Air conditioning" },
  { id: "parking", label: "Parking", icon: Car, description: "Vehicle parking" },
  { id: "tv", label: "TV", icon: Tv, description: "Cable TV" },
  { id: "modular-kitchen", label: "Modular Kitchen", icon: Utensils, description: "Modern modular kitchen" },
  { id: "kitchen", label: "Kitchen", icon: Utensils, description: "Shared kitchen" },
  { id: "security", label: "Security", icon: Shield, description: "24/7 security" },
  { id: "water", label: "पानी", icon: Droplets, description: "पानी सुविधा" },
  { id: "furnished", label: "Furnished", icon: Home, description: "Fully furnished" },
];

const WATER_SUPPLY_OPTIONS = [
  { value: "24-hour", label: "२४ घण्टा", emoji: "💧" },
  { value: "morning-only", label: "बिहान मात्र", emoji: "🌅" },
  { value: "evening-only", label: "साँझ मात्र", emoji: "🌙" },
  { value: "morning-evening", label: "बिहान र साँझ", emoji: "☀️" },
  { value: "alternate-days", label: "एक दिन छाडी", emoji: "📅" },
  { value: "tanker", label: "ट्याङ्कर", emoji: "🚛" },
];

const morningSlots = ["५:०० - ७:०० बिहान", "६:०० - ८:०० बिहान", "७:०० - ९:०० बिहान", "८:०० - १०:०० बिहान"];
const eveningSlots = ["४:०० - ६:०० साँझ", "५:०० - ७:०० साँझ", "६:०० - ८:०० साँझ", "७:०० - ९:०० (राति)"];
const morningSlotValues = ["05:00-07:00", "06:00-08:00", "07:00-09:00", "08:00-10:00"];
const eveningSlotValues = ["16:00-18:00", "17:00-19:00", "18:00-20:00", "19:00-21:00"];

const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.324;

const extractLocationName = (formattedAddress: string): string => {
  if (!formattedAddress) return "";
  const patterns = [/^([^,]+(?:चोक|चोक्|टोल|गाउँ|बजार|मार्ग|रोड|Road|Chowk))/i, /^([^,]+)/];
  for (const pattern of patterns) {
    const match = formattedAddress.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return formattedAddress.split(",")[0]?.trim() || "";
};

const TABS = [
  { value: "basic", label: "Basic", icon: Home, color: "text-orange-500" },
  { value: "location", label: "Location", icon: MapPin, color: "text-red-500" },
  { value: "details", label: "Details", icon: Bed, color: "text-blue-500" },
  { value: "amenities", label: "Amenities", icon: Wifi, color: "text-green-500" },
  { value: "photos", label: "Photos", icon: ImageIcon, color: "text-purple-500" },
  { value: "contact", label: "Contact", icon: User, color: "text-pink-500" },
];

// Counter component for better mobile UX
const CounterField = ({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  icon: Icon,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon?: any;
}) => (
  <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
    <div className="flex items-center gap-3 min-w-0">
      {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 leading-tight">{description}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
      >
        <span className="text-lg font-light leading-none">−</span>
      </button>
      <span className="w-10 text-center text-lg font-bold text-slate-900 tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function CreateRoomPage() {
  const router = useRouter();
  const createRoomMutation = useCreateRoomMutation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserRole();
  const tabsRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      category: RoomCategory.APARTMENT,
      price: undefined as unknown as number, // show placeholder
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
      waterSupplyTimings: { morning: "06:00-08:00", evening: "17:00-19:00", notes: "" },
      location: { name: "", formattedAddress: "", latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, city: "", state: "", country: "", postalCode: "" },
    },
    mode: "onChange",
  });

  const formErrors = form.formState.errors;
  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation = currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;

  // Tab completion tracking
  const getTabStatus = (tab: string) => {
    const v = form.getValues();
    switch (tab) {
      case "basic": return !!(v.title && v.description && v.price);
      case "location": return isValidLocation;
      case "details": return true;
      case "amenities": return selectedAmenities.length > 0;
      case "photos": return images.length > 0;
      case "contact": return !!(v.contactPhone && v.contactPerson);
      default: return false;
    }
  };

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

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId];
      form.setValue("amenities", next, { shouldValidate: true });
      return next;
    });
  };

  const handleLocationSelect = (location: { lat: number; lng: number; name?: string; formattedAddress?: string; city?: string; state?: string; country?: string; postalCode?: string }) => {
    const extractedName = location.formattedAddress ? extractLocationName(location.formattedAddress) : location.name || "Selected Location";
    form.setValue("location.latitude", location.lat);
    form.setValue("location.longitude", location.lng);
    form.setValue("location.name", extractedName);
    form.setValue("location.formattedAddress", location.formattedAddress || "");
    form.setValue("location.city", location.city || "");
    form.setValue("location.state", location.state || "");
    form.setValue("location.country", location.country || "");
    form.setValue("location.postalCode", location.postalCode || "");
    if (location.formattedAddress) form.setValue("address", location.formattedAddress);
    form.trigger("location");
    toast.success("📍 Location selected!", { description: extractedName, duration: 2500 });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const invalid = files.filter((f) => !f.type.startsWith("image/"));
    if (invalid.length > 0) { toast.error("Please upload images only (JPEG, PNG, WEBP)"); return; }
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) toast.warning(`${oversized.length} file(s) exceed 10MB and were skipped`);
    if (images.length + valid.length > 10) { toast.error("Maximum 10 photos allowed"); return; }

    setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress((p) => { if (p >= 100) { clearInterval(interval); return 100; } return p + 10; }), 80);
    setImages((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setTimeout(() => { clearInterval(interval); setUploadProgress(0); toast.success(`${valid.length} photo(s) added!`); }, 900);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const navigateTab = (direction: "next" | "prev") => {
    const idx = TABS.findIndex((t) => t.value === activeTab);
    if (direction === "next" && idx < TABS.length - 1) setActiveTab(TABS[idx + 1].value);
    if (direction === "prev" && idx > 0) setActiveTab(TABS[idx - 1].value);
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    if (images.length === 0) { toast.error("📸 Add at least one photo"); setActiveTab("photos"); return; }
    if (!isValidLocation) { toast.error("📍 Please set the location on map"); setActiveTab("location"); return; }
    if (selectedAmenities.length === 0) { toast.error("✨ Select at least one amenity"); setActiveTab("amenities"); return; }

    values.amenities = selectedAmenities;
    const formData = new FormData();
    const append = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    };

    append("title", values.title);
    append("description", values.description);
    append("category", values.category);
    append("price", values.price);
    append("address", values.address);
    append("bathroomCapacity", values.bathroomCapacity);
    append("floorNumber", values.floorNumber);
    append("ownerLivesInHouse", values.ownerLivesInHouse);
    append("totalHouseCapacity", values.totalHouseCapacity);
    append("rentedRoomsCount", values.rentedRoomsCount);
    append("currentOccupants", values.currentOccupants);
    append("waterSupplyTimings", values.waterSupplyTimings);
    append("allowsWomen", values.allowsWomen);
    append("roomCapacity", values.roomCapacity);
    append("roomArea", values.roomArea);
    append("contactPerson", values.contactPerson);
    append("contactPhone", values.contactPhone);
    append("contactEmail", values.contactEmail);
    append("contactWhatsapp", values.contactWhatsapp);
    append("location", values.location);
    if (values.tiktokUrl) append("tiktokUrl", values.tiktokUrl);
    formData.append("amenities", JSON.stringify(selectedAmenities));
    images.forEach((img) => formData.append("images", img));

    const tid = toast.loading("Creating room listing...");
    createRoomMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast.dismiss(tid);
        toast.success("🎉 Room listed successfully!", { duration: 4000, style: { background: SUCCESSTOAST, color: "#fff" } });
        router.push(isAdmin ? "/admin/dashboard/rooms" : "/user/dashboard/rooms");
      },
      onError: (error: unknown) => {
        toast.dismiss(tid);
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || "Failed to create room. Please try again.", { duration: 5000, style: { background: FAILURETOAST, color: "#fff" } });
      },
    });
  };

  const currentTabIdx = TABS.findIndex((t) => t.value === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 hidden sm:flex">
                  <Link href={isAdmin ? "/admin/dashboard" : "/user/dashboard"} className="hover:text-red-500 transition-colors cursor-pointer">Dashboard</Link>
                  <span>/</span>
                  <Link href={isAdmin ? "/admin/dashboard/rooms" : "/user/dashboard/rooms"} className="hover:text-red-500 transition-colors cursor-pointer">Rooms</Link>
                  <span>/</span>
                  <span className="text-slate-700 font-medium">Add Room</span>
                </div>
                <h1 className="text-base md:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="truncate">List Your Room</span>
                </h1>
              </div>
            </div>
            {/* Overall progress pill */}
            <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
              <div className="text-xs text-slate-500 font-medium">
                {TABS.filter((t) => getTabStatus(t.value)).length}/{TABS.length} done
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <Progress
              value={(TABS.filter((t) => getTabStatus(t.value)).length / TABS.length) * 100}
              className="h-1.5 bg-slate-100"
            />
          </div>

          {/* ── Scrollable Tab Bar ── */}
          <div ref={tabsRef} className="flex gap-1 mt-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isDone = getTabStatus(tab.value);
              return (
                <button
                  key={tab.value}
                  data-tab={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative",
                    isActive
                      ? "bg-red-500 text-white shadow-sm shadow-red-200"
                      : isDone
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {isDone && !isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Form Body ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 pb-40">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >

                {/* ══ BASIC INFO ══ */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <SectionHeader icon={Home} title="Basic Information" subtitle="Tell us about your room" />

                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Room Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Cozy Room with AC & WiFi near Lakeside" {...field} className={cn("h-12 rounded-xl border-slate-200 focus:border-red-400 focus:ring-red-100", formErrors.title && "border-red-400")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Description <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your room — neighbourhood, nearby facilities, what makes it special..." className={cn("min-h-[120px] rounded-xl border-slate-200 focus:border-red-400 resize-none", formErrors.description && "border-red-400")} {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">At least 10 characters. More detail = more inquiries!</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Room Type <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:border-red-400 cursor-pointer">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {Object.values(RoomCategory).map((cat) => (
                                <SelectItem key={cat} value={cat} className="capitalize cursor-pointer py-3">{cat.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Monthly Rent (रु.) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">रु.</span>
                              <Input
                                type="number"
                                placeholder="e.g. 8000"
                                className={cn("h-12 pl-10 rounded-xl border-slate-200 focus:border-red-400", formErrors.price && "border-red-400")}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* ══ LOCATION ══ */}
                {activeTab === "location" && (
                  <div className="space-y-4">
                    <SectionHeader icon={MapPin} title="Location & Map" subtitle="Pin your room on the map" />

                    {!isValidLocation && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Location required</AlertTitle>
                        <AlertDescription>Click on the map below to set the exact location.</AlertDescription>
                      </Alert>
                    )}

                    {isValidLocation && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-700">Location Set</p>
                          <p className="text-xs text-green-600 truncate">{form.getValues("location.formattedAddress") || `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700 flex-shrink-0">✓ Pinned</Badge>
                      </div>
                    )}

                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <MapPicker
                        onLocationSelect={handleLocationSelect}
                        initialLocation={isValidLocation ? { lat: currentLat, lng: currentLng } : null}
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Address Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField control={form.control} name="location.name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">Location Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Lakeside, Srijana Chowk" {...field} className="h-11 rounded-xl border-slate-200" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="location.city" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">City</FormLabel>
                            <FormControl><Input placeholder="e.g. Pokhara" {...field} className="h-11 rounded-xl border-slate-200" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="location.state" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">Province</FormLabel>
                            <FormControl><Input placeholder="e.g. Gandaki" {...field} className="h-11 rounded-xl border-slate-200" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="location.postalCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">Postal Code</FormLabel>
                            <FormControl><Input placeholder="e.g. 33700" {...field} className="h-11 rounded-xl border-slate-200" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="location.formattedAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Full Address</FormLabel>
                          <FormControl>
                            <Textarea className="rounded-xl border-slate-200 bg-slate-50 text-sm resize-none" readOnly {...field} placeholder="Auto-filled after map selection" />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* ══ DETAILS ══ */}
                {activeTab === "details" && (
                  <div className="space-y-5">
                    <SectionHeader icon={Bed} title="Room Details" subtitle="Capacity, floor, and house rules" />

                    {/* Counters */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Capacity & Size</p>

                      <FormField control={form.control} name="roomCapacity" render={({ field }) => (
                        <CounterField label="Room Capacity" description="How many people can sleep here" icon={Users} value={field.value} onChange={field.onChange} min={1} max={20} />
                      )} />
                      <FormField control={form.control} name="bathroomCapacity" render={({ field }) => (
                        <CounterField label="Bathroom Capacity" description="How many people share" icon={Droplets} value={field.value} onChange={field.onChange} min={1} max={20} />
                      )} />
                      <FormField control={form.control} name="floorNumber" render={({ field }) => (
                        <CounterField label="Floor Number" description="0 = Ground floor" icon={Building2} value={field.value} onChange={field.onChange} min={0} max={30} />
                      )} />
                      <FormField control={form.control} name="totalHouseCapacity" render={({ field }) => (
                        <CounterField label="Total House Capacity" description="All rooms combined" icon={Home} value={field.value} onChange={field.onChange} min={1} max={100} />
                      )} />
                      <FormField control={form.control} name="currentOccupants" render={({ field }) => (
                        <CounterField label="Current Occupants" description="People living right now" icon={Users} value={field.value} onChange={field.onChange} min={0} max={100} />
                      )} />

                      <FormField control={form.control} name="roomArea" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Room Area (m²)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                              <Input type="number" min="1" step="0.5" className="h-11 pl-10 rounded-xl border-slate-200" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">m²</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <Separator />

                    {/* Water Supply */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-500" /> पानी आपूर्ति (Water Supply)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {WATER_SUPPLY_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setWaterSupplyType(opt.value)}
                            className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                              waterSupplyType === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300")}>
                            <span className="text-xl">{opt.emoji}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {waterSupplyType === "24-hour" && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-emerald-800">२४ घण्टा पानी उपलब्ध</p>
                        </div>
                      )}

                      {(waterSupplyType === "morning-only" || waterSupplyType === "morning-evening") && (
                        <FormField control={form.control} name="waterSupplyTimings.morning" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-700 flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /> Morning Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {morningSlots.map((slot, i) => <SelectItem key={morningSlotValues[i]} value={morningSlotValues[i]} className="cursor-pointer py-3">{slot}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      )}

                      {(waterSupplyType === "evening-only" || waterSupplyType === "morning-evening") && (
                        <FormField control={form.control} name="waterSupplyTimings.evening" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-700 flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-indigo-500" /> Evening Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {eveningSlots.map((slot, i) => <SelectItem key={eveningSlotValues[i]} value={eveningSlotValues[i]} className="cursor-pointer py-3">{slot}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      )}

                      <FormField control={form.control} name="waterSupplyTimings.notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Additional Notes (optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. No water on Saturdays..." {...field} disabled={waterSupplyType === "24-hour"} className="h-11 rounded-xl border-slate-200" /></FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <Separator />

                    {/* Rules */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">House Rules</p>
                      <FormField control={form.control} name="allowsWomen" render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Women tenants allowed?</p>
                            <p className="text-xs text-slate-500 mt-0.5">महिला भाडाटारु अनुमति</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )} />
                      <FormField control={form.control} name="ownerLivesInHouse" render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Owner lives in building?</p>
                            <p className="text-xs text-slate-500 mt-0.5">घरधनी घरमा बस्छन्?</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )} />
                    </div>
                  </div>
                )}

                {/* ══ AMENITIES ══ */}
                {activeTab === "amenities" && (
                  <div className="space-y-4">
                    <SectionHeader icon={Wifi} title="Amenities / सुविधाहरू" subtitle="Select everything available in your room" />

                    {selectedAmenities.length === 0 && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Select at least one amenity</AlertTitle>
                        <AlertDescription>कृपया कम्तीमा एउटा सुविधा चयन गर्नुहोस्।</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenitiesList.map((amenity) => {
                        const Icon = amenity.icon;
                        const isSelected = selectedAmenities.includes(amenity.id);
                        return (
                          <motion.button
                            key={amenity.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={cn(
                              "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer text-center",
                              isSelected
                                ? "border-red-500 bg-red-50 text-red-700 shadow-sm shadow-red-100"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-semibold leading-tight">{amenity.label}</span>
                            <span className="text-[10px] text-current opacity-60">{amenity.description}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {selectedAmenities.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-green-700">{selectedAmenities.length} amenities selected</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ PHOTOS ══ */}
                {activeTab === "photos" && (
                  <div className="space-y-4">
                    <SectionHeader icon={ImageIcon} title="Room Photos" subtitle="Good photos attract 3x more tenants" />

                    {images.length === 0 && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>At least one photo required</AlertTitle>
                        <AlertDescription>Upload clear, well-lit photos of your room.</AlertDescription>
                      </Alert>
                    )}

                    {/* Tips */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { tip: "Natural light", emoji: "☀️" },
                        { tip: "Max 10MB each", emoji: "📦" },
                        { tip: "JPEG / PNG / WEBP", emoji: "🖼️" },
                      ].map(({ tip, emoji }) => (
                        <div key={tip} className="flex flex-col items-center gap-1 p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-center">
                          <span className="text-xl">{emoji}</span>
                          <p className="text-[10px] text-blue-700 font-semibold">{tip}</p>
                        </div>
                      ))}
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden" />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-red-300 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-red-400 hover:bg-red-50/50 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                        <Plus className="w-7 h-7 text-red-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">Tap to add photos</p>
                        <p className="text-xs text-slate-400 mt-1">{images.length}/10 photos · Max 10MB each</p>
                      </div>
                    </button>

                    {uploadProgress > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500"><span>Processing...</span><span>{uploadProgress}%</span></div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imagePreviews.map((preview, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group aspect-square"
                          >
                            <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-red-300 transition-colors">
                              <img src={preview} alt={`Room ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0">#{i + 1}</Badge>
                              {i === 0 && <Badge className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white border-0">Main</Badge>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ CONTACT ══ */}
                {activeTab === "contact" && (
                  <div className="space-y-4">
                    <SectionHeader icon={User} title="Contact Information" subtitle="How can tenants reach the owner?" />

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800 font-semibold">🔒 This info is shown only after room unlock</p>
                      <p className="text-xs text-amber-700 mt-1">Tenants pay a service charge to see the owner's name and phone number.</p>
                    </div>

                    <FormField control={form.control} name="contactPerson" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ram Prasad Sharma" {...field} className={cn("h-12 rounded-xl border-slate-200 focus:border-red-400", formErrors.contactPerson && "border-red-400")} />
                        </FormControl>
                        <FormDescription className="text-xs">Full name of the owner / घरधनीको पुरा नाम</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="contactPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Owner Phone <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <Input placeholder="+977 98XXXXXXXX" className={cn("h-12 pl-10 rounded-xl border-slate-200 focus:border-red-400", formErrors.contactPhone && "border-red-400")} {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">Tenants will call this number / यस नम्बरमा सम्पर्क गर्नेछन्</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {isAdmin && (
                      <>
                        <Separator />
                        <FormField control={form.control} name="tiktokUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold flex items-center gap-2"><Instagram className="w-4 h-4" /> TikTok URL <Badge variant="outline" className="text-xs">Admin</Badge></FormLabel>
                            <FormControl>
                              <Input placeholder="https://tiktok.com/@username" {...field} className="h-12 rounded-xl border-slate-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </div>

      {/* ── Sticky Bottom Navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTab("prev")}
              disabled={currentTabIdx === 0}
              className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center gap-1.5 justify-center">
              {TABS.map((tab, i) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    activeTab === tab.value ? "w-6 bg-red-500" : getTabStatus(tab.value) ? "w-2 bg-green-400" : "w-2 bg-slate-200"
                  )}
                />
              ))}
            </div>

            {currentTabIdx === TABS.length - 1 ? (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createRoomMutation.isPending || images.length === 0 || !isValidLocation}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-red-200"
              >
                {createRoomMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {createRoomMutation.isPending ? "Listing..." : "List Room"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTab("next")}
                className="flex items-center gap-1 px-4 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Header ──
const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="mb-2">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
    <p className="text-sm text-slate-500 ml-10">{subtitle}</p>
  </div>
);