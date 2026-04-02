"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
  MapPin,
  Loader2,
  Home,
  Navigation,
  Check,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { PropertyCard } from "@/components/rooms/PropertyCard";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { roomService } from "@/http/services/room.service";
import { RoomCategory, RoomStatus, type Room } from "@/types/room.types";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CatConfig {
  label: string;
  labelNp: string;
  emoji: string;
  value: RoomCategory;
}

const CATEGORIES: CatConfig[] = [
  {
    value: RoomCategory.APARTMENT,
    label: "Apartment",
    labelNp: "अपार्टमेन्ट",
    emoji: "🏢",
  },
  { value: RoomCategory.FLAT, label: "Flat", labelNp: "फ्ल्याट", emoji: "🏠" },
  {
    value: RoomCategory.SINGLE,
    label: "Single",
    labelNp: "एकल कोठा",
    emoji: "🛏",
  },
  {
    value: RoomCategory.DOUBLE,
    label: "Double",
    labelNp: "डबल",
    emoji: "🛏🛏",
  },
  { value: RoomCategory.SHARED, label: "Shared", labelNp: "साझा", emoji: "👥" },
  { value: RoomCategory.HOUSE, label: "House", labelNp: "घर", emoji: "🏡" },
  {
    value: RoomCategory.HOSTEL,
    label: "Hostel",
    labelNp: "होस्टेल",
    emoji: "🏨",
  },
  {
    value: RoomCategory.ATTACHED_BATHROOM,
    label: "Attached Bath",
    labelNp: "अट्याच्ड बाथ",
    emoji: "🚿",
  },
  { value: RoomCategory.HOTEL, label: "Hotel", labelNp: "होटेल", emoji: "🏩" },
  {
    value: RoomCategory.OFFICE_SPACE,
    label: "Office",
    labelNp: "अफिस",
    emoji: "🏢",
  },
  {
    value: RoomCategory.SHUTTER,
    label: "Shutter",
    labelNp: "शटर",
    emoji: "🏪",
  },
];

type SortOption = "default" | "price-asc" | "price-desc" | "distance";

interface FilterState {
  categories: RoomCategory[];
  sort: SortOption;
  page: number;
  take: number;
  search: string;
  minPrice: number;
  maxPrice: number;
  allowsWomen: boolean | null;
  lat: number | null;
  lng: number | null;
  radius: number; // km
}

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  sort: "default",
  page: 0,
  take: 12,
  search: "",
  minPrice: 0,
  maxPrice: 50000,
  allowsWomen: null,
  lat: null,
  lng: null,
  radius: 5, // default 5 km for nearby
};

// ─── Haversine distance (km) ───────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="flex gap-2 py-2">
          <div className="flex-1 h-10 bg-slate-100 rounded" />
          <div className="flex-1 h-10 bg-slate-100 rounded" />
          <div className="flex-1 h-10 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-slate-100 rounded-full" />
          <div className="h-5 w-14 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onReset: () => void;
  total: number;
}

function FilterPanel({ filters, onChange, onReset, total }: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Price range */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Price Range
          <span className="font-normal text-slate-500 ml-2">
            रू {filters.minPrice.toLocaleString()} – रू{" "}
            {filters.maxPrice.toLocaleString()}
          </span>
        </p>
        <Slider
          min={0}
          max={50000}
          step={500}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) =>
            onChange({ minPrice: min, maxPrice: max, page: 0 })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>रू ०</span>
          <span>रू ५०,०००+</span>
        </div>
      </div>

      {/* Women allowed */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Tenant Type</p>
        <div className="flex gap-2">
          {[
            { label: "All", value: null },
            { label: "♀ Women OK", value: true },
          ].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ allowsWomen: value, page: 0 })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                filters.allowsWomen === value
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-red-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Radius — only shown when user has granted location */}
      {filters.lat !== null && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Search Radius:{" "}
            <span className="text-red-600 font-bold">{filters.radius} km</span>
          </p>
          <Slider
            min={1}
            max={25}
            step={1}
            value={[filters.radius]}
            onValueChange={([r]) => onChange({ radius: r, page: 0 })}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1 km</span>
            <span>25 km</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex-1 cursor-pointer"
        >
          Reset
        </Button>
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          {total} rooms
        </div>
      </div>
    </div>
  );
}

// ─── Modern Pagination Component ───────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  take: number;
  onPageChange: (page: number) => void;
  onTakeChange: (take: number) => void;
}

