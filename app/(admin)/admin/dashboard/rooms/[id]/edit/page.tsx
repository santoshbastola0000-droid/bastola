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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RoomCategory, TenantType, GenderPreference } from "@/types/room.types";
import { cn } from "@/lib/utils";
import { roomService } from "@/http/services/room.service";
import { createRoomSchema, CreateRoomFormValues } from "@/schema/room";
import { UserRole } from "@/types/user.types";
import { useUserRole } from "@/stores/user-store";
import {
  COMMUNITY_OPTIONS,
  DEFAULT_LAT,
  DEFAULT_LNG,
  TABS,
} from "@/lib/constants/app.constants";
import { detectWaterType } from "@/lib/room-utils";
import { PhotosTab } from "./tabs/PhotosTab";
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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  // ── Domain state ──────────────────────────────────────────────────────────
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTenantTypes, setSelectedTenantTypes] = useState<TenantType[]>(
    [],
  );
  const [waterSupplyType, setWaterSupplyType] = useState("morning-evening");
  const [ownerCommunityCustom, setOwnerCommunityCustom] = useState("");
  const [showOwnerCommunityInput, setShowOwnerCommunityInput] = useState(false);

  // ── Image state ───────────────────────────────────────────────────────────
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomService.getRoomById(id),
    enabled: !!id,
  });

  const room = data?.data;

  // ── Form ──────────────────────────────────────────────────────────────────
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

  // ── Pre-fill form when room data loads ───────────────────────────────────
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

  const addNewImages = (files: File[]) => {
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

    setNewImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(0);
      toast.success(
        `${files.length} photo${files.length !== 1 ? "s" : ""} added!`,
      );
    }, 900);
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
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
                    className="hover:text-primary transition-colors"
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
                    className="hover:text-primary transition-colors"
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

                {activeTab === "photos" && (
                  <PhotosTab
                    existingImages={existingImages}
                    newImagePreviews={newImagePreviews}
                    removedImages={removedImages}
                    uploadProgress={uploadProgress}
                    onRemoveExisting={removeExistingImage}
                    onAddNew={addNewImages}
                    onRemoveNew={removeNewImage}
                  />
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
