"use client";

import { useState, useEffect, useRef } from "react";
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
  Heart,
  Cigarette,
  Wine,
  Baby,
  UtensilsCrossed,
  Moon as MoonIcon,
  Shirt,
  Sun as SunIcon,
  Plus,
  XCircle,
  Image as ImageIcon,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RoomCategory, TenantType, GenderPreference } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { roomService } from "@/http/services/room.service";
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
    description: "Modern kitchen",
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
  { value: "24-hour", label: "२४ घण्टा", emoji: "💧" },
  { value: "morning-only", label: "बिहान मात्र", emoji: "🌅" },
  { value: "evening-only", label: "साँझ मात्र", emoji: "🌙" },
  { value: "morning-evening", label: "बिहान र साँझ", emoji: "☀️" },
  { value: "alternate-days", label: "एक दिन छाडी", emoji: "📅" },
  { value: "tanker", label: "ट्याङ्कर", emoji: "🚛" },
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

const TENANT_TYPE_OPTIONS: {
  value: TenantType;
  labelEn: string;
  labelNp: string;
  emoji: string;
}[] = [
  {
    value: TenantType.STUDENT,
    labelEn: "Student",
    labelNp: "विद्यार्थी",
    emoji: "🎓",
  },
  {
    value: TenantType.WORKING_PROFESSIONAL,
    labelEn: "Working Professional",
    labelNp: "कामकाजी",
    emoji: "💼",
  },
  {
    value: TenantType.FAMILY,
    labelEn: "Family",
    labelNp: "परिवार",
    emoji: "👨‍👩‍👧",
  },
  {
    value: TenantType.SINGLE_PERSON,
    labelEn: "Single Person",
    labelNp: "एकल व्यक्ति",
    emoji: "🧑",
  },
  { value: TenantType.COUPLE, labelEn: "Couple", labelNp: "जोडी", emoji: "💑" },
  {
    value: TenantType.ANY,
    labelEn: "Any / जुनसुकै",
    labelNp: "जुनसुकै",
    emoji: "🤝",
  },
];

const COMMUNITY_OPTIONS = [
  { value: "Hindu", labelEn: "Hindu", labelNp: "हिन्दू" },
  { value: "Muslim", labelEn: "Muslim", labelNp: "मुस्लिम" },
  { value: "Christian", labelEn: "Christian", labelNp: "क्रिस्चियन" },
  { value: "Buddhist", labelEn: "Buddhist", labelNp: "बौद्ध" },
  { value: "Any", labelEn: "Any Community", labelNp: "जुनसुकै" },
  { value: "Other", labelEn: "Other", labelNp: "अन्य" },
];

const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.324;

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const resolveImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http") || imagePath.startsWith("blob:"))
    return imagePath;
  return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

