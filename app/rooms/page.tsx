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

// ─── Category config ──────────────────────────────────────────────────────────

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

type SortOption = "default" | "price-asc" | "price-desc";

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
  radius: number;
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
  radius: 10,
};

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

// ─── Filter Sheet (mobile + desktop) ─────────────────────────────────────────

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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filters.allowsWomen === value
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Radius (when location active) */}
      {filters.lat && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Search Radius: {filters.radius} km
          </p>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[filters.radius]}
            onValueChange={([r]) => onChange({ radius: r, page: 0 })}
          />
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

  const totalPages = Math.ceil(total / filters.take);

  // ── Fetch rooms — supports multi-category via parallel requests ──
  const fetchRooms = useCallback(async (f: FilterState) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const baseParams = {
        page: f.page,
        take: f.take,
        ...(f.search.trim() && { search: f.search.trim() }),
        ...(f.minPrice > 0 && { minPrice: f.minPrice }),
        ...(f.maxPrice < 50000 && { maxPrice: f.maxPrice }),
        ...(f.allowsWomen !== null && { allowsWomen: f.allowsWomen }),
        ...(f.lat &&
          f.lng && { latitude: f.lat, longitude: f.lng, radius: f.radius }),
        approvalStatus: RoomStatus.APPROVED,
      };

      let allRooms: Room[] = [];
      let totalCount = 0;

      if (f.categories.length <= 1) {
        // Single or no category — one request
        const resp = await roomService.getPublicRooms({
          ...baseParams,
          ...(f.categories.length === 1 && { category: f.categories[0] }),
        });
        allRooms = resp.data;
        totalCount = resp.pagination?.total ?? resp.data.length;
      } else {
        // Multiple categories — parallel requests, merge & deduplicate
        const results = await Promise.all(
          f.categories.map((cat) =>
            roomService.getPublicRooms({ ...baseParams, category: cat }),
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
        totalCount = allRooms.length; // accurate count after dedup
      }

      // Client-side sort
      if (f.sort === "price-asc")
        allRooms.sort((a, b) => Number(a.price) - Number(b.price));
      if (f.sort === "price-desc")
        allRooms.sort((a, b) => Number(b.price) - Number(a.price));

      setRooms(allRooms);
      setTotal(totalCount);
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch on filter change
  useEffect(() => {
    fetchRooms(filters);
    // Sync URL
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

  // ── Category toggle (multi-select) ──
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

  // ── Search debounce ──
  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      updateFilters({ search: val, page: 0 });
    }, 420);
  };

  // ── Geolocation ──
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFilters({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          page: 0,
        });
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const clearLocation = () => updateFilters({ lat: null, lng: null, page: 0 });

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 50000 ||
    !!filters.search ||
    filters.allowsWomen !== null ||
    !!filters.lat;

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50">
        {/* ── Hero search bar ── */}
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
                  ? `${total} verified properties available`
                  : "Browse verified listings across Nepal"}
              </p>
            </motion.div>

            {/* Search input */}
            <div className="max-w-2xl mx-auto flex gap-2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Locate me */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={filters.lat ? clearLocation : handleLocate}
                disabled={locLoading}
                title={filters.lat ? "Clear location" : "Use my location"}
                className={`h-11 w-11 rounded-xl border-slate-200 shrink-0 ${filters.lat ? "bg-red-50 border-red-300 text-red-600" : ""}`}
              >
                {locLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : filters.lat ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Location indicator */}
            {filters.lat && (
              <p className="text-center text-xs text-red-600 mt-2 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                Showing rooms within {filters.radius} km of your location
              </p>
            )}
          </div>
        </header>

        {/* ── Category chips (horizontal scroll) ── */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              {/* All button */}
              <button
                type="button"
                onClick={() => updateFilters({ categories: [], page: 0 })}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                  filters.categories.length === 0
                    ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-100"
                    : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600"
                }`}
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
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
                      active
                        ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-100"
                        : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600"
                    }`}
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

        {/* ── Main ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Sidebar (desktop) ── */}
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

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">
              {/* Controls bar */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-slate-500" aria-live="polite">
                    {loading
                      ? "Searching…"
                      : `${total} room${total !== 1 ? "s" : ""} found`}
                  </p>
                  {/* Active filter chips */}
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
                            className="ml-0.5 hover:text-red-900"
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
                    <SelectTrigger className="h-9 w-40 text-xs rounded-lg border-slate-200">
                      <ArrowUpDown className="w-3 h-3 mr-1.5 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-asc">
                        Price: Low → High
                      </SelectItem>
                      <SelectItem value="price-desc">
                        Price: High → Low
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Mobile filter button */}
                  <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`lg:hidden h-9 gap-1.5 rounded-lg border-slate-200 text-xs ${hasActiveFilters ? "border-red-400 text-red-600 bg-red-50" : ""}`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Filter
                        {hasActiveFilters && (
                          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                            {filters.categories.length +
                              (filters.minPrice > 0 || filters.maxPrice < 50000
                                ? 1
                                : 0) +
                              (filters.allowsWomen ? 1 : 0)}
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

              {/* ── Grid ── */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
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
                      {filters.lat
                        ? "No rooms within your location range. Try increasing the radius."
                        : "Try adjusting your filters or search terms."}
                    </p>
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Clear All Filters
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {rooms.map((room, i) => (
                      <PropertyCard key={room.id} room={room} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Pagination ── */}
              {!loading && rooms.length > 0 && totalPages > 1 && (
                <motion.nav
                  aria-label="Pagination"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 0}
                      onClick={() => updateFilters({ page: filters.page - 1 })}
                      className="gap-1 h-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p =
                        totalPages <= 5
                          ? i
                          : filters.page < 3
                            ? i
                            : filters.page > totalPages - 4
                              ? totalPages - 5 + i
                              : filters.page - 2 + i;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateFilters({ page: p })}
                          className={cn(
                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                            filters.page === p
                              ? "bg-red-500 text-white shadow"
                              : "text-slate-600 hover:bg-slate-100",
                          )}
                        >
                          {p + 1}
                        </button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= totalPages - 1}
                      onClick={() => updateFilters({ page: filters.page + 1 })}
                      className="gap-1 h-8"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Label
                      htmlFor="per-page"
                      className="cursor-pointer whitespace-nowrap"
                    >
                      Show
                    </Label>
                    <Select
                      value={String(filters.take)}
                      onValueChange={(v) =>
                        updateFilters({ take: Number(v), page: 0 })
                      }
                    >
                      <SelectTrigger id="per-page" className="w-16 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[12, 24, 36].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="whitespace-nowrap">per page</span>
                  </div>
                </motion.nav>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

// ─── Skeleton fallback ────────────────────────────────────────────────────────

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
