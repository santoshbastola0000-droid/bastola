"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  XCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion as m } from "framer-motion";
import { RoomCategory, TenantType, GenderPreference } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { roomService } from "@/http/services/room.service";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import {
  API_BASE_URL,
  COMMUNITY_OPTIONS,
  DEFAULT_LAT,
  DEFAULT_LNG,
  TABS,
} from "@/lib/constants/app.constants";
import { detectWaterType } from "@/lib/room-utils";
import { PreferencesTab } from "./tabs/PreferencesTab";
import { ContactTab } from "./tabs/ContactTab";
import { AmenitiesTab } from "./tabs/Amenitiestab";
import { DetailsTab } from "./tabs/DetailsTab";
import { BasicTab } from "./tabs/BasicTab";
import { LocationTab } from "./tabs/LocationTab";

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const { user } = useUserRole();
  const isAdmin = user?.role === UserRole.ADMIN;
  const tabsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTenantTypes, setSelectedTenantTypes] = useState<TenantType[]>(
    [],
  );
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const [ownerCommunityCustom, setOwnerCommunityCustom] = useState("");
  const [showOwnerCommunityInput, setShowOwnerCommunityInput] = useState(false);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

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

  // ── Water supply side-effects ─────────────────────────────────────────────
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

  // ── Scroll active tab into view ───────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentTabIdx = TABS.findIndex((t) => t.value === activeTab);
  const totalPhotos = existingImages.length + newImageFiles.length;

  const navigateTab = (direction: "next" | "prev") => {
    if (direction === "next" && currentTabIdx < TABS.length - 1)
      setActiveTab(TABS[currentTabIdx + 1].value);
    if (direction === "prev" && currentTabIdx > 0)
      setActiveTab(TABS[currentTabIdx - 1].value);
  };

  // ── Amenity toggle ────────────────────────────────────────────────────────
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId];
      form.setValue("amenities", next, { shouldValidate: true });
      return next;
    });
  };

  // ── Tenant type toggle ────────────────────────────────────────────────────
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

  // ── Image handlers ────────────────────────────────────────────────────────
  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const processNewImages = (files: File[]) => {
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

    const remaining = 10 - totalPhotos;
    if (remaining <= 0) {
      toast.error("Maximum 10 photos allowed. Remove some to add more.");
      return;
    }

    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) {
      toast.warning(
        `Only ${remaining} more photo(s) can be added. ${valid.length - remaining} skipped.`,
      );
    }

    if (toAdd.length === 0) return;

    setNewImageFiles((prev) => [...prev, ...toAdd]);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(
      `${toAdd.length} photo(s) added! (${totalPhotos + toAdd.length}/10)`,
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processNewImages(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processNewImages(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: CreateRoomFormValues) => {
    setIsSubmitting(true);

    values.amenities = selectedAmenities;
    values.tenantTypes = selectedTenantTypes;

    const finalCommunity =
      values.ownerCommunity === "Other"
        ? ownerCommunityCustom
        : values.ownerCommunity;

    const formData = new FormData();

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
    appendField("amenities", selectedAmenities);
    appendField("tenantTypes", selectedTenantTypes);
    appendField("images", existingImages);

    if (removedImages.length > 0) {
      appendField("removedImages", removedImages);
    }

    appendField("genderPreference", values.genderPreference);

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

    appendField("otherRules", values.otherRules);
    appendField("gateClosingTime", values.gateClosingTime);
    appendField("existingProblems", values.existingProblems);
    appendField("ownerCommunity", finalCommunity);
    appendField("communityPreference", values.communityPreference);

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

  // ── Loading / not found states ────────────────────────────────────────────
  if (isLoading || !isFormReady) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Room not found</AlertTitle>
          <AlertDescription>Could not load this room's data.</AlertDescription>
        </Alert>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Go back
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ══ Sticky Header ══ */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 md:px-6 lg:px-8">
          {/* Title row */}
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
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
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
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isCompleted = idx < currentTabIdx;
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
                      : isCompleted
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ══ Form Body ══ */}
      <main className="max-w-3xl mx-auto px-4 py-6 md:px-6 pb-36">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "basic" && <BasicTab form={form} />}

                {activeTab === "location" && <LocationTab form={form} />}

                {activeTab === "details" && (
                  <DetailsTab
                    form={form}
                    waterSupplyType={waterSupplyType}
                    setWaterSupplyType={setWaterSupplyType}
                  />
                )}

                {activeTab === "amenities" && (
                  <AmenitiesTab
                    selectedAmenities={selectedAmenities}
                    onToggle={toggleAmenity}
                  />
                )}

                {activeTab === "preferences" && (
                  <PreferencesTab
                    form={form}
                    selectedTenantTypes={selectedTenantTypes}
                    onToggleTenantType={toggleTenantType}
                    ownerCommunityCustom={ownerCommunityCustom}
                    setOwnerCommunityCustom={setOwnerCommunityCustom}
                    showOwnerCommunityInput={showOwnerCommunityInput}
                    setShowOwnerCommunityInput={setShowOwnerCommunityInput}
                  />
                )}

                {/* ══ PHOTOS TAB — simplified ══ */}
                {activeTab === "photos" && (
                  <div className="space-y-5">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                          Room Photos / कोठाका फोटोहरू
                        </h2>
                      </div>
                      <p className="text-sm text-slate-500 ml-13">
                        Manage your room photos — फोटोहरू व्यवस्थापन गर्नुहोस्
                      </p>
                    </div>

                    {/* What photos to include guidance */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                      <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" aria-hidden />
                        Recommended photos to include:
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1 ml-1">
                        <li className="flex items-center gap-2">
                          <span aria-hidden>🛏️</span> Room interior (multiple
                          angles)
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
                      <p className="text-xs text-blue-600">
                        Up to 10 photos total · Max 10MB each · JPEG / PNG /
                        WEBP
                      </p>
                    </div>

                    {/* Existing photos */}
                    {existingImages.length > 0 && (
                      <section aria-label="Existing photos">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-700">
                            Current Photos / हाल भएका फोटोहरू
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {existingImages.length} saved
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {existingImages.map((url, idx) => (
                            <figure
                              key={url}
                              className="relative group aspect-square"
                            >
                              <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-red-300 transition-colors">
                                <img
                                  src={`${API_BASE_URL}${url}`}
                                  alt={`Room photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(url)}
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
                            </figure>
                          ))}
                        </div>
                      </section>
                    )}

                    {removedImages.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <AlertCircle
                          className="w-4 h-4 text-amber-600 flex-shrink-0"
                          aria-hidden
                        />
                        <p className="text-xs text-amber-700 font-semibold">
                          {removedImages.length} photo
                          {removedImages.length !== 1 ? "s" : ""} will be
                          removed when you save
                        </p>
                      </div>
                    )}

                    {/* New photos */}
                    {newImagePreviews.length > 0 && (
                      <section aria-label="New photos to upload">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-700">
                            New Photos to Upload / नयाँ फोटोहरू
                          </p>
                          <Badge className="text-xs bg-green-600 text-white">
                            +{newImagePreviews.length} new
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {newImagePreviews.map((preview, idx) => (
                            <motion.figure
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group aspect-square"
                            >
                              <div className="w-full h-full rounded-xl overflow-hidden border-2 border-green-300 group-hover:border-red-300 transition-colors">
                                <img
                                  src={preview}
                                  alt={`New photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewImage(idx)}
                                aria-label={`Remove new photo ${idx + 1}`}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                              >
                                <XCircle className="w-4 h-4" aria-hidden />
                              </button>
                              <div className="absolute top-1.5 left-1.5">
                                <Badge className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white border-0">
                                  New
                                </Badge>
                              </div>
                            </motion.figure>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Upload zone */}
                    <section aria-label="Upload new photos">
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
                        aria-label={`Upload more photos. ${totalPhotos} of 10 uploaded.`}
                        onClick={() =>
                          totalPhotos < 10 && fileInputRef.current?.click()
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (totalPhotos < 10) fileInputRef.current?.click();
                          }
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all select-none",
                          isDragging
                            ? "border-primary bg-primary/5 scale-[1.01] cursor-copy"
                            : totalPhotos >= 10
                              ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                              : "border-slate-300 bg-white hover:border-primary hover:bg-primary/3 cursor-pointer",
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
                            {totalPhotos >= 10
                              ? "Maximum photos reached (10/10)"
                              : isDragging
                                ? "Drop photos here!"
                                : "Click to add more photos or drag & drop"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {totalPhotos}/10 photos total · Select multiple at
                            once
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Summary */}
                    {totalPhotos > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          aria-hidden
                        />
                        <p className="text-sm font-semibold text-green-700">
                          {existingImages.length} saved + {newImageFiles.length}{" "}
                          new · {totalPhotos}/10 total
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "contact" && (
                  <ContactTab form={form} isAdmin={isAdmin} />
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </main>

      {/* ══ Sticky Bottom Navigation ══ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl"
        aria-label="Form navigation"
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Prev button */}
            <button
              type="button"
              onClick={() => navigateTab("prev")}
              disabled={currentTabIdx === 0}
              aria-label="Previous section"
              className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>

            {/* Progress dots */}
            <div
              className="flex-1 flex items-center gap-1.5 justify-center"
              role="tablist"
            >
              {TABS.map((tab, idx) => (
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
                      : idx < currentTabIdx
                        ? "w-2 bg-primary/40 hover:bg-primary/60"
                        : "w-2 bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>

            {/* Next / Save button */}
            {currentTabIdx === TABS.length - 1 ? (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg flex-shrink-0"
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
                className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer flex-shrink-0"
              >
                Next <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>

          {/* Tab label indicator */}
          <div className="flex justify-center mt-2">
            <p className="text-xs text-slate-400">
              {currentTabIdx + 1} / {TABS.length} — {TABS[currentTabIdx].label}{" "}
              / {TABS[currentTabIdx].labelNp}
            </p>
          </div>
        </div>
      </nav>
    </div>
  );
}
