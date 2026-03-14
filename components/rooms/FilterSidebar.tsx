"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Home,
  Building,
  DoorOpen,
  Users,
  Bath,
  Warehouse,
  Hotel,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RoomCategory } from "@/types/room.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  totalResults: number;
}

interface CategoryItem {
  value: RoomCategory;
  label: string;
  icon: LucideIcon;
}

interface FilterContentProps {
  priceRange: [number, number];
  tempPriceRange: [number, number];
  minPriceInput: string;
  maxPriceInput: string;
  selectedCategories: string[];
  expandedSections: { price: boolean; categories: boolean };
  activeFiltersCount: number;
  totalResults: number;
  onToggleSection: (section: "price" | "categories") => void;
  onSliderChange: (value: number[]) => void;
  onMinPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMinPriceBlur: () => void;
  onMaxPriceBlur: () => void;
  onApplyPrice: () => void;
  onCategoryChange: (
    category: string,
    checked: boolean | "indeterminate",
  ) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryItem[] = [
  { value: RoomCategory.FLAT, label: "Flat", icon: Building },
  { value: RoomCategory.SINGLE, label: "Single Room", icon: DoorOpen },
  { value: RoomCategory.APARTMENT, label: "Apartment", icon: Building },
  { value: RoomCategory.SHARED, label: "Shared Room", icon: Users },
  { value: RoomCategory.DOUBLE, label: "Double Room", icon: Users },
  { value: RoomCategory.HOUSE, label: "House", icon: Home },
  {
    value: RoomCategory.ATTACHED_BATHROOM,
    label: "Attached Bathroom",
    icon: Bath,
  },
  { value: RoomCategory.SHUTTER, label: "Shutter", icon: Warehouse },
  { value: RoomCategory.HOTEL, label: "Hotel", icon: Hotel },
  { value: RoomCategory.OFFICE_SPACE, label: "Office Space", icon: Briefcase },
  { value: RoomCategory.HOSTEL, label: "Hostel", icon: Building },
];

// ─── FilterContent (extracted outside parent to prevent remount on re-render) ─

/**
 * CRITICAL FIX: This component must be defined OUTSIDE FilterSidebar.
 * Defining it inside causes React to treat it as a new component type on every
 * render, unmounting + remounting the DOM (including inputs), which causes the
 * cursor-jump / blink / losing-focus bugs.
 */
function FilterContent({
  priceRange,
  tempPriceRange,
  minPriceInput,
  maxPriceInput,
  selectedCategories,
  expandedSections,
  activeFiltersCount,
  totalResults,
  onToggleSection,
  onSliderChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinPriceBlur,
  onMaxPriceBlur,
  onApplyPrice,
  onCategoryChange,
  onApplyFilters,
  onClearFilters,
}: FilterContentProps) {
  const priceIsCustom = priceRange[0] > 0 || priceRange[1] < 100000;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-base">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-primary hover:text-primary/80 h-auto py-1 px-2"
          >
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* ── Price Range ── */}
      <section aria-labelledby="price-filter-heading" className="space-y-3">
        <button
          id="price-filter-heading"
          type="button"
          onClick={() => onToggleSection("price")}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={expandedSections.price}
        >
          <span className="font-medium text-gray-900 text-sm">Price Range</span>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expandedSections.price && (
            <motion.div
              key="price-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-1">
                {/* Current range display */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>₹{tempPriceRange[0].toLocaleString()}</span>
                  <span>
                    {tempPriceRange[1] >= 100000
                      ? "₹1,00,000+"
                      : `₹${tempPriceRange[1].toLocaleString()}`}
                  </span>
                </div>

                <Slider
                  min={0}
                  max={100000}
                  step={1000}
                  value={[tempPriceRange[0], tempPriceRange[1]]}
                  onValueChange={onSliderChange}
                  className="py-2"
                  aria-label="Price range slider"
                />

                {/* Manual inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="min-price"
                      className="text-xs text-gray-500 mb-1 block"
                    >
                      Min (₹)
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      <Input
                        id="min-price"
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={minPriceInput}
                        onChange={onMinPriceChange}
                        onBlur={onMinPriceBlur}
                        min={0}
                        max={100000}
                        className="pl-7 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="max-price"
                      className="text-xs text-gray-500 mb-1 block"
                    >
                      Max (₹)
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      <Input
                        id="max-price"
                        type="number"
                        inputMode="numeric"
                        placeholder="Any"
                        value={maxPriceInput}
                        onChange={onMaxPriceChange}
                        onBlur={onMaxPriceBlur}
                        min={0}
                        max={100000}
                        className="pl-7 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={onApplyPrice}
                  size="sm"
                  variant={priceIsCustom ? "default" : "outline"}
                  className="w-full text-xs"
                >
                  Apply Price Range
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Separator />

      {/* ── Categories ── */}
      <section aria-labelledby="category-filter-heading" className="space-y-3">
        <button
          id="category-filter-heading"
          type="button"
          onClick={() => onToggleSection("categories")}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={expandedSections.categories}
        >
          <span className="font-medium text-gray-900 text-sm">
            Property Type
          </span>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expandedSections.categories && (
            <motion.div
              key="categories-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul
                role="list"
                className="space-y-0.5 pt-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin"
                aria-label="Property type filters"
              >
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isChecked = selectedCategories.includes(cat.value);
                  return (
                    <li key={cat.value}>
                      <label className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors select-none">
                        <Checkbox
                          id={`cat-${cat.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            onCategoryChange(cat.value, checked)
                          }
                          className="flex-shrink-0"
                        />
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 transition-colors ${
                            isChecked ? "text-primary" : "text-gray-400"
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-sm flex-1 transition-colors ${
                            isChecked
                              ? "text-gray-900 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {cat.label}
                        </span>
                        {isChecked && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Separator />

      {/* ── Apply Button ── */}
      <Button
        type="button"
        onClick={onApplyFilters}
        className="w-full bg-primary hover:bg-primary/90"
        size="default"
      >
        <span>Show Results</span>
        <Badge
          variant="secondary"
          className="ml-2 bg-white/20 text-white border-0 text-xs font-normal pointer-events-none"
        >
          {totalResults}
        </Badge>
      </Button>
    </div>
  );
}

// ─── FilterSidebar ─────────────────────────────────────────────────────────────

export function FilterSidebar({
  onFilterChange,
  initialFilters,
  totalResults,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Committed (applied) price range
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  // Temporary (in-progress) price range while slider/inputs are being adjusted
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([
    0, 100000,
  ]);
  // Raw string values for the inputs — avoids the cursor-jump caused by
  // converting number→string on every keystroke
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    categories: true,
  });

  // ── Initialise from URL / parent props (runs once) ──
  useEffect(() => {
    if (!initialFilters) return;

    if (
      initialFilters.minPrice !== undefined ||
      initialFilters.maxPrice !== undefined
    ) {
      const min = initialFilters.minPrice ?? 0;
      const max = initialFilters.maxPrice ?? 100000;
      setPriceRange([min, max]);
      setTempPriceRange([min, max]);
      setMinPriceInput(min === 0 ? "" : String(min));
      setMaxPriceInput(max === 100000 ? "" : String(max));
    }

    if (initialFilters.category) {
      const cats = Array.isArray(initialFilters.category)
        ? initialFilters.category
        : [initialFilters.category];
      setSelectedCategories(cats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once — avoids resetting local state on every parent re-render

  // ── Handlers ──

  const handleToggleSection = useCallback((section: "price" | "categories") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSliderChange = useCallback((value: number[]) => {
    const [min, max] = value as [number, number];
    setTempPriceRange([min, max]);
    setMinPriceInput(min === 0 ? "" : String(min));
    setMaxPriceInput(max === 100000 ? "" : String(max));
  }, []);

  const handleMinPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setMinPriceInput(raw); // keep raw string so cursor never jumps
      const num = raw === "" ? 0 : Number(raw);
      if (!isNaN(num)) {
        setTempPriceRange((prev) => [Math.max(0, num), prev[1]]);
      }
    },
    [],
  );

  const handleMaxPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setMaxPriceInput(raw);
      const num = raw === "" ? 100000 : Number(raw);
      if (!isNaN(num)) {
        setTempPriceRange((prev) => [prev[0], Math.min(100000, num)]);
      }
    },
    [],
  );

  const handleMinPriceBlur = useCallback(() => {
    if (minPriceInput === "") setTempPriceRange((prev) => [0, prev[1]]);
  }, [minPriceInput]);

  const handleMaxPriceBlur = useCallback(() => {
    if (maxPriceInput === "") setTempPriceRange((prev) => [prev[0], 100000]);
  }, [maxPriceInput]);

  const handleApplyPrice = useCallback(() => {
    setPriceRange(tempPriceRange);
  }, [tempPriceRange]);

  /**
   * CATEGORY FIX: auto-apply when a category is toggled so users don't need
   * to remember to click "Apply Filters" separately for categories.
   */
  const handleCategoryChange = useCallback(
    (category: string, checked: boolean | "indeterminate") => {
      if (typeof checked !== "boolean") return;

      setSelectedCategories((prev) => {
        const next = checked
          ? [...prev, category]
          : prev.filter((c) => c !== category);

        // Immediately notify parent — no extra button click needed
        const filters: Record<string, any> = {};
        if (priceRange[0] > 0 || priceRange[1] < 100000) {
          filters.minPrice = priceRange[0];
          filters.maxPrice = priceRange[1];
        }
        if (next.length > 0) {
          filters.category = next[0]; // backend supports single category
        }
        onFilterChange(filters);

        return next;
      });
    },
    [priceRange, onFilterChange],
  );

  const handleApplyFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (priceRange[0] > 0 || priceRange[1] < 100000) {
      filters.minPrice = priceRange[0];
      filters.maxPrice = priceRange[1];
    }
    if (selectedCategories.length > 0) {
      filters.category = selectedCategories[0];
    }
    onFilterChange(filters);
    setIsOpen(false);
  }, [priceRange, selectedCategories, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setPriceRange([0, 100000]);
    setTempPriceRange([0, 100000]);
    setMinPriceInput("");
    setMaxPriceInput("");
    setSelectedCategories([]);
    onFilterChange({});
  }, [onFilterChange]);

  const activeFiltersCount =
    selectedCategories.length +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);

  // Shared props passed to FilterContent
  const filterContentProps: FilterContentProps = {
    priceRange,
    tempPriceRange,
    minPriceInput,
    maxPriceInput,
    selectedCategories,
    expandedSections,
    activeFiltersCount,
    totalResults,
    onToggleSection: handleToggleSection,
    onSliderChange: handleSliderChange,
    onMinPriceChange: handleMinPriceChange,
    onMaxPriceChange: handleMaxPriceChange,
    onMinPriceBlur: handleMinPriceBlur,
    onMaxPriceBlur: handleMaxPriceBlur,
    onApplyPrice: handleApplyPrice,
    onCategoryChange: handleCategoryChange,
    onApplyFilters: handleApplyFilters,
    onClearFilters: handleClearFilters,
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        aria-label="Property filters"
        className="hidden lg:block lg:col-span-1"
      >
        <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <FilterContent {...filterContentProps} />
        </div>
      </aside>

      {/* ── Mobile Floating Button + Sheet ── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90 shadow-xl rounded-full px-6 py-5 gap-2"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge className="bg-white text-primary border-0 text-xs font-semibold px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="h-[90dvh] rounded-t-3xl p-0 flex flex-col"
          >
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-semibold">
                  Filter Properties
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterContent {...filterContentProps} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
