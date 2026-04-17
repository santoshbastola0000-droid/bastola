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
  Droplets,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Wifi,
  Sun,
  Moon,
  Instagram,
  Plus,
  ChevronRight,
  Clock,
  Heart,
  Cigarette,
  Wine,
  Baby,
  Moon as MoonIcon,
  UtensilsCrossed,
  Shirt,
  Sun as SunIcon,
  Edit3,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RoomCategory,
  TenantType,
  GenderPreference,
  ImageWithCategory,
} from "@/types/room.types";
import { cn, formatTimeForDisplay, formatTimeForInput } from "@/lib/utils";
import { useCreateRoomMutation } from "@/http/mutations/room.mutation";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import MapPicker from "@/components/admin/rooms/MapPicker";
import {
  DEFAULT_LAT,
  DEFAULT_LNG,
  FAILURETOAST,
  SUCCESSTOAST,
} from "@/lib/constants/app.constants";
import {
  amenitiesList,
  COMMUNITY_OPTIONS,
  eveningSlots,
  eveningSlotValues,
  extractLocationName,
  morningSlots,
  morningSlotValues,
  TABS,
  TENANT_TYPE_OPTIONS,
  WATER_SUPPLY_OPTIONS,
} from "@/lib/room-utils";

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
  <div className="mb-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
    <p className="text-sm text-slate-500 ml-13">{subtitle}</p>
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
      {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
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
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        aria-label={`Decrease ${label}`}
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
        className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        aria-label={`Increase ${label}`}
      >
        <Plus className="w-4 h-4" />
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
        {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
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
            aria-label={`${label}: ${opt.label}`}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.labelNp}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CreateRoomPage() {
  const router = useRouter();
  const createRoomMutation = useCreateRoomMutation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<ImageWithCategory[]>([]);
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const [selectedTenantTypes, setSelectedTenantTypes] = useState<TenantType[]>(
    [],
  );
  const [ownerCommunityCustom, setOwnerCommunityCustom] = useState("");
  const [showOwnerCommunityInput, setShowOwnerCommunityInput] = useState(false);
  const [gateClosingTimeDisplay, setGateClosingTimeDisplay] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { user } = useUserRole();
  const isAdmin = user?.role === UserRole.ADMIN;

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

  const formErrors = form.formState.errors;
  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;
  const ownerLivesInHouse = form.watch("ownerLivesInHouse");
  const gateClosingTimeRaw = form.watch("gateClosingTime");

  useEffect(() => {
    if (gateClosingTimeRaw) {
      setGateClosingTimeDisplay(formatTimeForDisplay(gateClosingTimeRaw));
    } else {
      setGateClosingTimeDisplay("");
    }
  }, [gateClosingTimeRaw]);

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case "basic":
        return !!(
          form.getValues("title") &&
          form.getValues("description") &&
          form.getValues("price")
        );
      case "location":
        return isValidLocation;
      case "details":
        return !!form.getValues("roomArea");
      case "amenities":
        return selectedAmenities.length > 0;
      case "preferences":
        return true;
      case "photos":
        return images.length > 0;
      case "contact":
        return !!(
          form.getValues("contactPhone") && form.getValues("contactPerson")
        );
      default:
        return false;
    }
  };

  const getMissingRequiredTabs = (): string[] => {
    return TABS.filter((tab) => tab.required && !getTabStatus(tab.value)).map(
      (tab) => tab.value,
    );
  };

  // Water supply effect
  useEffect(() => {
    if (waterSupplyType === "24-hour") {
      form.setValue("waterSupplyTimings.notes", "TYPE:24-hour");
      form.setValue("waterSupplyTimings.morning", "00:00-24:00");
      form.setValue("waterSupplyTimings.evening", "00:00-24:00");
    } else if (waterSupplyType === "alternate-days") {
      form.setValue("waterSupplyTimings.notes", "TYPE:alternate-days");
    } else if (waterSupplyType === "tanker") {
      form.setValue("waterSupplyTimings.notes", "TYPE:tanker");
    } else if (waterSupplyType === "morning-only") {
      form.setValue("waterSupplyTimings.notes", "TYPE:morning-only");
      form.setValue("waterSupplyTimings.evening", "");
    } else if (waterSupplyType === "evening-only") {
      form.setValue("waterSupplyTimings.notes", "TYPE:evening-only");
      form.setValue("waterSupplyTimings.morning", "");
    } else {
      form.setValue("waterSupplyTimings.notes", "TYPE:morning-evening");
    }
  }, [waterSupplyType, form]);

  // Scroll active tab into view on mobile
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
    toast.success("📍 Location selected!", {
      description: extractedName,
      duration: 2500,
    });
  };

  // ── Simplified image upload: single input, up to 10 total ─────────────────
  const processImageFiles = (files: File[]) => {
    const invalid = files.filter((f) => !f.type.startsWith("image/"));
    if (invalid.length > 0) {
      toast.error("Only image files are allowed (JPEG, PNG, WEBP)");
      return;
    }

    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.warning(
        `${oversized.length} file(s) skipped — each must be under 10 MB`,
      );
    }

    const remaining = 10 - images.length;
    if (remaining <= 0) {
      toast.error("Maximum 10 photos allowed. Remove some to add more.");
      return;
    }

    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) {
      toast.warning(
        `Only ${remaining} more photo(s) can be added (max 10 total). ${valid.length - remaining} skipped.`,
      );
    }

    const newImages: ImageWithCategory[] = toAdd.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      category: "Room",
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (toAdd.length > 0) {
      toast.success(
        `${toAdd.length} photo(s) added! (${images.length + toAdd.length}/10)`,
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processImageFiles(files);
    // Reset input so same files can be re-selected if removed
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processImageFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const navigateTab = (direction: "next" | "prev") => {
    const idx = TABS.findIndex((t) => t.value === activeTab);
    if (direction === "next") {
      if (idx < TABS.length - 1) {
        if (TABS[idx].required && !getTabStatus(activeTab)) {
          toast.warning(
            `Please complete the ${TABS[idx].label} section first`,
            { duration: 3000 },
          );
          return;
        }
        setActiveTab(TABS[idx + 1].value);
      }
    }
    if (direction === "prev" && idx > 0) {
      setActiveTab(TABS[idx - 1].value);
    }
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    // Validate all required fields and show friendly toasts for each missing section
    const missingTabs = getMissingRequiredTabs();
    if (missingTabs.length > 0) {
      const firstMissing = missingTabs[0];
      const tab = TABS.find((t) => t.value === firstMissing);

      // Show a toast for EACH missing required section
      missingTabs.forEach((tabValue, i) => {
        const t = TABS.find((x) => x.value === tabValue);
        if (!t) return;
        let description = "";
        switch (tabValue) {
          case "basic":
            description = "Title, description, and price are required.";
            break;
          case "location":
            description = "Please pin your room on the map.";
            break;
          case "details":
            description = "Room area (m²) is required.";
            break;
          case "amenities":
            description = "Select at least one amenity.";
            break;
          case "photos":
            description = "Upload at least one photo.";
            break;
          case "contact":
            description = "Owner name and phone number are required.";
            break;
        }
        setTimeout(() => {
          toast.error(`⚠️ ${t.label} incomplete`, {
            description,
            duration: 5000,
            action: {
              label: "Go there",
              onClick: () => setActiveTab(tabValue),
            },
          });
        }, i * 400);
      });

      setActiveTab(firstMissing);
      return;
    }

    values.amenities = selectedAmenities;
    values.tenantTypes = selectedTenantTypes;

    const formData = new FormData();
    const append = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      formData.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
    };

    append("title", values.title);
    append("description", values.description);
    append("category", values.category);
    append("price", values.price);
    append("address", values.address);
    append("bathroomCapacity", values.bathroomCapacity);
    append("floorNumber", values.floorNumber);
    append("ownerLivesInHouse", values.ownerLivesInHouse);
    if (
      values.ownerFloorNumber !== null &&
      values.ownerFloorNumber !== undefined
    ) {
      formData.append("ownerFloorNumber", String(values.ownerFloorNumber));
    }
    append("totalHouseCapacity", values.totalHouseCapacity);
    append("rentedRoomsCount", values.rentedRoomsCount);
    append("currentOccupants", values.currentOccupants);
    append("waterSupplyTimings", values.waterSupplyTimings);
    append("allowsWomen", values.allowsWomen);
    append("roomCapacity", values.roomCapacity);
    append("roomArea", values.roomArea);
    append("contactPerson", values.contactPerson);
    append("contactPhone", values.contactPhone);
    append("location", values.location);
    if (values.tiktokUrl) append("tiktokUrl", values.tiktokUrl);
    formData.append("amenities", JSON.stringify(selectedAmenities));

    if (selectedTenantTypes.length > 0)
      formData.append("tenantTypes", JSON.stringify(selectedTenantTypes));
    if (values.genderPreference)
      append("genderPreference", values.genderPreference);

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
        formData.append(field, String(val));
      }
    });

    if (values.otherRules) append("otherRules", values.otherRules);
    if (values.gateClosingTime)
      append("gateClosingTime", values.gateClosingTime);
    if (values.existingProblems)
      append("existingProblems", values.existingProblems);

    const finalCommunity =
      values.ownerCommunity === "Other"
        ? ownerCommunityCustom
        : values.ownerCommunity;
    if (finalCommunity) append("ownerCommunity", finalCommunity);
    if (values.communityPreference)
      append("communityPreference", values.communityPreference);
    if (
      values.distanceHighwayM !== null &&
      values.distanceHighwayM !== undefined
    ) {
      formData.append("distanceHighwayM", String(values.distanceHighwayM));
    }

    images.forEach((img) => formData.append("images", img.file));

    const tid = toast.loading("Creating room listing...");
    createRoomMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.dismiss(tid);
          toast.success("🎉 Room listed successfully!", {
            duration: 4000,
            style: { background: SUCCESSTOAST, color: "#fff" },
          });
          router.push(
            isAdmin ? "/admin/dashboard/rooms" : "/user/dashboard/rooms",
          );
        },
        onError: (error: unknown) => {
          toast.dismiss(tid);
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            err?.response?.data?.message ||
              "Failed to create room. Please try again.",
            {
              duration: 5000,
              style: { background: FAILURETOAST, color: "#fff" },
            },
          );
        },
      },
    );
  };

  const currentTabIdx = TABS.findIndex((t) => t.value === activeTab);
  const requiredCompletedCount = TABS.filter(
    (t) => t.required && getTabStatus(t.value),
  ).length;
  const requiredTotal = TABS.filter((t) => t.required).length;

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
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
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
                  <span className="text-slate-700 font-medium">Add Room</span>
                </nav>
                <h1 className="text-base md:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2
                    className="w-4 h-4 text-primary flex-shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">List Your Room</span>
                </h1>
              </div>
            </div>
            <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {requiredCompletedCount}/{requiredTotal} required done
              </span>
            </div>
          </div>

          <Progress
            value={(requiredCompletedCount / requiredTotal) * 100}
            className="mt-3 h-1.5 bg-slate-100"
            aria-label="Form completion progress"
          />

          {/* Scrollable tab bar */}
          <div
            ref={tabsRef}
            className="flex gap-1 mt-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
            role="tablist"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isDone = getTabStatus(tab.value);
              const isRequired = tab.required;
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
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : isDone
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : isRequired
                          ? "bg-red-50 text-red-500 border border-red-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {isDone && !isActive ? (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-green-600"
                      aria-hidden
                    />
                  ) : (
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {tab.label}
                  {isRequired && !isDone && !isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-red-500"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Form Body ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 md:px-6 pb-40">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
                  <div className="space-y-5">
                    <SectionHeader
                      icon={Home}
                      title="Basic Information"
                      subtitle="Tell us about your room — आधारभूत जानकारी"
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-base">
                            Room Title / कोठाको शीर्षक{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Cozy Room with AC & WiFi near Lakeside"
                              {...field}
                              className={cn(
                                "h-12 text-base rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 px-4",
                                formErrors.title && "border-red-400",
                              )}
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
                          <FormLabel className="text-slate-700 font-semibold text-base">
                            Description / विवरण{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your room — छिमेक, नजिकैका सुविधाहरू, र कोठाको विशेषता उल्लेख गर्नुहोस्..."
                              className={cn(
                                "min-h-[120px] text-base rounded-xl border-slate-200 focus:border-primary resize-none p-4",
                                formErrors.description && "border-red-400",
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            At least 10 characters — कम्तीमा १० अक्षर
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold text-base mb-2 block">
                              Room Type / कोठाको प्रकार{" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer px-4 bg-white hover:border-primary/50 transition-all">
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl max-h-[400px]">
                                {Object.values(RoomCategory).map((cat) => {
                                  let icon = "";
                                  switch (cat) {
                                    case RoomCategory.FLAT:
                                      icon = "🏢";
                                      break;
                                    case RoomCategory.SINGLE:
                                      icon = "🚪";
                                      break;
                                    case RoomCategory.APARTMENT:
                                      icon = "🏙️";
                                      break;
                                    case RoomCategory.SHARED:
                                      icon = "👥";
                                      break;
                                    case RoomCategory.DOUBLE:
                                      icon = "👥👥";
                                      break;
                                    case RoomCategory.HOUSE:
                                      icon = "🏠";
                                      break;
                                    case RoomCategory.ATTACHED_BATHROOM:
                                      icon = "🚽";
                                      break;
                                    case RoomCategory.SHUTTER:
                                      icon = "🚪🏪";
                                      break;
                                    case RoomCategory.HOTEL:
                                      icon = "🏨";
                                      break;
                                    case RoomCategory.OFFICE_SPACE:
                                      icon = "💼";
                                      break;
                                    case RoomCategory.HOSTEL:
                                      icon = "🏛️";
                                      break;
                                    default:
                                      icon = "🏠";
                                  }
                                  return (
                                    <SelectItem
                                      key={cat}
                                      value={cat}
                                      className="capitalize cursor-pointer py-3 text-base px-3 hover:bg-primary/5 focus:bg-primary/80 transition-all"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl min-w-[32px]">
                                          {icon}
                                        </span>
                                        <span className="font-medium">
                                          {cat}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs mt-2 text-amber-600 flex items-center gap-1">
                              <span>⚠️</span>
                              <span>
                                Select carefully / ध्यानपूर्वक चयन गर्नुहोस्
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold text-base">
                              Monthly Rent / मासिक भाडा (रु.){" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span
                                  className="absolute left-4 md:top-2/5 top-3 md:-translate-y-1/2 text-slate-400 font-bold text-base pointer-events-none select-none"
                                  aria-hidden
                                >
                                  रु.
                                </span>
                                <Input
                                  type="number"
                                  placeholder="8000"
                                  inputMode="numeric"
                                  className={cn(
                                    "h-12 pl-15 text-base rounded-xl border-slate-200 focus:border-primary px-8",
                                    formErrors.price && "border-red-400",
                                  )}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ══ LOCATION ══ */}
                {activeTab === "location" && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={MapPin}
                      title="Location & Map"
                      subtitle="Pin your room on the map — नक्सामा स्थान चिन्ह लगाउनुहोस्"
                    />

                    {!isValidLocation && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          Location required / स्थान आवश्यक
                        </AlertTitle>
                        <AlertDescription>
                          Click on the map below to set the exact location.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isValidLocation && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          aria-hidden
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-700">
                            Location Set / स्थान सेट भयो
                          </p>
                          <p className="text-xs text-green-600 truncate">
                            {form.getValues("location.formattedAddress") ||
                              `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700 flex-shrink-0"
                        >
                          ✓ Pinned
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

                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Address Details / ठेगानाको विवरण
                      </p>

                      <FormField
                        control={form.control}
                        name="location.formattedAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5" aria-hidden /> Full
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
                                className="rounded-xl border-slate-200 resize-y min-h-[80px] text-base p-4 focus:border-primary"
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
                                  className="h-11 rounded-xl border-slate-200 px-4"
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
                              <FormLabel className="text-sm text-slate-600">
                                City / शहर
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Pokhara"
                                  {...field}
                                  className="h-11 rounded-xl border-slate-200 px-4"
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
                              <FormLabel className="text-sm text-slate-600">
                                Province / प्रदेश
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Gandaki"
                                  {...field}
                                  className="h-11 rounded-xl border-slate-200 px-4"
                                />
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
                              <FormLabel className="text-sm text-slate-600">
                                Postal Code / हुलाक नम्बर
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. 33700"
                                  {...field}
                                  className="h-11 rounded-xl border-slate-200 px-4"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                                  className="h-11 pr-20 rounded-xl border-slate-200 focus:border-primary px-4"
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ══ DETAILS ══ */}
                {activeTab === "details" && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={Bed}
                      title="Room Details"
                      subtitle="Capacity, floor, and house rules — क्षमता र नियमहरू"
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
                            description="How many people can sleep here"
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
                            description="How many people share"
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
                            description="0 = Ground floor"
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
                            description="People living right now"
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
                            <FormLabel className="text-slate-700 font-semibold text-base">
                              Room Area / कोठाको क्षेत्रफल (m²){" "}
                              <span className="text-red-500" aria-hidden>
                                *
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min="1"
                                  step="0.5"
                                  placeholder="e.g. 30"
                                  className={cn(
                                    "h-11 pr-14 text-base rounded-xl border-slate-200 focus:border-primary px-4",
                                    formErrors.roomArea && "border-red-400",
                                  )}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const parsed = parseFloat(raw);
                                      if (!isNaN(parsed)) {
                                        field.onChange(parsed);
                                      }
                                    }
                                  }}
                                />
                                <span
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none"
                                  aria-hidden
                                >
                                  m²
                                </span>
                              </div>
                            </FormControl>
                            {formErrors.roomArea && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Please enter the room size in square metres
                                (e.g. 25)
                              </p>
                            )}
                            {!formErrors.roomArea && (
                              <FormDescription className="text-xs">
                                Enter the floor area in square metres — वर्ग
                                मिटरमा क्षेत्रफल लेख्नुहोस्
                              </FormDescription>
                            )}
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
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                              waterSupplyType === opt.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                            )}
                            aria-pressed={waterSupplyType === opt.value}
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
                                Morning Time / बिहान
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
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
                                Evening Time / साँझ
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
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
                              Additional Notes / थप टिप्पणी (optional)
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
                                Owner lives on which floor? / घरधनी कुन तलामा
                                बस्छन्?
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
                  <div className="space-y-5">
                    <SectionHeader
                      icon={Wifi}
                      title="Amenities / सुविधाहरू"
                      subtitle="Select everything available in your room"
                    />

                    {selectedAmenities.length === 0 && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          Select at least one amenity / कम्तीमा एउटा सुविधा चयन
                          गर्नुहोस्
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          Listings with amenities get significantly more views.
                          Don't skip this!
                        </AlertDescription>
                      </Alert>
                    )}

                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      role="group"
                      aria-label="Amenities selection"
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
                                ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
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

                    {selectedAmenities.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          aria-hidden
                        />
                        <p className="text-sm font-semibold text-green-700">
                          {selectedAmenities.length} amenities selected /{" "}
                          {selectedAmenities.length} सुविधाहरू चयन भयो
                        </p>
                      </div>
                    )}
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

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Who is your ideal tenant? / आदर्श भाडाटारु को हो?
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Multiple choice / बहु छनोट — Optional
                        </p>
                      </div>
                      <div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                        role="group"
                        aria-label="Tenant type selection"
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

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Lifestyle Rules / जीवनशैली नियमहरू
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Yes / No / N/A — हो / होइन / थाहा छैन
                        </p>
                      </div>

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
                            labelNp="राँगाको मासु अनुमति?"
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
                            labelNp="सुँगुरको मासु अनुमति?"
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
                            label="Late Night Entry Allowed?"
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

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Gate Closing Time / गेट कति बजे बन्द हुन्छ?
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Optional — Optional
                        </p>
                      </div>
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
                                  className="h-11 pl-10 rounded-xl border-slate-200 focus:border-primary cursor-pointer"
                                  value={
                                    field.value
                                      ? formatTimeForInput(field.value)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    field.onChange(rawValue);
                                    setGateClosingTimeDisplay(
                                      formatTimeForDisplay(rawValue),
                                    );
                                  }}
                                />
                              </div>
                            </FormControl>
                            {gateClosingTimeDisplay && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />{" "}
                                {gateClosingTimeDisplay} मा गेट बन्द हुन्छ
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Sunlight & Facilities / घाम र सुविधाहरू
                      </p>
                      <FormField
                        control={form.control}
                        name="hasSunlight"
                        render={({ field }) => (
                          <TriToggle
                            label="Does sunlight enter the room?"
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
                            label="Is there a clothes drying area?"
                            labelNp="लुगा सुकाउने ठाउँ छ?"
                            icon={Shirt}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Existing Problems / कुनै समस्या छ?
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          कोठा/flat/apartment मा कुनै समस्या छ कि छैन? —
                          Optional
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="existingProblems"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Dampness in one wall, narrow parking... / छैन (No problems)"
                                className="rounded-xl border-slate-200 resize-none min-h-[80px] focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">
                        Other Rules / अन्य नियमहरू
                      </p>
                      <FormField
                        control={form.control}
                        name="otherRules"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. No loud music after 9PM, visitors must leave by 8PM... / अन्य कुनै नियम भए लेख्नुहोस्"
                                className="rounded-xl border-slate-200 resize-none min-h-[80px] focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Owner's Community / घरधनीको समुदाय
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Owner कुन समुदायको हुनुहुन्छ? — Required field
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="ownerCommunity"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                              role="radiogroup"
                              aria-label="Owner community"
                            >
                              {COMMUNITY_OPTIONS.map((opt) => {
                                const isMuted = communityIsMuted(opt.value);
                                const isSelected = field.value === opt.value;
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(showOwnerCommunityInput ||
                        form.watch("ownerCommunity") === "Other") && (
                        <Input
                          placeholder="Please specify your community / आफ्नो समुदाय लेख्नुहोस्"
                          value={ownerCommunityCustom}
                          onChange={(e) => {
                            setOwnerCommunityCustom(e.target.value);
                            form.setValue("ownerCommunity", "Other");
                          }}
                          className="h-11 rounded-xl border-slate-200 focus:border-primary"
                        />
                      )}
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Community Preference for Tenants
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          के जुनसुकै समुदायको मानिस बस्न मिल्छ त? — Optional
                        </p>
                      </div>
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
                                  np: "सबैलाई स्वागत छ",
                                },
                                {
                                  v: "custom",
                                  en: "Specific preference",
                                  np: "विशेष प्राथमिकता",
                                },
                              ].map((opt) => (
                                <button
                                  key={opt.v}
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      opt.v === "custom" ? "" : opt.v,
                                    )
                                  }
                                  className={cn(
                                    "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer text-left",
                                    field.value === opt.v ||
                                      (opt.v === "custom" &&
                                        field.value !==
                                          "All community are welcome" &&
                                        field.value !== "")
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
                                className="mt-2 rounded-xl border-slate-200 resize-none min-h-[70px] focus:border-primary"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>
                  </div>
                )}

                {/* ══ PHOTOS ══ */}
                {activeTab === "photos" && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={ImageIcon}
                      title="Room Photos / कोठाका फोटोहरू"
                      subtitle="Good photos attract 3x more tenants · राम्रो फोटोले ३ गुणा बढी भाडाटारु ल्याउँछ"
                    />

                    {/* What photos to include guidance */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                      <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" aria-hidden />
                        Please upload photos of the following:
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1 ml-1">
                        <li className="flex items-center gap-2">
                          <span aria-hidden>🛏️</span> Room interior (multiple
                          angles recommended)
                        </li>
                        <li className="flex items-center gap-2">
                          <span aria-hidden>🚽</span> Toilet
                        </li>
                        <li className="flex items-center gap-2">
                          <span aria-hidden>🚿</span> Bathroom / shower area
                        </li>
                        <li className="flex items-center gap-2">
                          <span aria-hidden>🏘️</span> Outside / building
                          exterior
                        </li>
                      </ul>
                      <p className="text-xs text-blue-600 mt-1">
                        Up to 10 photos total · प्रत्येक फोटो अधिकतम 10MB · JPEG
                        / PNG / WEBP
                      </p>
                    </div>

                    {images.length === 0 && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          At least one photo required / कम्तीमा एउटा फोटो आवश्यक
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          Rooms with photos get 3x more inquiries. Please upload
                          at least one.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* ── Single unified upload zone ── */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        aria-label="Upload room photos"
                        onChange={handleFileInputChange}
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Upload photos. ${images.length} of 10 uploaded.`}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none",
                          isDragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : images.length >= 10
                              ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                              : "border-slate-300 bg-white hover:border-primary hover:bg-primary/3",
                        )}
                      >
                        <div
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                            isDragging ? "bg-primary/20" : "bg-slate-100",
                          )}
                        >
                          <Upload
                            className={cn(
                              "w-7 h-7",
                              isDragging ? "text-primary" : "text-slate-400",
                            )}
                            aria-hidden
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700">
                            {images.length >= 10
                              ? "Maximum photos reached (10/10)"
                              : isDragging
                                ? "Drop photos here!"
                                : "Click to upload or drag & drop"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {images.length}/10 photos · Select multiple at once
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Photo grid ── */}
                    {images.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">
                            Uploaded Photos / अपलोड भएका फोटोहरू
                          </p>
                          <Badge
                            variant={
                              images.length >= 10 ? "default" : "secondary"
                            }
                            className={
                              images.length >= 10
                                ? "bg-amber-500 text-white"
                                : ""
                            }
                          >
                            {images.length}/10
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {images.map((img, idx) => (
                            <motion.figure
                              key={img.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group aspect-square"
                            >
                              <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-primary transition-colors">
                                <img
                                  src={img.preview}
                                  alt={`Room photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                aria-label={`Remove photo ${idx + 1}`}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                              >
                                <XCircle className="w-4 h-4" aria-hidden />
                              </button>
                              {idx === 0 && (
                                <div className="absolute bottom-1.5 left-1.5">
                                  <Badge className="text-[10px] px-1.5 py-0.5 bg-primary text-white border-0">
                                    Main
                                  </Badge>
                                </div>
                              )}
                            </motion.figure>
                          ))}

                          {/* Add more tile (if under limit) */}
                          {images.length < 10 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              aria-label="Add more photos"
                              className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-all cursor-pointer bg-slate-50 hover:bg-primary/5"
                            >
                              <Plus className="w-6 h-6" aria-hidden />
                              <span className="text-[10px] font-semibold">
                                Add more
                              </span>
                            </button>
                          )}
                        </div>

                        {images.length > 0 && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                            <CheckCircle2
                              className="w-4 h-4 text-green-600 flex-shrink-0"
                              aria-hidden
                            />
                            <p className="text-sm font-semibold text-green-700">
                              {images.length} photo
                              {images.length !== 1 ? "s" : ""} ready to upload
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ CONTACT ══ */}
                {activeTab === "contact" && (
                  <div className="space-y-5">
                    <SectionHeader
                      icon={User}
                      title="Contact Information / सम्पर्क जानकारी"
                      subtitle="How can tenants reach the owner?"
                    />

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800 font-semibold">
                        🔒 This info is shown only after room unlock
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Tenants pay a service charge to see the owner's name and
                        phone number.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-base flex items-center gap-1.5">
                            <User className="w-4 h-4" aria-hidden /> Owner Name
                            / घरधनीको नाम{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Ram Prasad Sharma"
                              {...field}
                              className={cn(
                                "h-12 text-base rounded-xl border-slate-200 focus:border-primary px-4",
                                formErrors.contactPerson && "border-red-400",
                              )}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Full name of the owner / घरधनीको पुरा नाम
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
                          <FormLabel className="text-slate-700 font-semibold text-base flex items-center gap-1.5">
                            <Phone className="w-4 h-4" aria-hidden /> Owner
                            Phone / घरधनीको फोन{" "}
                            <span className="text-red-500" aria-hidden>
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="tel"
                                inputMode="tel"
                                placeholder="+977 98XXXXXXXX"
                                className={cn(
                                  "h-12 text-base rounded-xl border-slate-200 focus:border-primary px-4",
                                  formErrors.contactPhone && "border-red-400",
                                )}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Tenants will call this number / यस नम्बरमा सम्पर्क
                            गर्नेछन्
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isAdmin && (
                      <>
                        <Separator />
                        <FormField
                          control={form.control}
                          name="tiktokUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-semibold flex items-center gap-2 text-base">
                                <Instagram className="w-4 h-4" aria-hidden />{" "}
                                TikTok URL{" "}
                                <Badge variant="outline" className="text-xs">
                                  Admin
                                </Badge>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://tiktok.com/@username"
                                  {...field}
                                  className="h-12 text-base rounded-xl border-slate-200 focus:border-primary px-4"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </main>

      {/* ── Sticky Bottom Navigation ── */}
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
                      : getTabStatus(tab.value)
                        ? "w-2 bg-green-400"
                        : tab.required
                          ? "w-2 bg-red-300"
                          : "w-2 bg-slate-200",
                  )}
                />
              ))}
            </div>

            {currentTabIdx === TABS.length - 1 ? (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createRoomMutation.isPending}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                {createRoomMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="w-4 h-4" aria-hidden />
                )}
                {createRoomMutation.isPending ? "Listing..." : "List Room"}
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
