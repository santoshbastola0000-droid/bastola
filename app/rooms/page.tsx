"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
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
  Sparkles,
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

// ─── Page-level scroll progress bar ──────────────────────────────────────────

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0%" }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-red-400 to-rose-500 z-[100] shadow-[0_0_10px_rgba(239,68,68,0.6)]"
    />
  );
}

// ─── Skeleton card with shimmer ───────────────────────────────────────────────

function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
    >
      {/* Image shimmer */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="p-4 space-y-3">
        <div className="relative overflow-hidden h-4 bg-slate-100 rounded-lg w-3/4">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_0.1s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="relative overflow-hidden h-3 bg-slate-100 rounded-lg w-1/2">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_0.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="flex gap-2 py-2">
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              className="relative flex-1 overflow-hidden h-10 bg-slate-50 rounded-xl"
            >
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                style={{
                  animation: `shimmer 1.6s ${0.15 * j}s infinite`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative overflow-hidden h-5 w-14 bg-slate-100 rounded-full">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_0.3s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
          <div className="relative overflow-hidden h-5 w-14 bg-slate-100 rounded-full">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_0.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inline load-more skeleton rows (appended below existing cards) ───────────

function InlineSkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={`inline-skel-${i}`} index={i} />
      ))}
    </>
  );
}

// ─── Load-more footer indicator ───────────────────────────────────────────────

