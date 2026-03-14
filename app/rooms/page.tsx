"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Grid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  IndianRupee,
  Compass,
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/rooms/PropertyCard";
import { FilterSidebar } from "@/components/rooms/FilterSidebar";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { useRooms } from "@/hooks/use-rooms";
import { RoomFilters, RoomCategory } from "@/types/room.types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = "price-low-to-high" | "price-high-to-low" | "default";
type ViewMode = "grid" | "list";

interface FilterState {
  selectedCategories: string[];
  sort: SortOption;
  page: number;
  itemsPerPage: number;
  search: string;
  minPrice: number;
  maxPrice: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterState = {
  selectedCategories: [],
  sort: "default",
  page: 0,
  itemsPerPage: 12,
  search: "",
  minPrice: 0,
  maxPrice: 100000,
};

const CATEGORY_LABELS: Record<string, string> = {
  [RoomCategory.FLAT]: "Flat",
  [RoomCategory.SINGLE]: "Single Room",
  [RoomCategory.APARTMENT]: "Apartment",
  [RoomCategory.SHARED]: "Shared Room",
  [RoomCategory.DOUBLE]: "Double Room",
  [RoomCategory.HOUSE]: "House",
  [RoomCategory.ATTACHED_BATHROOM]: "Attached Bathroom",
  [RoomCategory.SHUTTER]: "Shutter",
  [RoomCategory.HOTEL]: "Hotel",
  [RoomCategory.OFFICE_SPACE]: "Office Space",
  [RoomCategory.HOSTEL]: "Hostel",
};

// ─── Page skeleton shown while Suspense resolves ─────────────────────────────

function RoomsPageSkeleton() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero skeleton */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Skeleton className="h-12 w-96 mx-auto" />
              <Skeleton className="h-5 w-64 mx-auto" />
              <Skeleton className="h-14 w-full max-w-2xl mx-auto rounded-full" />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            {/* Cards skeleton */}
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card
                    key={i}
                    className="overflow-hidden border-0 shadow-sm rounded-2xl"
                  >
                    <Skeleton className="h-52 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3.5 w-1/2" />
                      <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-3.5" />
                        <Skeleton className="h-3.5" />
                        <Skeleton className="h-3.5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// ─── Inner content (uses useSearchParams — must be inside Suspense) ───────────

function RoomsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // <-- requires Suspense boundary