function ModernPagination({
  page,
  totalPages,
  total,
  take,
  onPageChange,
  onTakeChange,
}: PaginationProps) {
  // Generate smart page range: always show first, last, current ± 1, with ellipsis
  const getPageRange = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const range: (number | "...")[] = [];
    const delta = 1; // pages around current

    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages - 2, page + delta);

    range.push(0); // always first
    if (left > 1) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 2) range.push("...");
    range.push(totalPages - 1); // always last

    return range;
  };

  const pageRange = getPageRange();
  const startItem = page * take + 1;
  const endItem = Math.min((page + 1) * take, total);

  return (
    <motion.nav
      aria-label="Pagination"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      {/* Info bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-1">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {startItem}–{endItem}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{total}</span> rooms
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Label
            htmlFor="per-page"
            className="cursor-pointer whitespace-nowrap"
          >
            Rooms per page
          </Label>
          <Select
            value={String(take)}
            onValueChange={(v) => onTakeChange(Number(v))}
          >
            <SelectTrigger
              id="per-page"
              className="w-20 h-8 text-xs cursor-pointer"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 12, 24, 36].map((n) => (
                <SelectItem
                  key={n}
                  value={String(n)}
                  className="cursor-pointer"
                >
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page buttons */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {/* First */}
          <button
            type="button"
            onClick={() => onPageChange(0)}
            disabled={page === 0}
            aria-label="First page"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
              page === 0
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:bg-red-50 hover:text-red-600",
            )}
          >
            <ChevronFirst className="w-4 h-4" />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
              page === 0
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:bg-red-50 hover:text-red-600",
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-100 mx-1" />

          {/* Page numbers */}
          {pageRange.map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                aria-label={`Page ${(p as number) + 1}`}
                aria-current={page === p ? "page" : undefined}
                className={cn(
                  "w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  page === p
                    ? "bg-red-600 text-white shadow-md shadow-red-200 scale-105"
                    : "text-slate-600 hover:bg-red-50 hover:text-red-600",
                )}
              >
                {(p as number) + 1}
              </button>
            ),
          )}

          <div className="w-px h-6 bg-slate-100 mx-1" />

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
              page >= totalPages - 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:bg-red-50 hover:text-red-600",
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            aria-label="Last page"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
              page >= totalPages - 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:bg-red-50 hover:text-red-600",
            )}
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────

function RoomsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => {
    const cats = (searchParams?.getAll("cat") as RoomCategory[]) ?? [];
    return {
      ...DEFAULT_FILTERS,
      categories: cats,
      search: searchParams?.get("q") ?? "",
      minPrice: Number(searchParams?.get("min") ?? 0),
      maxPrice: Number(searchParams?.get("max") ?? 50000),
    };
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / filters.take));

  // ── Fetch rooms ──────────────────────────────────────────────────────────────
  //
  // Strategy:
  //   • No location active  → pure server-side pagination (page/take sent to API)
  //   • Location active     → fetch ALL matching rooms (no page/take), filter
  //     client-side by haversine distance, sort by distance, then paginate in-memory.
  //     This is necessary because the backend may not support geospatial filtering.
  //     If your backend DOES support it natively (returns pre-filtered results),
  //     remove the client-side haversine block and just pass latitude/longitude/radius.

  const fetchRooms = useCallback(async (f: FilterState) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const locationActive = f.lat !== null && f.lng !== null;

      const baseParams = {
        // Server-side pagination — only when NOT doing client-side geo filtering
        ...(!locationActive && { page: f.page, take: f.take }),
        ...(f.search.trim() && { search: f.search.trim() }),
        ...(f.minPrice > 0 && { minPrice: f.minPrice }),
        ...(f.maxPrice < 50000 && { maxPrice: f.maxPrice }),
        ...(f.allowsWomen !== null && { allowsWomen: f.allowsWomen }),
        approvalStatus: RoomStatus.APPROVED,
      };

      let allRooms: Room[] = [];
      let totalCount = 0;

      if (f.categories.length <= 1) {
        const resp = await roomService.getPublicRooms({
          ...baseParams,
          ...(f.categories.length === 1 && { category: f.categories[0] }),
          // When location is active, fetch without pagination to filter client-side
          ...(locationActive && { take: 1000, page: 0 }),
        });
        allRooms = resp.data;
        totalCount = resp.pagination?.total ?? resp.data.length;
      } else {
        // Multi-category: parallel requests + client-side dedup (OR logic)
        const results = await Promise.all(
          f.categories.map((cat) =>
            roomService.getPublicRooms({
              ...baseParams,
              category: cat,
              ...(locationActive && { take: 1000, page: 0 }),
            }),
          ),
        );
        const seen = new Set<string>();
        results.forEach((r) => {
          r.data.forEach((room) => {
            if (!seen.has(room.id)) {
              seen.add(room.id);
              allRooms.push(room);
            }
          });
          totalCount += r.pagination?.total ?? r.data.length;
        });
        totalCount = allRooms.length;
      }

      // ── Client-side geolocation filtering ──────────────────────────────────
      // Only runs when user explicitly enabled location search.
      // Filters rooms by haversine distance and attaches _distanceKm to each.
      if (locationActive) {
        const userLat = f.lat!;
        const userLng = f.lng!;
        const radiusKm = f.radius;

        // Attach distance to every room, filter by radius
        const withDistance = allRooms
          .filter((room) => {
            // Only include rooms that have valid coordinates
            const rLat = Number((room as any).latitude ?? (room as any).lat);
            const rLng = Number((room as any).longitude ?? (room as any).lng);
            if (!rLat || !rLng || isNaN(rLat) || isNaN(rLng)) return false;
            const dist = haversineKm(userLat, userLng, rLat, rLng);
            return dist <= radiusKm;
          })
          .map((room) => {
            const rLat = Number((room as any).latitude ?? (room as any).lat);
            const rLng = Number((room as any).longitude ?? (room as any).lng);
            return {
              ...room,
              _distanceKm: haversineKm(userLat, userLng, rLat, rLng),
            };
          });

        // Sort by distance first, then apply user sort on top
        withDistance.sort(
          (a, b) => (a._distanceKm ?? 0) - (b._distanceKm ?? 0),
        );

        totalCount = withDistance.length;

        // Client-side pagination slice
        const start = f.page * f.take;
        allRooms = withDistance.slice(start, start + f.take);
      }
      // ── End geo filtering ───────────────────────────────────────────────────

      // Client-side sort (price) — applied after geo sort if location active
      if (f.sort === "price-asc")
        allRooms.sort((a, b) => Number(a.price) - Number(b.price));
      if (f.sort === "price-desc")
        allRooms.sort((a, b) => Number(b.price) - Number(a.price));

      setRooms(allRooms);
      setTotal(locationActive ? totalCount : totalCount || allRooms.length);
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchRooms(filters);

    // Sync URL (exclude lat/lng)
    const params = new URLSearchParams();
    filters.categories.forEach((c) => params.append("cat", c));
    if (filters.search) params.set("q", filters.search);
    if (filters.minPrice > 0) params.set("min", String(filters.minPrice));
    if (filters.maxPrice < 50000) params.set("max", String(filters.maxPrice));
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
  }, []);

  // ── Category toggle ───────────────────────────────────────────────────────────

  const toggleCategory = (cat: RoomCategory) => {
    setFilters((prev) => {
      const has = prev.categories.includes(cat);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
        page: 0,
      };
    });
  };

  // ── Search debounce ───────────────────────────────────────────────────────────

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      updateFilters({ search: val, page: 0 });
    }, 420);
  };

  // ── Geolocation — ONLY called on explicit button click ───────────────────────

  const handleLocateClick = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        updateFilters({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          page: 0,
          sort: "default", // reset to distance sort
        });
        setLocLoading(false);
      },
      () => {
        if (!mountedRef.current) return;
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const clearLocation = () => {
    updateFilters({ lat: null, lng: null, page: 0 });
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 50000 ||
    !!filters.search ||
    filters.allowsWomen !== null ||
    filters.lat !== null;

  const locationActive = filters.lat !== null;

  const activeFilterCount =
    filters.categories.length +
    (filters.minPrice > 0 || filters.maxPrice < 50000 ? 1 : 0) +
    (filters.allowsWomen ? 1 : 0) +
    (locationActive ? 1 : 0);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50">
        {/* ── Header / Search ── */}
        <header className="bg-white border-b border-slate-100 pt-24 pb-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center mb-6"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Find Your <span className="text-red-600">Perfect Room</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {total > 0
                  ? `${total} verified ${locationActive ? `properties within ${filters.radius} km` : "properties available"}`
                  : "Browse verified listings across Nepal"}
              </p>
            </motion.div>

            <div className="max-w-2xl mx-auto flex gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search by location or property name…"
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-9 h-11 rounded-xl border-slate-200 focus:border-red-400 focus:ring-red-100 bg-white"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      updateFilters({ search: "", page: 0 });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/*
                Location button — ONLY place geolocation is triggered.
                onClick calls getCurrentPosition. Nothing else does.
              */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={locationActive ? clearLocation : handleLocateClick}
                disabled={locLoading}
                title={
                  locationActive
                    ? "Clear location filter"
                    : "Search near my location"
                }
                aria-label={
                  locationActive
                    ? "Clear location filter"
                    : "Search near my location"
                }
                className={cn(
                  "h-11 w-11 rounded-xl border-slate-200 shrink-0 transition-colors cursor-pointer",
                  locationActive &&
                    "bg-red-50 border-red-300 text-red-600 hover:bg-red-100",
                )}
              >
                {locLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : locationActive ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Location banner */}
            <AnimatePresence>
              {locationActive && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-xs text-red-600 mt-2 flex items-center justify-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Showing {total} rooms within{" "}
                  <strong>{filters.radius} km</strong> of your location. Adjust
                  radius in Filters.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Category chips ── */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => updateFilters({ categories: [], page: 0 })}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 cursor-pointer",
                  filters.categories.length === 0
                    ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-100"
                    : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600",
                )}
              >
                <Home className="w-3.5 h-3.5" />
                All
              </button>

              {CATEGORIES.map((cat) => {
                const active = filters.categories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 cursor-pointer",
                      active
                        ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-100"
                        : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600",
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {active && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-28">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-500" />
                  Filters
                </h2>
                <FilterPanel
                  filters={filters}
                  onChange={updateFilters}
                  onReset={resetFilters}
                  total={total}
                />
              </div>
            </aside>

            {/* Content area */}
            <div className="flex-1 min-w-0">
              {/* Controls bar */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-slate-500" aria-live="polite">
                    {loading
                      ? "Searching…"
                      : `${total} room${total !== 1 ? "s" : ""} found`}
                  </p>

                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filters.categories.map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="gap-1 text-xs pr-1 bg-red-50 text-red-700 border-red-200"
                        >
                          {CATEGORIES.find((c) => c.value === cat)?.label ??
                            cat}
                          <button
                            onClick={() => toggleCategory(cat)}
                            className="ml-0.5 hover:text-red-900 cursor-pointer"
                            aria-label={`Remove ${cat} filter`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                      {(filters.minPrice > 0 || filters.maxPrice < 50000) && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-xs pr-1 bg-red-50 text-red-700 border-red-200"
                        >
                          रू {filters.minPrice.toLocaleString()}–
                          {filters.maxPrice.toLocaleString()}
                          <button
                            onClick={() =>
                              updateFilters({ minPrice: 0, maxPrice: 50000 })
                            }
                            className="cursor-pointer"
                            aria-label="Remove price filter"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      )}
                      {filters.allowsWomen && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-xs pr-1 bg-pink-50 text-pink-700 border-pink-200"
                        >
                          ♀ Women OK
                          <button
                            onClick={() => updateFilters({ allowsWomen: null })}
                            className="cursor-pointer"
                            aria-label="Remove women filter"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      )}
                      {locationActive && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-xs pr-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          Near me ({filters.radius} km)
                          <button
                            onClick={clearLocation}
                            className="cursor-pointer"
                            aria-label="Remove location filter"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      )}
                      <button
                        onClick={resetFilters}
                        className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Sort */}
                  <Select
                    value={filters.sort}
                    onValueChange={(v) =>
                      updateFilters({ sort: v as SortOption, page: 0 })
                    }
                  >
                    <SelectTrigger className="h-9 w-44 text-xs rounded-lg border-slate-200 cursor-pointer">
                      <ArrowUpDown className="w-3 h-3 mr-1.5 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default" className="cursor-pointer">
                        Default
                      </SelectItem>
                      <SelectItem value="price-asc" className="cursor-pointer">
                        Price: Low → High
                      </SelectItem>
                      <SelectItem value="price-desc" className="cursor-pointer">
                        Price: High → Low
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Mobile filter sheet */}
                  <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "lg:hidden h-9 gap-1.5 rounded-lg border-slate-200 text-xs cursor-pointer",
                          hasActiveFilters &&
                            "border-red-400 text-red-600 bg-red-50",
                        )}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Filter
                        {activeFilterCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px]">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterPanel
                          filters={filters}
                          onChange={updateFilters}
                          onReset={resetFilters}
                          total={total}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Room grid */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {Array.from({ length: filters.take }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : rooms.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 px-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <Home className="w-8 h-8 text-red-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      No rooms found
                    </h3>
                    <p className="text-sm text-slate-500 mb-5">
                      {locationActive
                        ? `No rooms within ${filters.radius} km of your location. Try increasing the radius in Filters.`
                        : "Try adjusting your filters or search terms."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="cursor-pointer"
                    >
                      Clear All Filters
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`results-page-${filters.page}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {rooms.map((room, i) => (
                      <PropertyCard key={room.id} room={room} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pagination — only shown when there are multiple pages */}
              {!loading && rooms.length > 0 && totalPages > 1 && (
                <ModernPagination
                  page={filters.page}
                  totalPages={totalPages}
                  total={total}
                  take={filters.take}
                  onPageChange={(p) => {
                    updateFilters({ page: p });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onTakeChange={(take) => updateFilters({ take, page: 0 })}
                />
              )}

              {/* Show count even on single page */}
              {!loading && rooms.length > 0 && totalPages === 1 && (
                <p className="text-center text-xs text-slate-400 mt-6">
                  Showing all {total} room{total !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

// ─── Page skeleton (Suspense fallback) ───────────────────────────────────────

function PageSkeleton() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse max-w-lg mx-auto" />
          <div className="h-10 bg-slate-200 rounded-full animate-pulse max-w-2xl mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoomsContent />
    </Suspense>
  );
}