function LoadMoreIndicator({
  hasMore,
  loadingMore,
  loaded,
  total,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  loaded: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min((loaded / total) * 100, 100) : 0;

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      {/* Progress track */}
      <div className="w-48 h-[3px] bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 tabular-nums">
        <span className="font-semibold text-slate-600">{loaded}</span>
        {" of "}
        <span className="font-semibold text-slate-600">{total}</span>
        {" rooms"}
      </p>

      {/* State label */}
      <AnimatePresence mode="wait">
        {loadingMore ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 text-xs text-red-500 font-medium"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading more…
          </motion.div>
        ) : !hasMore ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-red-300" />
              <span className="tracking-wide">You've seen it all</span>
              <Sparkles className="w-3.5 h-3.5 text-red-300" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-red-300"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
          <span className="font-normal text-slate-500 ml-2 text-xs">
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
        <div className="flex justify-between text-xs text-slate-400 mt-2">
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
                  ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600",
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
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>1 km</span>
            <span>25 km</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex-1 cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Reset
        </Button>
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{total}</span>
          &nbsp;rooms
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
          initial={{ opacity: 0, scale: 0.5, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 24 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-50 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-300/50 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Animated room card wrapper ───────────────────────────────────────────────

function AnimatedCard({
  room,
  index,
  isNew,
}: {
  room: Room;
  index: number;
  isNew: boolean;
}) {
  return (
    <motion.div
      key={room.id}
      layout
      initial={isNew ? { opacity: 0, y: 40, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: isNew ? Math.min(index % PAGE_SIZE, 8) * 0.06 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <PropertyCard room={room} index={index} />
    </motion.div>
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
  const [newRoomIds, setNewRoomIds] = useState<Set<string>>(new Set());
  const allPoolRef = useRef<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ── Refs that shadow state — these are what loadMore reads ────────────────
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
      setNewRoomIds(new Set());

      setOffset(0);
      offsetRef.current = 0;
      setHasMore(true);
      hasMoreRef.current = true;
      setTotal(0);
      totalRef.current = 0;
      allPoolRef.current = [];
      loadingMoreRef.current = false;

      try {
        const { pool, total: t } = await fetchPool(f);
        if (!mountedRef.current) return;

        const locationActive = f.lat !== null && f.lng !== null;

        if (locationActive) {
          allPoolRef.current = pool;
          const first = pool.slice(0, PAGE_SIZE);

          const ids = new Set(first.map((r) => r.id));
          setNewRoomIds(ids);
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
          allPoolRef.current = pool;

          const ids = new Set(pool.map((r) => r.id));
          setNewRoomIds(ids);
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
        const pool = allPoolRef.current;
        const nextChunk = pool.slice(currentOffset, currentOffset + PAGE_SIZE);
        if (!mountedRef.current) return;

        const newIds = new Set(nextChunk.map((r) => r.id));
        setNewRoomIds(newIds);
        setRooms((prev) => [...prev, ...nextChunk]);

        const newOffset = currentOffset + nextChunk.length;
        setOffset(newOffset);
        offsetRef.current = newOffset;

        const more = newOffset < pool.length;
        setHasMore(more);
        hasMoreRef.current = more;
      } else {
        const nextRooms = await fetchNextServerPage(
          currentFilters,
          currentOffset,
        );
        if (!mountedRef.current) return;

        const newIds = new Set(nextRooms.map((r) => r.id));
        setNewRoomIds(newIds);
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

  // ── Re-init on filter change ──────────────────────────────────────────────
  useEffect(() => {
    initLoad(filters);

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

  // ── IntersectionObserver — set up ONCE, never torn down ──────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "500px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
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
      <ScrollProgressBar />
      <ScrollToTopFAB />

      <div className="min-h-screen bg-[#f8f8fa]">
        {/* ── Header / Search ── */}
        <header className="bg-white border-b border-slate-100 pt-24 pb-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl mx-auto text-center mb-6"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Find Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">
                  Perfect Room
                </span>
              </h1>
              <motion.p
                className="text-slate-500 text-sm mt-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {total > 0
                  ? `${total.toLocaleString()} verified ${locationActive ? `properties within ${filters.radius} km` : "properties available"}`
                  : "Browse verified listings across Nepal"}
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-2xl mx-auto flex gap-2"
            >
              {/* Search input */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-red-400" />
                <Input
                  type="search"
                  placeholder="Search by location or property name…"
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-9 h-11 rounded-xl border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white transition-all"
                />
                <AnimatePresence>
                  {searchInput && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        setSearchInput("");
                        updateFilters({ search: "" });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
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
                  "h-11 w-11 rounded-xl border-slate-200 shrink-0 transition-all cursor-pointer",
                  locationActive
                    ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100 shadow-sm shadow-red-100"
                    : "hover:border-red-300 hover:text-red-600",
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
            </motion.div>

            {/* Location banner (DO NOT TOUCH) */}
            <AnimatePresence>
              {locationActive && (
                <motion.p
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-center text-xs text-red-600 flex items-center justify-center gap-1"
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
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent shadow-md shadow-red-200/60"
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
                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent shadow-md shadow-red-200/60"
                        : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600",
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: "auto" }}
                          exit={{ opacity: 0, scale: 0.5, width: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <Check className="w-3 h-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
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
                    {initialLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        Searching…
                      </span>
                    ) : (
                      <motion.span
                        key={total}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {total.toLocaleString()} room{total !== 1 ? "s" : ""}{" "}
                        found
                      </motion.span>
                    )}
                  </p>

                  <AnimatePresence>
                    {hasActiveFilters && !initialLoading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1.5 mt-2 overflow-hidden"
                      >
                        {filters.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="gap-1 text-xs pr-1 bg-red-50 text-red-700 border border-red-200"
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
                            className="gap-1 text-xs pr-1 bg-red-50 text-red-700 border border-red-200"
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
                            className="gap-1 text-xs pr-1 bg-pink-50 text-pink-700 border border-pink-200"
                          >
                            ♀ Women OK
                            <button
                              onClick={() =>
                                updateFilters({ allowsWomen: null })
                              }
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
                            className="gap-1 text-xs pr-1 bg-blue-50 text-blue-700 border border-blue-200"
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
                          className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 cursor-pointer transition-colors"
                        >
                          Clear all
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        <AnimatePresence>
                          {activeFilterCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                            >
                              {activeFilterCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
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
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
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
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 px-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
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
                      className="cursor-pointer hover:border-red-300 hover:text-red-600"
                    >
                      Clear All Filters
                    </Button>
                  </motion.div>
                ) : (
                  /* ── Infinite grid — key stays constant so the grid persists ── */
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {/* Existing cards — no re-animation */}
                      {rooms.map((room, i) => (
                        <AnimatedCard
                          key={room.id}
                          room={room}
                          index={i}
                          isNew={newRoomIds.has(room.id)}
                        />
                      ))}

                      {/* Inline skeleton placeholders while loading next batch */}
                      {loadingMore && (
                        <InlineSkeletonRow
                          count={Math.min(PAGE_SIZE, total - rooms.length)}
                        />
                      )}
                    </div>

                    {/* Footer: progress + indicator */}
                    <LoadMoreIndicator
                      hasMore={hasMore}
                      loadingMore={loadingMore}
                      loaded={rooms.length}
                      total={total}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/*
               * SENTINEL — lives OUTSIDE AnimatePresence so it is ALWAYS in the DOM.
               * The IntersectionObserver (set up once on mount) always has a target.
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
      <div className="min-h-screen bg-[#f8f8fa] pt-24">
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