  const categoryParam = searchParams?.get("category") ?? "";
  const searchQueryParam = searchParams?.get("search") ?? "";
  const minPriceParam = searchParams?.get("minPrice");
  const maxPriceParam = searchParams?.get("maxPrice");

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchInput, setSearchInput] = useState(searchQueryParam);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    selectedCategories: categoryParam ? [categoryParam] : [],
    minPrice: minPriceParam ? parseInt(minPriceParam, 10) : 0,
    maxPrice: maxPriceParam ? parseInt(maxPriceParam, 10) : 100000,
    search: searchQueryParam,
  }));

  // ── Build API filters ──
  const apiFilters: RoomFilters = {
    page: filters.page,
    take: filters.itemsPerPage,
    ...(filters.selectedCategories.length > 0 && {
      category: filters.selectedCategories[0] as RoomCategory,
    }),
    ...(filters.search.trim() && { search: filters.search.trim() }),
    ...(filters.minPrice > 0 && { minPrice: filters.minPrice }),
    ...(filters.maxPrice < 100000 && { maxPrice: filters.maxPrice }),
  };

  // rawRooms is Room[] — passed directly to PropertyCard (fixes TS2740)
  const { rawRooms, loading, error, pagination, refetch } =
    useRooms(apiFilters);

  // ── Sync URL ──
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.selectedCategories.length === 1)
      params.set("category", filters.selectedCategories[0]);
    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice < 100000)
      params.set("maxPrice", String(filters.maxPrice));

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    filters.selectedCategories,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    pathname,
    router,
  ]);

  // ── Cleanup debounce ──
  useEffect(
    () => () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    },
    [],
  );

  // ── Handlers ──

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(
      () => setFilters((prev) => ({ ...prev, search: value, page: 0 })),
      450,
    );
  };

  const clearSearch = () => {
    setSearchInput("");
    setFilters((prev) => ({ ...prev, search: "", page: 0 }));
  };

  const handleFilterChange = useCallback(
    (filterValues: Record<string, any>) => {
      setFilters((prev) => ({
        ...prev,
        minPrice:
          filterValues.minPrice !== undefined
            ? filterValues.minPrice
            : prev.minPrice,
        maxPrice:
          filterValues.maxPrice !== undefined
            ? filterValues.maxPrice
            : prev.maxPrice,
        selectedCategories: filterValues.category
          ? [filterValues.category]
          : [],
        page: 0,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const handleSortChange = useCallback((sortValue: SortOption) => {
    setFilters((prev) => ({ ...prev, sort: sortValue, page: 0 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, itemsPerPage: Number(value), page: 0 }));
  }, []);

  const removeFilter = useCallback(
    (type: "category" | "search" | "price", value?: string) => {
      setFilters((prev) => {
        if (type === "category" && value)
          return {
            ...prev,
            selectedCategories: prev.selectedCategories.filter(
              (c) => c !== value,
            ),
            page: 0,
          };
        if (type === "search") {
          setSearchInput("");
          return { ...prev, search: "", page: 0 };
        }
        if (type === "price")
          return { ...prev, minPrice: 0, maxPrice: 100000, page: 0 };
        return prev;
      });
    },
    [],
  );

  // ── Derived ──

  const totalPages = Math.ceil((pagination?.total ?? 0) / filters.itemsPerPage);

  const sortedRooms = [...rawRooms].sort((a, b) => {
    if (filters.sort === "price-low-to-high") return a.price - b.price;
    if (filters.sort === "price-high-to-low") return b.price - a.price;
    return 0;
  });

  const hasActiveFilters =
    filters.selectedCategories.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 100000 ||
    !!filters.search;

  // ── Error state ──
  if (error) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-gray-50 pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <Compass
              className="h-16 w-16 text-gray-300 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* ── Hero / Search ── */}
        <header className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                Find Your Perfect{" "}
                <span className="text-primary">Living Space</span>
              </h1>
              <p className="text-base md:text-lg text-gray-500 mb-8">
                Discover thousands of verified rooms across Nepal
              </p>

              <div className="relative max-w-2xl mx-auto">
                <label htmlFor="room-search" className="sr-only">
                  Search by location or property name
                </label>
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="room-search"
                  type="search"
                  placeholder="Search by location or property name…"
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-12 pr-10 py-6 text-base bg-white/90 backdrop-blur-sm border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-primary/20"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </header>

        {/* ── Main Layout ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar */}
            <FilterSidebar
              onFilterChange={handleFilterChange}
              initialFilters={{
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                category: filters.selectedCategories,
              }}
              totalResults={pagination?.total ?? 0}
            />

            {/* Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Controls bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                      {filters.selectedCategories.length === 1
                        ? (CATEGORY_LABELS[filters.selectedCategories[0]] ??
                          "Rooms")
                        : "All Rooms"}
                    </h2>
                    <p
                      className="text-sm text-gray-500 mt-0.5"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {loading
                        ? "Searching…"
                        : `${pagination?.total ?? 0} rooms found`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View toggle */}
                    <div
                      className="hidden sm:flex border border-gray-200 rounded-lg p-1 gap-0.5"
                      role="group"
                      aria-label="View mode"
                    >
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8 p-0"
                        aria-label="Grid view"
                        aria-pressed={viewMode === "grid"}
                      >
                        <Grid className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8 p-0"
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                      >
                        <List className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>

                    {/* Sort */}
                    <Select
                      value={filters.sort}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger
                        className="w-44 h-9 text-sm"
                        aria-label="Sort rooms"
                      >
                        <ArrowUpDown
                          className="mr-2 h-3.5 w-3.5 text-gray-400"
                          aria-hidden="true"
                        />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="price-low-to-high">
                          Price: Low → High
                        </SelectItem>
                        <SelectItem value="price-high-to-low">
                          Price: High → Low
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                  <div
                    className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100"
                    aria-label="Active filters"
                  >
                    {filters.selectedCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="gap-1 pl-2 pr-1.5 py-1 text-xs font-normal"
                      >
                        {CATEGORY_LABELS[cat] ?? cat}
                        <button
                          type="button"
                          onClick={() => removeFilter("category", cat)}
                          aria-label={`Remove ${CATEGORY_LABELS[cat] ?? cat} filter`}
                          className="ml-0.5 rounded-full hover:text-gray-700"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    ))}

                    {(filters.minPrice > 0 || filters.maxPrice < 100000) && (
                      <Badge
                        variant="secondary"
                        className="gap-1 pl-2 pr-1.5 py-1 text-xs font-normal"
                      >
                        <IndianRupee className="h-3 w-3" aria-hidden="true" />
                        {filters.minPrice.toLocaleString()} –{" "}
                        {filters.maxPrice.toLocaleString()}
                        <button
                          type="button"
                          onClick={() => removeFilter("price")}
                          aria-label="Remove price filter"
                          className="ml-0.5 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    )}

                    {filters.search && (
                      <Badge
                        variant="secondary"
                        className="gap-1 pl-2 pr-1.5 py-1 text-xs font-normal"
                      >
                        "{filters.search}"
                        <button
                          type="button"
                          onClick={() => removeFilter("search")}
                          aria-label="Remove search filter"
                          className="ml-0.5 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs text-gray-400 hover:text-gray-700 h-auto py-1 px-2"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {/* ── Room Grid / Skeletons / Empty ── */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "grid gap-5",
                      viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-1",
                    )}
                    aria-busy="true"
                    aria-label="Loading rooms"
                  >
                    {Array.from({
                      length: Math.min(filters.itemsPerPage, 12),
                    }).map((_, i) => (
                      <Card
                        key={i}
                        className="overflow-hidden border-0 shadow-sm rounded-2xl"
                      >
                        <Skeleton className="h-52 w-full rounded-none" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3.5 w-1/2" />
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <Skeleton className="h-3.5" />
                            <Skeleton className="h-3.5" />
                            <Skeleton className="h-3.5" />
                          </div>
                          <Skeleton className="h-8 w-full mt-2" />
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                ) : sortedRooms.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 px-8 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <Search
                      className="h-14 w-14 text-gray-200 mx-auto mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      No rooms found
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Try adjusting your filters or search terms
                    </p>
                    <Button onClick={resetFilters} variant="outline" size="sm">
                      Clear All Filters
                    </Button>
                  </motion.div>
                ) : (
                  <motion.ul
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "grid gap-5 list-none p-0 m-0",
                      viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-1",
                    )}
                    aria-label="Room listings"
                  >
                    {sortedRooms.map((room, i) => (
                      <li key={room.id}>
                        <PropertyCard room={room} index={i} />
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              {/* ── Pagination ── */}
              {!loading && sortedRooms.length > 0 && totalPages > 1 && (
                <motion.nav
                  aria-label="Room listings pagination"
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page <= 0}
                        onClick={() => handlePageChange(filters.page - 1)}
                        aria-label="Previous page"
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Prev</span>
                      </Button>

                      {/* Sliding page number pills */}
                      <div className="flex items-center gap-1" role="list">
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let page: number;
                            if (totalPages <= 5) {
                              page = i;
                            } else if (filters.page < 3) {
                              page = i;
                            } else if (filters.page > totalPages - 4) {
                              page = totalPages - 5 + i;
                            } else {
                              page = filters.page - 2 + i;
                            }
                            return (
                              <button
                                key={page}
                                type="button"
                                onClick={() => handlePageChange(page)}
                                aria-label={`Page ${page + 1}`}
                                aria-current={
                                  filters.page === page ? "page" : undefined
                                }
                                className={cn(
                                  "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                  filters.page === page
                                    ? "bg-primary text-white"
                                    : "text-gray-600 hover:bg-gray-100",
                                )}
                              >
                                {page + 1}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page >= totalPages - 1}
                        onClick={() => handlePageChange(filters.page + 1)}
                        aria-label="Next page"
                        className="gap-1"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Label
                        htmlFor="per-page"
                        className="whitespace-nowrap cursor-pointer"
                      >
                        Show
                      </Label>
                      <Select
                        value={String(filters.itemsPerPage)}
                        onValueChange={handleItemsPerPageChange}
                      >
                        <SelectTrigger
                          id="per-page"
                          className="w-16 h-8 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[12, 24, 36, 48].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="whitespace-nowrap">per page</span>
                    </div>
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

// ─── Default export — wraps RoomsContent in the required Suspense boundary ───
//
// Next.js requires any component that calls useSearchParams() to be wrapped
// in <Suspense> during static/SSR prerendering. Without this the build fails
// with "useSearchParams() should be wrapped in a suspense boundary".

export default function RoomsPage() {
  return (
    <Suspense fallback={<RoomsPageSkeleton />}>
      <RoomsContent />
    </Suspense>
  );
}