const extractLocationName = (formattedAddress: string): string => {
  if (!formattedAddress) return "";
  const patterns = [
    /^([^,]+(?:चोक|टोल|गाउँ|बजार|मार्ग|रोड|Road|Chowk))/i,
    /^([^,]+)/,
  ];
  for (const pattern of patterns) {
    const match = formattedAddress.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return formattedAddress.split(",")[0]?.trim() || "";
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

const TABS = [
  { value: "basic", label: "Basic", labelNp: "आधारभूत", icon: Home },
  { value: "location", label: "Location", labelNp: "स्थान", icon: MapPin },
  { value: "details", label: "Details", labelNp: "विवरण", icon: Bed },
  { value: "amenities", label: "Amenities", labelNp: "सुविधा", icon: Wifi },
  {
    value: "preferences",
    label: "Preferences",
    labelNp: "प्राथमिकता",
    icon: Heart,
  },
  { value: "photos", label: "Photos", labelNp: "फोटो", icon: ImageIcon },
  { value: "contact", label: "Contact", labelNp: "सम्पर्क", icon: User },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) => (
  <div className="mb-2">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
    <p className="text-sm text-slate-500 ml-10">{subtitle}</p>
  </div>
);

const CounterField = ({
  label,
  labelNp,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  icon: Icon,
}: {
  label: string;
  labelNp?: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon?: any;
}) => (
  <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
        {labelNp && (
          <p className="text-xs text-slate-400 truncate">{labelNp}</p>
        )}
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-tight">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
      >
        <span className="text-lg font-light leading-none select-none">−</span>
      </button>
      <span className="w-10 text-center text-lg font-bold text-slate-900 tabular-nums select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4" aria-hidden />
      </button>
    </div>
  </div>
);

const TriToggle = ({
  label,
  labelNp,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  labelNp?: string;
  icon?: any;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) => {
  const options: {
    v: boolean | null;
    label: string;
    labelNp: string;
    cls: string;
  }[] = [
    { v: true, label: "Yes", labelNp: "हो", cls: "bg-green-500 text-white" },
    { v: false, label: "No", labelNp: "होइन", cls: "bg-red-500 text-white" },
    {
      v: null,
      label: "N/A",
      labelNp: "थाहा छैन",
      cls: "bg-slate-200 text-slate-600",
    },
  ];
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {labelNp && <p className="text-xs text-slate-400">{labelNp}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {options.map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              value === opt.v
                ? opt.cls
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100",
            )}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.labelNp}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const { user } = useUserRole();
  const isAdmin = user?.role === UserRole.ADMIN;
  const tabsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const [selectedTenantTypes, setSelectedTenantTypes] = useState<TenantType[]>(
    [],
  );
  const [ownerCommunityCustom, setOwnerCommunityCustom] = useState("");
  const [showOwnerCommunityInput, setShowOwnerCommunityInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  // Image state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data, isLoading } = useQuery({
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
      category: RoomCategory.APARTMENT,
      price: undefined as unknown as number,
      address: "",
      amenities: [],
      bathroomCapacity: 1,
      floorNumber: 0,
      ownerLivesInHouse: false,
      ownerFloorNumber: null,
      totalHouseCapacity: 4,
      rentedRoomsCount: 0,
      currentOccupants: 0,
      allowsWomen: true,
      roomCapacity: 2,
      roomArea: undefined as unknown as number,
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
      tenantTypes: [],
      genderPreference: GenderPreference.NO_PREFERENCE,
      smokingAllowed: null,
      alcoholAllowed: null,
      nonVegAllowed: null,
      buffaloMeatAllowed: null,
      porkAllowed: null,
      lateNightAllowed: null,
      babyAllowed: null,
      otherRules: "",
      gateClosingTime: "",
      hasClothDryingArea: null,
      hasSunlight: null,
      existingProblems: "",
      ownerCommunity: "",
      communityPreference: "",
      distanceHighwayM: null,
    },
    mode: "onChange",
  });

  // Pre-fill form when room data loads
  useEffect(() => {
    if (!room) return;

    const detectedType = detectWaterType(room.waterSupplyTimings);
    setWaterSupplyType(detectedType);

    setExistingImages(room.images || []);
    const tt = room.tenantTypes || [];
    setSelectedTenantTypes(tt);

    const knownValues = COMMUNITY_OPTIONS.map((o) => o.value);
    if (
      room.ownerCommunity &&
      !knownValues.includes(room.ownerCommunity) &&
      room.ownerCommunity !== ""
    ) {
      setOwnerCommunityCustom(room.ownerCommunity);
      setShowOwnerCommunityInput(true);
    }

    let validCategory = room.category;
    if (!Object.values(RoomCategory).includes(room.category as RoomCategory)) {
      validCategory = RoomCategory.APARTMENT;
    }

    form.reset({
      title: room.title || "",
      description: room.description || "",
      category: validCategory,
      price: room.price && room.price > 0 ? room.price : undefined,
      address: room.address || "",
      amenities: room.amenities || [],
      bathroomCapacity: room.bathroomCapacity || 1,
      floorNumber: room.floorNumber ?? 0,
      ownerLivesInHouse: room.ownerLivesInHouse || false,
      ownerFloorNumber: room.ownerFloorNumber ?? null,
      totalHouseCapacity: room.totalHouseCapacity || 4,
      rentedRoomsCount: room.rentedRoomsCount || 0,
      currentOccupants: room.currentOccupants || 0,
      allowsWomen: room.allowsWomen ?? true,
      roomCapacity: room.roomCapacity || 2,
      roomArea: room.roomArea && room.roomArea > 0 ? room.roomArea : undefined,
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
      tenantTypes: tt,
      genderPreference: room.genderPreference ?? GenderPreference.NO_PREFERENCE,
      smokingAllowed: room.smokingAllowed ?? null,
      alcoholAllowed: room.alcoholAllowed ?? null,
      nonVegAllowed: room.nonVegAllowed ?? null,
      buffaloMeatAllowed: room.buffaloMeatAllowed ?? null,
      porkAllowed: room.porkAllowed ?? null,
      lateNightAllowed: room.lateNightAllowed ?? null,
      babyAllowed: room.babyAllowed ?? null,
      otherRules: room.otherRules || "",
      gateClosingTime: room.gateClosingTime || "",
      hasClothDryingArea: room.hasClothDryingArea ?? null,
      hasSunlight: room.hasSunlight ?? null,
      existingProblems: room.existingProblems || "",
      ownerCommunity: room.ownerCommunity || "",
      communityPreference: room.communityPreference || "",
      distanceHighwayM: room.distanceHighwayM ?? null,
    });

    if (room.amenities) setSelectedAmenities(room.amenities);

    setTimeout(() => setIsFormReady(true), 100);
  }, [room, form]);

  // Water supply effect
  useEffect(() => {
    if (!isFormReady) return;
    if (waterSupplyType === "24-hour") {
      form.setValue("waterSupplyTimings.morning", "00:00-24:00");
      form.setValue("waterSupplyTimings.evening", "00:00-24:00");
      form.setValue("waterSupplyTimings.notes", "TYPE:24-hour");
    } else if (waterSupplyType === "morning-only") {
      form.setValue("waterSupplyTimings.evening", "");
      form.setValue("waterSupplyTimings.notes", "TYPE:morning-only");
    } else if (waterSupplyType === "evening-only") {
      form.setValue("waterSupplyTimings.morning", "");
      form.setValue("waterSupplyTimings.notes", "TYPE:evening-only");
    } else if (waterSupplyType === "alternate-days") {
      form.setValue("waterSupplyTimings.notes", "TYPE:alternate-days");
    } else if (waterSupplyType === "tanker") {
      form.setValue("waterSupplyTimings.notes", "TYPE:tanker");
    } else {
      form.setValue("waterSupplyTimings.notes", "TYPE:morning-evening");
    }
  }, [waterSupplyType, form, isFormReady]);

  // Scroll tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector(
        `[data-tab="${activeTab}"]`,
      );
      activeEl?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;
  const ownerLivesInHouse = form.watch("ownerLivesInHouse");

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", next, { shouldValidate: true });
      return next;
    });
  };

  const toggleTenantType = (type: TenantType) => {
    setSelectedTenantTypes((prev) => {
      let next: TenantType[];
      if (type === TenantType.ANY) {
        next = prev.includes(TenantType.ANY) ? [] : [TenantType.ANY];
      } else {
        const withoutAny = prev.filter((t) => t !== TenantType.ANY);
        next = withoutAny.includes(type)
          ? withoutAny.filter((t) => t !== type)
          : [...withoutAny, type];
      }
      form.setValue("tenantTypes", next);
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

  // ── Image management ──────────────────────────────────────────────────────

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(
      (f) => f.size <= 10 * 1024 * 1024 && f.type.startsWith("image/"),
    );
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0)
      toast.warning(`${oversized.length} file(s) exceed 10MB`);

    const totalAfter =
      existingImages.length + newImageFiles.length + valid.length;
    if (totalAfter > 10) {
      toast.error("Maximum 10 photos allowed total");
      return;
    }

    setUploadProgress(0);
    const interval = setInterval(
      () =>
        setUploadProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 10;
        }),
      80,
    );
    setNewImageFiles((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(0);
      toast.success(`${valid.length} photo(s) added!`);
    }, 900);
    e.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const navigateTab = (direction: "next" | "prev") => {
    const idx = TABS.findIndex((t) => t.value === activeTab);
    if (direction === "next" && idx < TABS.length - 1)
      setActiveTab(TABS[idx + 1].value);
    if (direction === "prev" && idx > 0) setActiveTab(TABS[idx - 1].value);
  };

  const currentTabIdx = TABS.findIndex((t) => t.value === activeTab);

  const onSubmit = async (values: CreateRoomFormValues) => {
    setIsSubmitting(true);

    values.amenities = selectedAmenities;
    values.tenantTypes = selectedTenantTypes;

    const finalCommunity =
      values.ownerCommunity === "Other"
        ? ownerCommunityCustom
        : values.ownerCommunity;

    // Create FormData
    const formData = new FormData();

    // Helper to safely append values
    const appendField = (key: string, value: any) => {
      if (value === null || value === undefined) return;
      if (
        typeof value === "object" &&
        !(value instanceof File) &&
        !(value instanceof Date)
      ) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    };

    // Basic fields
    appendField("title", values.title);
    appendField("description", values.description);
    appendField("category", values.category);
    appendField("price", values.price);
    appendField("address", values.address);
    appendField("bathroomCapacity", values.bathroomCapacity);
    appendField("floorNumber", values.floorNumber);
    appendField("ownerLivesInHouse", values.ownerLivesInHouse);
    appendField("ownerFloorNumber", values.ownerFloorNumber);
    appendField("totalHouseCapacity", values.totalHouseCapacity);
    appendField("rentedRoomsCount", values.rentedRoomsCount);
    appendField("currentOccupants", values.currentOccupants);
    appendField("waterSupplyTimings", values.waterSupplyTimings);
    appendField("allowsWomen", values.allowsWomen);
    appendField("roomCapacity", values.roomCapacity);
    appendField("roomArea", values.roomArea);
    appendField("contactPerson", values.contactPerson);
    appendField("contactPhone", values.contactPhone);
    appendField("location", values.location);
    appendField("tiktokUrl", values.tiktokUrl);
    appendField("distanceHighwayM", values.distanceHighwayM);

    // Arrays
    appendField("amenities", selectedAmenities);
    appendField("tenantTypes", selectedTenantTypes);

    // CRITICAL: Send images to keep and images to remove separately
    appendField("images", existingImages);
    if (removedImages.length > 0) {
      appendField("removedImages", removedImages);
    }

    // Single values
    appendField("genderPreference", values.genderPreference);

    // Boolean fields with null handling
    const booleanFields = [
      "smokingAllowed",
      "alcoholAllowed",
      "nonVegAllowed",
      "buffaloMeatAllowed",
      "porkAllowed",
      "lateNightAllowed",
      "babyAllowed",
      "hasClothDryingArea",
      "hasSunlight",
    ];
    booleanFields.forEach((field) => {
      const val = values[field as keyof CreateRoomFormValues];
      if (val !== undefined && val !== null) {
        appendField(field, val);
      }
    });

    // Text fields
    appendField("otherRules", values.otherRules);
    appendField("gateClosingTime", values.gateClosingTime);
    appendField("existingProblems", values.existingProblems);
    appendField("ownerCommunity", finalCommunity);
    appendField("communityPreference", values.communityPreference);

    // Add new image files
    newImageFiles.forEach((file) => {
      formData.append("images", file);
    });

    const loadingToast = toast.loading("Saving changes...");

    try {
      await roomService.updateRoom(id, formData);

      toast.dismiss(loadingToast);
      toast.success("🎉 Room updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      router.push(isAdmin ? "/admin/dashboard/rooms" : "/user/dashboard/rooms");
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
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Back
        </button>
      </div>
    );
  }

  const totalImages = existingImages.length + newImageFiles.length;
  const communityIsMuted = (communityValue: string) => {
    const ownerVal = form.watch("ownerCommunity");
    if (
      !ownerVal ||
      ownerVal === "Any" ||
      ownerVal === "Other" ||
      ownerVal === ""
    )
      return false;
    if (
      ownerVal === "Hindu" &&
      (communityValue === "Muslim" || communityValue === "Christian")
    )
      return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" aria-hidden />
              </button>
              <div className="min-w-0">
                <nav
                  className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400"
                  aria-label="Breadcrumb"
                >
                  <Link
                    href={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    Dashboard
                  </Link>
                  <span aria-hidden>/</span>
                  <Link
                    href={
                      isAdmin
                        ? "/admin/dashboard/rooms"
                        : "/user/dashboard/rooms"
                    }
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    Rooms
                  </Link>
                  <span aria-hidden>/</span>
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">
                    {room.title}
                  </span>
                  <span aria-hidden>/</span>
                  <span className="text-primary font-semibold">Edit</span>
                </nav>
                <h1 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2
                    className="w-4 h-4 text-primary flex-shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">Edit Room</span>
                  <Badge variant="secondary" className="text-xs">
                    {room.approvalStatus}
                  </Badge>
                </h1>
              </div>
            </div>
            <Link
              href={`/admin/dashboard/rooms/${id}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden /> View
            </Link>
          </div>

          {/* Tab bar */}
          <div
            ref={tabsRef}
            className="flex gap-1 mt-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
            role="tablist"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  data-tab={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Form Body ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 md:px-6 pb-36">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* ══ BASIC ══ */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <SectionHeader
                      icon={Home}
                      title="Basic Information"
                      subtitle="आधारभूत जानकारी — Update the basics"
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Room Title / कोठाको शीर्षक{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Modern Room with AC & WiFi"
                              {...field}
                              className="h-12 rounded-xl border-slate-200"
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
                          <FormLabel className="text-slate-700 font-semibold">
                            Description / विवरण{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="कोठाको बारेमा लेख्नुहोस्..."
                              className="min-h-[120px] rounded-xl border-slate-200 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold">
                              Room Type / प्रकार{" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 cursor-pointer">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {Object.values(RoomCategory).map((cat) => (
                                  <SelectItem
                                    key={cat}
                                    value={cat}
                                    className="capitalize cursor-pointer py-3"
                                  >
                                    {cat.replace("_", " ")}
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
                            <FormLabel className="text-slate-700 font-semibold">
                              Monthly Rent / मासिक भाडा (रु.){" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span
                                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none"
                                  aria-hidden
                                >
                                  रु.
                                </span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder="e.g. 8000"
                                  className="h-12 pl-10 rounded-xl border-slate-200 focus:border-primary pr-10"
                                  value={
                                    field.value === undefined ||
                                    field.value === 0
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (newValue === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = Number(newValue);
                                      if (!isNaN(numValue) && numValue > 0) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                />
                                {field.value !== undefined &&
                                  field.value !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange(undefined);
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                      aria-label="Clear price"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Enter monthly rent amount / मासिक भाडा रकम
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ══ LOCATION ══ */}
                {activeTab === "location" && (
                  <div className="space-y-4">
                    <SectionHeader
                      icon={MapPin}
                      title="Location & Map"
                      subtitle="स्थान र नक्सा — Click map to update location"
                    />

                    {isValidLocation && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          aria-hidden
                        />
                        <p className="text-sm font-semibold text-green-700 truncate">
                          {form.getValues("location.formattedAddress") ||
                            `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700 flex-shrink-0 ml-auto"
                        >
                          ✓ Set
                        </Badge>
                      </div>
                    )}

                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <MapPicker
                        onLocationSelect={handleLocationSelect}
                        initialLocation={
                          isValidLocation
                            ? { lat: currentLat, lng: currentLng }
                            : null
                        }
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location.formattedAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" aria-hidden /> Full
                            Address / पूरा ठेगाना
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600"
                            >
                              Editable
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Auto-filled from map — or edit manually here / नक्साबाट स्वत: भरिन्छ वा यहाँ सम्पादन गर्नुहोस्"
                              className="rounded-xl border-slate-200 resize-y min-h-[80px] focus:border-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            तपाईं यो ठेगाना सीधै सम्पादन गर्न सक्नुहुन्छ — You
                            can edit this address manually.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="location.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">
                              Location Name / स्थानको नाम
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Lakeside, Srijana Chowk"
                                {...field}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">
                              City / शहर
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Pokhara"
                                {...field}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">
                              Province / प्रदेश
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Gandaki"
                                {...field}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">
                              Postal Code / हुलाक
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 33700"
                                {...field}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Distance from Highway */}
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <FormField
                        control={form.control}
                        name="distanceHighwayM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
                              🛣️ Distance from Highway / राजमार्गबाट दूरी
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-slate-300 text-slate-400"
                              >
                                Optional
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  step="10"
                                  placeholder="e.g. 200"
                                  className="h-11 pr-20 rounded-xl border-slate-200 focus:border-primary"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                                <span
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none"
                                  aria-hidden
                                >
                                  metres
                                </span>
                              </div>
                            </FormControl>
                            {field.value !== null &&
                              field.value !== undefined &&
                              Number(field.value) > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  ≈{" "}
                                  {Number(field.value) >= 1000
                                    ? `${(Number(field.value) / 1000).toFixed(2)} km`
                                    : `${field.value} m`}{" "}
                                  — राजमार्गबाट
                                </p>
                              )}
                            <FormDescription className="text-xs">
                              राजमार्गबाट कति मिटर टाढा छ? How many metres from
                              the highway?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500">
                          💡 <strong>Tip:</strong> 1 km = 1000 m &nbsp;·&nbsp;
                          नजिक भए सानो नम्बर, टाढा भए ठूलो
                        </p>
                      </div>
                    </div>

                    {isValidLocation && (
                      <div className="flex gap-4 p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs font-mono">
                        <span>Lat: {currentLat.toFixed(6)}</span>
                        <span>Lng: {currentLng.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ DETAILS ══ */}
                {activeTab === "details" && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={Bed}
                      title="Room Details"
                      subtitle="क्षमता र नियमहरू — Capacity, floor, and house rules"
                    />

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Capacity & Size / क्षमता र आकार
                      </p>

                      <FormField
                        control={form.control}
                        name="roomCapacity"
                        render={({ field }) => (
                          <CounterField
                            label="Room Capacity"
                            labelNp="कोठामा बस्ने संख्या"
                            icon={Users}
                            value={field.value || 1}
                            onChange={field.onChange}
                            min={1}
                            max={20}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bathroomCapacity"
                        render={({ field }) => (
                          <CounterField
                            label="Bathroom Capacity"
                            labelNp="बाथरुम क्षमता"
                            icon={Droplets}
                            value={field.value || 1}
                            onChange={field.onChange}
                            min={1}
                            max={20}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="floorNumber"
                        render={({ field }) => (
                          <CounterField
                            label="Floor Number"
                            labelNp="तला नम्बर (० = भुइँतला)"
                            description="0 = Ground"
                            icon={Building2}
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            min={0}
                            max={30}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalHouseCapacity"
                        render={({ field }) => (
                          <CounterField
                            label="Total House Capacity"
                            labelNp="घरको जम्मा क्षमता"
                            icon={Home}
                            value={field.value || 1}
                            onChange={field.onChange}
                            min={1}
                            max={100}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentOccupants"
                        render={({ field }) => (
                          <CounterField
                            label="Current Occupants"
                            labelNp="हाल बस्ने व्यक्तिहरू"
                            icon={Users}
                            value={field.value || 0}
                            onChange={field.onChange}
                            min={0}
                            max={100}
                          />
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roomArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold">
                              Room Area / क्षेत्रफल (m²){" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Ruler
                                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                                  aria-hidden
                                />
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min="1"
                                  step="0.5"
                                  placeholder="e.g. 30"
                                  className="h-11 pl-10 rounded-xl border-slate-200 focus:border-primary pr-10"
                                  value={
                                    field.value === undefined ||
                                    field.value === 0
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (newValue === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = Number(newValue);
                                      if (!isNaN(numValue) && numValue > 0) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                />
                                <span
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none"
                                  aria-hidden
                                >
                                  m²
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Water Supply */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Droplets
                          className="w-4 h-4 text-blue-500"
                          aria-hidden
                        />{" "}
                        पानी आपूर्ति / Water Supply
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {WATER_SUPPLY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setWaterSupplyType(opt.value)}
                            aria-pressed={waterSupplyType === opt.value}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                              waterSupplyType === opt.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                            )}
                          >
                            <span className="text-xl" aria-hidden>
                              {opt.emoji}
                            </span>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {waterSupplyType === "24-hour" && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <CheckCircle2
                            className="w-5 h-5 text-emerald-600 flex-shrink-0"
                            aria-hidden
                          />
                          <p className="text-sm font-semibold text-emerald-800">
                            २४ घण्टा पानी उपलब्ध
                          </p>
                        </div>
                      )}

                      {(waterSupplyType === "morning-only" ||
                        waterSupplyType === "morning-evening") && (
                        <FormField
                          control={form.control}
                          name="waterSupplyTimings.morning"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-slate-700 flex items-center gap-1">
                                <Sun
                                  className="w-3.5 h-3.5 text-amber-500"
                                  aria-hidden
                                />{" "}
                                Morning / बिहान
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {morningSlots.map((slot, i) => (
                                    <SelectItem
                                      key={morningSlotValues[i]}
                                      value={morningSlotValues[i]}
                                      className="cursor-pointer py-3"
                                    >
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <FormLabel className="text-sm text-slate-700 flex items-center gap-1">
                                <Moon
                                  className="w-3.5 h-3.5 text-indigo-500"
                                  aria-hidden
                                />{" "}
                                Evening / साँझ
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {eveningSlots.map((slot, i) => (
                                    <SelectItem
                                      key={eveningSlotValues[i]}
                                      value={eveningSlotValues[i]}
                                      className="cursor-pointer py-3"
                                    >
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="waterSupplyTimings.notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">
                              Additional Notes / थप टिप्पणी
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. No water on Saturdays..."
                                {...field}
                                disabled={waterSupplyType === "24-hour"}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Rules */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">
                        House Rules / घरका नियमहरू
                      </p>
                      <FormField
                        control={form.control}
                        name="allowsWomen"
                        render={({ field }) => (
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Women tenants allowed?
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                महिला भाडाटारु अनुमति छ?
                              </p>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Women tenants allowed"
                            />
                          </div>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ownerLivesInHouse"
                        render={({ field }) => (
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Owner lives in building?
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                घरधनी घरमा बस्छन्?
                              </p>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Owner lives in house"
                            />
                          </div>
                        )}
                      />
                      {ownerLivesInHouse && (
                        <FormField
                          control={form.control}
                          name="ownerFloorNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-slate-700 font-semibold">
                                Owner's Floor / घरधनी कुन तलामा?
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  placeholder="e.g. 2"
                                  className="h-11 rounded-xl border-slate-200"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ══ AMENITIES ══ */}
                {activeTab === "amenities" && (
                  <div className="space-y-4">
                    <SectionHeader
                      icon={Wifi}
                      title="Amenities / सुविधाहरू"
                      subtitle="Select everything available in your room"
                    />

                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      role="group"
                      aria-label="Amenities"
                    >
                      {amenitiesList.map((amenity) => {
                        const Icon = amenity.icon;
                        const isSelected = selectedAmenities.includes(
                          amenity.id,
                        );
                        return (
                          <motion.button
                            key={amenity.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleAmenity(amenity.id)}
                            aria-pressed={isSelected}
                            className={cn(
                              "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer text-center",
                              isSelected
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                            )}
                          >
                            <Icon className="w-6 h-6" aria-hidden />
                            <span className="text-xs font-semibold leading-tight">
                              {amenity.label}
                            </span>
                            <span className="text-[10px] text-current opacity-60">
                              {amenity.description}
                            </span>
                            {isSelected && (
                              <div
                                className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                                aria-hidden
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    <p className="text-sm text-slate-500">
                      {selectedAmenities.length} selected / चयन भयो
                    </p>
                  </div>
                )}

                {/* ══ PREFERENCES ══ */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <SectionHeader
                      icon={Heart}
                      title="Tenant Preferences"
                      subtitle="Optional — सबै खाली छोड्न मिल्छ"
                    />

                    {/* Tenant Type */}
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Who is your ideal tenant? / आदर्श भाडाटारु
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Multiple choice — Optional
                        </p>
                      </div>
                      <div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                        role="group"
                        aria-label="Tenant type"
                      >
                        {TENANT_TYPE_OPTIONS.map((opt) => {
                          const isSelected = selectedTenantTypes.includes(
                            opt.value,
                          );
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => toggleTenantType(opt.value)}
                              aria-pressed={isSelected}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/30",
                              )}
                            >
                              <span className="text-xl" aria-hidden>
                                {opt.emoji}
                              </span>
                              <span>{opt.labelEn}</span>
                              <span className="text-[10px] opacity-70">
                                {opt.labelNp}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <Separator />

                    {/* Gender Preference */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Gender Preference / लिङ्ग प्राथमिकता
                      </p>
                      <FormField
                        control={form.control}
                        name="genderPreference"
                        render={({ field }) => (
                          <div
                            className="grid grid-cols-3 gap-2"
                            role="radiogroup"
                            aria-label="Gender preference"
                          >
                            {[
                              {
                                v: GenderPreference.MALE_ONLY,
                                en: "Male Only",
                                np: "पुरुष मात्र",
                                emoji: "👨",
                              },
                              {
                                v: GenderPreference.FEMALE_ONLY,
                                en: "Female Only",
                                np: "महिला मात्र",
                                emoji: "👩",
                              },
                              {
                                v: GenderPreference.NO_PREFERENCE,
                                en: "No Preference",
                                np: "जुनसुकै",
                                emoji: "🤝",
                              },
                            ].map((opt) => (
                              <button
                                key={opt.v}
                                type="button"
                                role="radio"
                                aria-checked={field.value === opt.v}
                                onClick={() => field.onChange(opt.v)}
                                className={cn(
                                  "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                                  field.value === opt.v
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200",
                                )}
                              >
                                <span className="text-xl" aria-hidden>
                                  {opt.emoji}
                                </span>
                                <span>{opt.en}</span>
                                <span className="text-[10px] opacity-70">
                                  {opt.np}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Lifestyle Rules */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Lifestyle Rules / जीवनशैली नियमहरू
                      </p>
                      <FormField
                        control={form.control}
                        name="smokingAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Smoking Allowed?"
                            labelNp="धुम्रपान अनुमति छ?"
                            icon={Cigarette}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="alcoholAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Alcohol Allowed?"
                            labelNp="मदिरा अनुमति छ?"
                            icon={Wine}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nonVegAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Non-Vegetarian Allowed?"
                            labelNp="माछामासु अनुमति छ?"
                            icon={UtensilsCrossed}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="buffaloMeatAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Buffalo Meat Allowed?"
                            labelNp="राँगाको मासु?"
                            icon={UtensilsCrossed}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="porkAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Pork Allowed?"
                            labelNp="सुँगुरको मासु?"
                            icon={UtensilsCrossed}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lateNightAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Late Night Entry?"
                            labelNp="राति ढिलो आउन मिल्छ?"
                            icon={MoonIcon}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="babyAllowed"
                        render={({ field }) => (
                          <TriToggle
                            label="Baby / Children Allowed?"
                            labelNp="बच्चा राख्न मिल्छ?"
                            icon={Baby}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Gate closing time */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Gate Closing Time / गेट कति बजे बन्द?{" "}
                        <span className="text-slate-400 font-normal text-xs">
                          (Optional)
                        </span>
                      </p>
                      <FormField
                        control={form.control}
                        name="gateClosingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Clock
                                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                                  aria-hidden
                                />
                                <Input
                                  type="time"
                                  className="h-11 pl-10 rounded-xl border-slate-200"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Sunlight */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Sunlight & Facilities / घाम र सुविधाहरू
                      </p>
                      <FormField
                        control={form.control}
                        name="hasSunlight"
                        render={({ field }) => (
                          <TriToggle
                            label="Sunlight enters room?"
                            labelNp="कोठामा घाम लाग्छ?"
                            icon={SunIcon}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hasClothDryingArea"
                        render={({ field }) => (
                          <TriToggle
                            label="Clothes drying area?"
                            labelNp="लुगा सुकाउने ठाउँ?"
                            icon={Shirt}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Problems */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Existing Problems / कुनै समस्या?{" "}
                        <span className="text-slate-400 font-normal text-xs">
                          (Optional)
                        </span>
                      </p>
                      <FormField
                        control={form.control}
                        name="existingProblems"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Dampness, narrow stairs... / छैन"
                                className="rounded-xl border-slate-200 resize-none min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Other rules */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Other Rules / अन्य नियमहरू{" "}
                        <span className="text-slate-400 font-normal text-xs">
                          (Optional)
                        </span>
                      </p>
                      <FormField
                        control={form.control}
                        name="otherRules"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. No loud music after 9PM..."
                                className="rounded-xl border-slate-200 resize-none min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Owner community */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Owner's Community / घरधनीको समुदाय
                      </p>
                      <FormField
                        control={form.control}
                        name="ownerCommunity"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                              role="radiogroup"
                            >
                              {COMMUNITY_OPTIONS.map((opt) => {
                                const isMuted = communityIsMuted(opt.value);
                                const isSelected =
                                  field.value === opt.value ||
                                  (opt.value === "Other" &&
                                    showOwnerCommunityInput);
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => {
                                      field.onChange(opt.value);
                                      setShowOwnerCommunityInput(
                                        opt.value === "Other",
                                      );
                                    }}
                                    className={cn(
                                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                                      isSelected
                                        ? "border-amber-500 bg-amber-50 text-amber-800"
                                        : isMuted
                                          ? "border-slate-100 bg-slate-50 text-slate-300 opacity-40 cursor-not-allowed"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-amber-200",
                                    )}
                                    disabled={isMuted}
                                  >
                                    <span>{opt.labelEn}</span>
                                    <span className="text-[10px] opacity-70">
                                      {opt.labelNp}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </FormItem>
                        )}
                      />
                      {showOwnerCommunityInput && (
                        <Input
                          placeholder="Please specify / आफ्नो समुदाय लेख्नुहोस्"
                          value={ownerCommunityCustom}
                          onChange={(e) =>
                            setOwnerCommunityCustom(e.target.value)
                          }
                          className="h-11 rounded-xl border-slate-200"
                        />
                      )}
                    </section>

                    <Separator />

                    {/* Community welcome */}
                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Community Preference for Tenants{" "}
                        <span className="text-slate-400 font-normal text-xs">
                          (Optional)
                        </span>
                      </p>
                      <FormField
                        control={form.control}
                        name="communityPreference"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                {
                                  v: "All community are welcome",
                                  en: "All community are welcome ✅",
                                  np: "सबैलाई स्वागत",
                                },
                                {
                                  v: "",
                                  en: "Specific preference",
                                  np: "विशेष प्राथमिकता",
                                },
                              ].map((opt) => (
                                <button
                                  key={opt.v}
                                  type="button"
                                  onClick={() => field.onChange(opt.v)}
                                  className={cn(
                                    "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer text-left",
                                    field.value === opt.v
                                      ? "border-green-500 bg-green-50 text-green-800"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-green-200",
                                  )}
                                >
                                  <span>{opt.en}</span>
                                  <span className="text-[10px] opacity-70">
                                    {opt.np}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {field.value !== "All community are welcome" && (
                              <Textarea
                                placeholder="e.g. Hindu family preferred / हिन्दू परिवार मात्र"
                                className="mt-2 rounded-xl border-slate-200 resize-none min-h-[70px]"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            )}
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Highway Distance */}
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          🛣️ Distance from Highway / राजमार्गबाट दूरी
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          मिटरमा लेख्नुहोस् — Enter in metres (Optional)
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="distanceHighwayM"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  step="10"
                                  placeholder="e.g. 200"
                                  className="h-12 pr-20 rounded-xl border-slate-200 text-base"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                                <span
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none"
                                  aria-hidden
                                >
                                  metres
                                </span>
                              </div>
                            </FormControl>
                            {field.value !== null &&
                              field.value !== undefined && (
                                <p className="text-xs text-slate-500 mt-1">
                                  ≈{" "}
                                  {field.value >= 1000
                                    ? `${(field.value / 1000).toFixed(2)} km`
                                    : `${field.value} m`}{" "}
                                  · राजमार्गबाट
                                </p>
                              )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500">
                          💡 <strong>Tip:</strong> 1 km = 1000 m &nbsp;·&nbsp;
                          नजिक भए सानो नम्बर, टाढा भए ठूलो
                        </p>
                      </div>
                    </section>
                  </div>
                )}

                {/* ══ PHOTOS ══ */}
                {activeTab === "photos" && (
                  <div className="space-y-4">
                    <SectionHeader
                      icon={ImageIcon}
                      title="Room Photos / कोठाका फोटोहरू"
                      subtitle="Manage existing and add new photos"
                    />

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold">
                        {totalImages}/10 photos total · {existingImages.length}{" "}
                        existing · {newImageFiles.length} new
                      </p>
                    </div>

                    {/* Existing images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Existing Photos / हालका फोटोहरू
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {existingImages.map((img, i) => (
                            <div
                              key={img}
                              className="relative group aspect-square"
                            >
                              <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-red-300 transition-colors">
                                <img
                                  src={resolveImageUrl(img)}
                                  alt={`Existing room photo ${i + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/placeholder-image.jpg";
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(img)}
                                aria-label={`Remove photo ${i + 1}`}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                              </button>
                              <div className="absolute bottom-1.5 left-1.5">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0"
                                >
                                  #{i + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add new images */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      aria-label="Add new photos"
                    />

                    {totalImages < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
                        aria-label="Add new photos"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                          <Plus className="w-6 h-6 text-primary" aria-hidden />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700">
                            Add new photos / नयाँ फोटो थप्नुहोस्
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {totalImages}/10 · Max 10MB each
                          </p>
                        </div>
                      </button>
                    )}

                    {uploadProgress > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Processing...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {newImagePreviews.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          New Photos / नयाँ फोटोहरू
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {newImagePreviews.map((preview, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group aspect-square"
                            >
                              <div className="w-full h-full rounded-xl overflow-hidden border-2 border-green-200 group-hover:border-red-300 transition-colors">
                                <img
                                  src={preview}
                                  alt={`New photo ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewImage(i)}
                                aria-label={`Remove new photo ${i + 1}`}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                              >
                                <XCircle className="w-4 h-4" aria-hidden />
                              </button>
                              <div className="absolute top-1.5 left-1.5">
                                <Badge className="text-[10px] px-1.5 py-0.5 bg-green-500 text-white border-0">
                                  New
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {removedImages.length > 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        ⚠ {removedImages.length} photo(s) will be removed on
                        save.
                      </p>
                    )}
                  </div>
                )}

                {/* ══ CONTACT ══ */}
                {activeTab === "contact" && (
                  <div className="space-y-4">
                    <SectionHeader
                      icon={User}
                      title="Contact Information / सम्पर्क जानकारी"
                      subtitle="How can tenants reach the owner?"
                    />

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800 font-semibold">
                        🔒 Shown only after room unlock / अनलक पछि मात्र देखिन्छ
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" aria-hidden /> Owner
                            Name / घरधनीको नाम{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Ram Prasad Sharma"
                              {...field}
                              className="h-12 rounded-xl border-slate-200"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Full name / पुरा नाम
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
                          <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" aria-hidden /> Owner
                            Phone / घरधनीको फोन{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                                aria-hidden
                              />
                              <Input
                                type="tel"
                                inputMode="tel"
                                placeholder="+977 98XXXXXXXX"
                                className="h-12 pl-10 rounded-xl border-slate-200"
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
                          <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                            <Instagram className="w-4 h-4" aria-hidden /> TikTok
                            URL
                            {isAdmin && (
                              <Badge
                                variant="outline"
                                className="text-xs border-red-200 text-red-600"
                              >
                                Admin
                              </Badge>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://tiktok.com/@username"
                              {...field}
                              className="h-12 rounded-xl border-slate-200 focus:border-primary"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            TikTok मा घरको भिडियो शेयर गर्नुहोस् (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </main>

      {/* ── Sticky Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl"
        aria-label="Form navigation"
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTab("prev")}
              disabled={currentTabIdx === 0}
              aria-label="Previous section"
              className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>

            <div
              className="flex-1 flex items-center gap-1.5 justify-center"
              role="tablist"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    activeTab === tab.value
                      ? "w-6 bg-primary"
                      : "w-2 bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>

            {currentTabIdx === TABS.length - 1 ? (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="w-4 h-4" aria-hidden />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTab("next")}
                className="flex items-center gap-1 px-4 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
