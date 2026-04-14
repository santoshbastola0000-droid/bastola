"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  MapPin,
  Loader2,
  Home,
  Navigation,
  Check,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9;

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
  search: "",
  minPrice: 0,
  maxPrice: 50000,
  allowsWomen: null,
  lat: null,
  lng: null,
  radius: 5,
};

// ─── Haversine distance (km) — DO NOT TOUCH ───────────────────────────────────

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

function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/2" />
        <div className="flex gap-2 py-2">
          <div className="flex-1 h-10 bg-slate-50 rounded-xl animate-pulse" />
          <div className="flex-1 h-10 bg-slate-50 rounded-xl animate-pulse" />
          <div className="flex-1 h-10 bg-slate-50 rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Infinite scroll sentinel loader ──────────────────────────────────────────

function LoadMoreIndicator({ hasMore }: { hasMore: boolean }) {
  if (!hasMore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 py-12"
      >
        <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-red-200 to-transparent" />
        <p className="text-xs text-slate-400 tracking-widest uppercase">
          All caught up
        </p>
        <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-red-200 to-transparent" />
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-10 gap-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-red-400"
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
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
            onChange({ minPrice: min, maxPrice: max })
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
              onClick={() => onChange({ allowsWomen: value })}
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

      {/* Radius — only shown when location active (DO NOT TOUCH) */}
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
            onValueChange={([r]) => onChange({ radius: r })}
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

// ─── Scroll-to-top FAB ────────────────────────────────────────────────────────

function ScrollToTopFAB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="fab"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 flex items-center justify-center hover:bg-red-700 hover:shadow-xl hover:shadow-red-300 transition-all active:scale-95 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────

function RoomsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Filter state ──────────────────────────────────────────────────────────
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

  // ── Infinite scroll state ─────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const allPoolRef = useRef<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ── Refs that shadow state — these are what loadMore reads ────────────────
  // This is the core fix: loadMore reads from refs (always current) instead of
  // stale closure values captured at the time the callback was memoised.
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const totalRef = useRef(0);
  const filtersRef = useRef<FilterState>(filters);

  const [locLoading, setLocLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [filterOpen, setFilterOpen] = useState(false);

  const searchRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Keep filtersRef in sync
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Core fetch: loads the FULL pool from server when filters change ───────
  const fetchPool = useCallback(
    async (f: FilterState): Promise<{ pool: Room[]; total: number }> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const locationActive = f.lat !== null && f.lng !== null;

      const baseParams = {
        ...(!locationActive && { page: 0, take: PAGE_SIZE }),
        ...(locationActive && { page: 0, take: 1000 }),
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
        });
        allRooms = resp.data;
        totalCount = resp.pagination?.total ?? resp.data.length;
      } else {
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
        });
        totalCount = allRooms.length;
      }

      // ── Strategy B: client-side haversine geo-filter (DO NOT TOUCH) ───────
      if (locationActive) {
        const userLat = f.lat!;
        const userLng = f.lng!;
        const radiusKm = f.radius;

        const withDistance = allRooms
          .filter((room) => {
            const rLat = Number((room as any).latitude ?? (room as any).lat);
            const rLng = Number((room as any).longitude ?? (room as any).lng);
            if (!rLat || !rLng || isNaN(rLat) || isNaN(rLng)) return false;
            return haversineKm(userLat, userLng, rLat, rLng) <= radiusKm;
          })
          .map((room) => {
            const rLat = Number((room as any).latitude ?? (room as any).lat);
            const rLng = Number((room as any).longitude ?? (room as any).lng);
            return {
              ...room,
              _distanceKm: haversineKm(userLat, userLng, rLat, rLng),
            };
          });

        withDistance.sort(
          (a, b) => (a._distanceKm ?? 0) - (b._distanceKm ?? 0),
        );

        totalCount = withDistance.length;
        allRooms = withDistance as Room[];
      }
      // ── End geo-filter block ───────────────────────────────────────────────

      if (f.sort === "price-asc")
        allRooms.sort((a, b) => Number(a.price) - Number(b.price));
      if (f.sort === "price-desc")
        allRooms.sort((a, b) => Number(b.price) - Number(a.price));

      return { pool: allRooms, total: totalCount };
    },
    [],
  );

  // ── Server fetch for next page (Strategy A continuation) ─────────────────
  const fetchNextServerPage = useCallback(
    async (f: FilterState, currentOffset: number): Promise<Room[]> => {
      const serverPage = Math.floor(currentOffset / PAGE_SIZE);
      const baseParams = {
        page: serverPage,
        take: PAGE_SIZE,
        ...(f.search.trim() && { search: f.search.trim() }),
        ...(f.minPrice > 0 && { minPrice: f.minPrice }),
        ...(f.maxPrice < 50000 && { maxPrice: f.maxPrice }),
        ...(f.allowsWomen !== null && { allowsWomen: f.allowsWomen }),
        approvalStatus: RoomStatus.APPROVED,
      };

      if (f.categories.length <= 1) {
        const resp = await roomService.getPublicRooms({
          ...baseParams,
          ...(f.categories.length === 1 && { category: f.categories[0] }),
        });
        return resp.data;
      }

      const results = await Promise.all(
        f.categories.map((cat) =>
          roomService.getPublicRooms({ ...baseParams, category: cat }),
        ),
      );
      const seen = new Set<string>();
      const merged: Room[] = [];
      results.forEach((r) =>
        r.data.forEach((room) => {
          if (!seen.has(room.id)) {
            seen.add(room.id);
            merged.push(room);
          }
        }),
      );
      return merged;
    },
    [],
  );

  // ── Initial load / filter reset ───────────────────────────────────────────
  const initLoad = useCallback(
    async (f: FilterState) => {
      setInitialLoading(true);
      setRooms([]);

      // Reset both state AND refs atomically
      setOffset(0);
      offsetRef.current = 0;
      setHasMore(true);
      hasMoreRef.current = true;
      setTotal(0);
      totalRef.current = 0;
      allPoolRef.current = [];

      // Also reset the loadingMore guard so it can fire again after filter change
      loadingMoreRef.current = false;

      try {
        const { pool, total: t } = await fetchPool(f);
        if (!mountedRef.current) return;

        const locationActive = f.lat !== null && f.lng !== null;

        if (locationActive) {
          // Geo mode: entire pool is in memory, slice client-side
          allPoolRef.current = pool;
          const first = pool.slice(0, PAGE_SIZE);
          setRooms(first);

          const newOffset = PAGE_SIZE;
          setOffset(newOffset);
          offsetRef.current = newOffset;

          setTotal(t);
          totalRef.current = t;

          const more = PAGE_SIZE < t;
          setHasMore(more);
          hasMoreRef.current = more;
        } else {
          // Server-paginated mode: first page already fetched
          allPoolRef.current = pool;
          setRooms(pool);

          const newOffset = pool.length;
          setOffset(newOffset);
          offsetRef.current = newOffset;

          setTotal(t);
          totalRef.current = t;

          const more = pool.length < t;
          setHasMore(more);
          hasMoreRef.current = more;
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error(err);
      } finally {
        if (mountedRef.current) setInitialLoading(false);
      }
    },
    [fetchPool],
  );

  // ── Load next batch (sentinel triggered) ──────────────────────────────────
  // KEY FIX: reads offsetRef / hasMoreRef / totalRef / filtersRef instead of
  // stale closure values. The callback itself has NO dependencies on state that
  // changes between renders — only stable refs and stable callbacks.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const currentOffset = offsetRef.current;
      const currentFilters = filtersRef.current;
      const locationActive =
        currentFilters.lat !== null && currentFilters.lng !== null;

      if (locationActive) {
        // Geo mode: slice next chunk from in-memory pool
        const pool = allPoolRef.current;
        const nextChunk = pool.slice(currentOffset, currentOffset + PAGE_SIZE);
        if (!mountedRef.current) return;

        setRooms((prev) => [...prev, ...nextChunk]);

        const newOffset = currentOffset + nextChunk.length;
        setOffset(newOffset);
        offsetRef.current = newOffset;

        const more = newOffset < pool.length;
        setHasMore(more);
        hasMoreRef.current = more;
      } else {
        // Server mode: fetch next server page
        const nextRooms = await fetchNextServerPage(
          currentFilters,
          currentOffset,
        );
        if (!mountedRef.current) return;

        setRooms((prev) => [...prev, ...nextRooms]);

        const newOffset = currentOffset + nextRooms.length;
        setOffset(newOffset);
        offsetRef.current = newOffset;

        const more = newOffset < totalRef.current;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error(err);
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }, [fetchNextServerPage]);
  // NOTE: fetchNextServerPage is stable (empty deps). loadMore intentionally
  // does NOT depend on filters/offset/hasMore/total — it reads them from refs.

  // ── Re-init on filter change ──────────────────────────────────────────────
  useEffect(() => {
    initLoad(filters);

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

  // ── IntersectionObserver for sentinel ────────────────────────────────────
  // KEY FIX: the observer is set up ONCE and never torn down/re-created on
  // every loadMore change. loadMore is now stable (no state deps), so this
  // effect only runs once on mount. The sentinel element is always in the DOM
  // (rendered unconditionally outside the grid), so the observer always has
  // a target.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // loadMore is stable — this runs exactly once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
  }, []);

  const toggleCategory = (cat: RoomCategory) => {
    setFilters((prev) => {
      const has = prev.categories.includes(cat);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => updateFilters({ search: val }), 420);
  };

  // ── Geolocation — ONLY on explicit button click (DO NOT TOUCH) ───────────
  const handleLocateClick = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        updateFilters({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          sort: "default",
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

  const clearLocation = () => updateFilters({ lat: null, lng: null });

  // ── Derived ───────────────────────────────────────────────────────────────

  const locationActive = filters.lat !== null;

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 50000 ||
    !!filters.search ||
    filters.allowsWomen !== null ||
    locationActive;

  const activeFilterCount =
    filters.categories.length +
    (filters.minPrice > 0 || filters.maxPrice < 50000 ? 1 : 0) +
    (filters.allowsWomen ? 1 : 0) +
    (locationActive ? 1 : 0);

  return (
    <>
      <NavBar />
      <ScrollToTopFAB />

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
                      updateFilters({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Location button — ONLY trigger for geolocation (DO NOT TOUCH) */}
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

            {/* Location banner (DO NOT TOUCH) */}
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
                onClick={() => updateFilters({ categories: [] })}
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
                    {initialLoading
                      ? "Searching…"
                      : `${total} room${total !== 1 ? "s" : ""} found`}
                  </p>

                  {hasActiveFilters && !initialLoading && (
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
                  <Select
                    value={filters.sort}
                    onValueChange={(v) =>
                      updateFilters({ sort: v as SortOption })
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

              {/* ── Room grid ── */}
              <AnimatePresence mode="wait">
                {initialLoading ? (
                  /* Initial skeleton grid */
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <CardSkeleton key={i} index={i} />
                    ))}
                  </motion.div>
                ) : rooms.length === 0 ? (
                  /* Empty state */
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
                  /* Infinite grid */
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {rooms.map((room, i) => (
                        <motion.div
                          key={room.id}
                          initial={{ opacity: 0, y: 28, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.38,
                            delay: Math.min(i % PAGE_SIZE, 8) * 0.055,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <PropertyCard room={room} index={i} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress indicator + sentinel */}
                    {rooms.length > 0 && !initialLoading && (
                      <div className="mt-6">
                        {/* Slim progress bar */}
                        <div className="relative h-[3px] bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto mb-4">
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                            initial={false}
                            animate={{
                              width: `${Math.min((rooms.length / total) * 100, 100)}%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>

                        {/* Count chip */}
                        <p className="text-center text-xs text-slate-400">
                          <span className="font-semibold text-slate-600">
                            {rooms.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-slate-600">
                            {total}
                          </span>{" "}
                          rooms
                        </p>

                        {/* Animated dots or end state */}
                        <LoadMoreIndicator hasMore={loadingMore || hasMore} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/*
               * SENTINEL — lives OUTSIDE AnimatePresence so it is ALWAYS in the DOM.
               * The IntersectionObserver (set up once on mount) always has a target.
               * When initialLoading is true we still observe it but loadMore() returns
               * early because loadingMoreRef.current is true (set in initLoad reset).
               */}
              <div
                ref={sentinelRef}
                aria-hidden="true"
                style={{ height: 1, marginTop: 1 }}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

// ─── Page skeleton (Suspense fallback) ────────────────────────────────────────

function PageSkeleton() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse max-w-lg mx-auto" />
          <div className="h-10 bg-slate-200 rounded-full animate-pulse max-w-2xl mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
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
