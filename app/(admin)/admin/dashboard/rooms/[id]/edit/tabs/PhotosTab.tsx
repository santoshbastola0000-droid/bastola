"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/Formprimitives";
import { resolveImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PhotosTabProps {
  existingImages: string[];
  newImagePreviews: string[];
  removedImages: string[];
  uploadProgress: number;
  onRemoveExisting: (url: string) => void;
  onAddNew: (files: File[], category: string) => void;
  onRemoveNew: (index: number) => void;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE_MB = 10;

const CATEGORY_CONFIG = {
  Room: {
    emoji: "🛏️",
    labelEn: "Room Photos",
    labelNp: "कोठाका तस्बिरहरू",
    maxCount: 4,
    order: 1,
  },
  Toilet: {
    emoji: "🚽",
    labelEn: "Toilet Photos",
    labelNp: "शौचालयका तस्बिरहरू",
    maxCount: 1,
    order: 2,
  },
  Bathroom: {
    emoji: "🚿",
    labelEn: "Bathroom Photos",
    labelNp: "नुहाउने कोठाका तस्बिरहरू",
    maxCount: 1,
    order: 3,
  },
  Outside: {
    emoji: "🏘️",
    labelEn: "Outside Photos",
    labelNp: "बाहिरी तस्बिरहरू",
    maxCount: 2,
    order: 4,
  },
};

// Helper to detect category from image URL (for existing images)
const detectImageCategory = (url: string, index: number): string => {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("toilet") || urlLower.includes("शौचालय"))
    return "Toilet";
  if (urlLower.includes("bathroom") || urlLower.includes("नुहाउने"))
    return "Bathroom";
  if (
    urlLower.includes("outside") ||
    urlLower.includes("बाहिरी") ||
    urlLower.includes("exterior")
  )
    return "Outside";
  if (urlLower.includes("room") || urlLower.includes("कोठा")) return "Room";

  // Default based on index pattern (assumes upload order: Room(4), Toilet(1), Bathroom(1), Outside(2))
  if (index < 4) return "Room";
  if (index < 5) return "Toilet";
  if (index < 6) return "Bathroom";
  if (index < 8) return "Outside";

  return "Room";
};

export function PhotosTab({
  existingImages,
  newImagePreviews,
  removedImages,
  uploadProgress,
  onRemoveExisting,
  onAddNew,
  onRemoveNew,
}: PhotosTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Room");

  const totalImages = existingImages.length + newImagePreviews.length;

  // Track which category each new image belongs to (stored as metadata)
  const [newImageCategories, setNewImageCategories] = useState<
    Record<number, string>
  >({});

  // Categorize existing images (filter out removed ones)
  const getExistingImagesByCategory = (category: string) => {
    return existingImages
      .filter((url) => !removedImages.includes(url))
      .filter((url, idx) => detectImageCategory(url, idx) === category);
  };

  const getNewImagesByCategory = (category: string) => {
    return newImagePreviews.filter(
      (_, idx) => newImageCategories[idx] === category,
    );
  };

  const getTotalCount = (category: string) => {
    return (
      getExistingImagesByCategory(category).length +
      getNewImagesByCategory(category).length
    );
  };

  const isCategoryComplete = (category: string) => {
    const maxCount =
      CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].maxCount;
    return getTotalCount(category) >= maxCount;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(
      (f) =>
        f.size <= MAX_FILE_SIZE_MB * 1024 * 1024 && f.type.startsWith("image/"),
    );
    const oversized = files.filter(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );

    if (oversized.length > 0) {
      toast.warning(
        `${oversized.length} file(s) exceed ${MAX_FILE_SIZE_MB}MB and were skipped`,
      );
    }

    // Check category limit
    const currentCount = getTotalCount(selectedCategory);
    const maxCount =
      CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG]
        .maxCount;
    const remainingSlots = maxCount - currentCount;

    if (valid.length > remainingSlots) {
      toast.warning(
        `Only ${remainingSlots} more photo(s) allowed for ${selectedCategory} / ${CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG].labelNp} को लागि मात्र ${remainingSlots} थप तस्बिरहरू अनुमति छ`,
        { duration: 3000 },
      );
    }

    const filesToAdd = valid.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      const startIndex = newImagePreviews.length;
      // Store categories for new images
      const newCategories: Record<number, string> = {};
      for (let i = 0; i < filesToAdd.length; i++) {
        newCategories[startIndex + i] = selectedCategory;
      }
      setNewImageCategories((prev) => ({ ...prev, ...newCategories }));
      onAddNew(filesToAdd, selectedCategory);
    }

    e.target.value = "";
  };

  const handleRemoveNewWithCategory = (index: number) => {
    // Remove from categories record
    setNewImageCategories((prev) => {
      const newState = { ...prev };
      delete newState[index];
      // Re-index remaining items
      const reindexed: Record<number, string> = {};
      let newIdx = 0;
      for (let i = 0; i < newImagePreviews.length; i++) {
        if (i !== index) {
          reindexed[newIdx] = prev[i] || "Room";
          newIdx++;
        }
      }
      return reindexed;
    });
    onRemoveNew(index);
  };

  const totalPhotosByCategory = Object.keys(CATEGORY_CONFIG).reduce(
    (acc, cat) => {
      acc[cat] = getTotalCount(cat);
      return acc;
    },
    {} as Record<string, number>,
  );

  const completedCategories = Object.keys(CATEGORY_CONFIG).filter((cat) =>
    isCategoryComplete(cat),
  ).length;
  const totalCategories = Object.keys(CATEGORY_CONFIG).length;
  const allCategoriesComplete = completedCategories === totalCategories;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={ImageIcon}
        title="Room Photos / कोठाका फोटोहरू"
        subtitle="Good photos attract 3x more tenants · राम्रो फोटोले ३ गुणा बढी भाडाटारु ल्याउँछ"
      />

      {/* Photo Requirements Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const currentCount = getTotalCount(category);
          const isComplete = currentCount >= config.maxCount;
          return (
            <div
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer",
                isComplete
                  ? "bg-green-50 border-green-300"
                  : selectedCategory === category
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-amber-50 border-amber-200 hover:bg-amber-100",
              )}
            >
              <span className="text-2xl" aria-hidden>
                {config.emoji}
              </span>
              <p className="text-xs font-bold text-slate-700">
                {config.labelEn}
              </p>
              <p className="text-[10px] text-slate-500">{config.labelNp}</p>
              <div className="flex items-center gap-1 mt-1">
                <Badge
                  variant={isComplete ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-2 py-0",
                    isComplete
                      ? "bg-green-600 text-white"
                      : selectedCategory === category
                        ? "bg-primary text-white"
                        : "bg-amber-100 text-amber-700",
                  )}
                >
                  {currentCount}/{config.maxCount}
                </Badge>
                {isComplete && (
                  <CheckCircle2
                    className="w-3 h-3 text-green-600"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary pill with category progress */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-800">
              {totalImages} / {MAX_PHOTOS}
            </span>
            <span className="text-xs text-blue-600">photos total</span>
            <Badge
              className={cn(
                "text-[10px] ml-2",
                allCategoriesComplete ? "bg-green-600" : "bg-primary",
              )}
            >
              {completedCategories}/{totalCategories} categories
            </Badge>
          </div>
          <Progress
            value={(totalImages / MAX_PHOTOS) * 100}
            className="h-1.5 mt-1.5 bg-blue-200"
          />
        </div>
        <div className="text-right text-xs text-blue-600 flex-shrink-0">
          <p>
            {
              existingImages.filter((url) => !removedImages.includes(url))
                .length
            }{" "}
            existing
          </p>
          <p>{newImagePreviews.length} new</p>
        </div>
      </div>

      {/* Existing images by category */}
      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
        const existingInCategory = getExistingImagesByCategory(category);
        if (existingInCategory.length === 0) return null;

        return (
          <section key={`existing-${category}`} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.emoji}</span>
              <p className="text-sm font-semibold text-slate-700">
                {config.labelEn} / {config.labelNp}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {existingInCategory.length}/{config.maxCount}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {existingInCategory.map((img, i) => {
                const globalIndex = existingImages.findIndex(
                  (url) => url === img,
                );
                return (
                  <div key={img} className="relative group aspect-square">
                    <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-red-300 transition-colors">
                      <img
                        src={resolveImageUrl(img)}
                        alt={`${category} photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-image.jpg";
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveExisting(img)}
                      aria-label={`Remove ${category} photo ${i + 1}`}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 hover:scale-110"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0"
                      >
                        {i === 0 && category === "Room"
                          ? "Main"
                          : `${category.slice(0, 1)}${i + 1}`}
                      </Badge>
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-blue-600/80 text-white border-0">
                        Existing
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Upload button with category selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        aria-label="Add new photos"
      />

      {totalImages < MAX_PHOTOS && !allCategoriesComplete ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 text-center">
            Selected category:{" "}
            <span className="font-bold text-primary">{selectedCategory}</span> /{" "}
            {
              CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG]
                ?.labelNp
            }
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                Add {selectedCategory} Photos /{" "}
                {
                  CATEGORY_CONFIG[
                    selectedCategory as keyof typeof CATEGORY_CONFIG
                  ]?.labelNp
                }{" "}
                थप्नुहोस्
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {getTotalCount(selectedCategory)}/
                {
                  CATEGORY_CONFIG[
                    selectedCategory as keyof typeof CATEGORY_CONFIG
                  ]?.maxCount
                }{" "}
                uploaded · Max {MAX_FILE_SIZE_MB}MB each
              </p>
            </div>
          </button>
        </div>
      ) : totalImages >= MAX_PHOTOS ? (
        <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-slate-400">
            Maximum photos reached / अधिकतम फोटो पुग्यो
          </p>
        </div>
      ) : (
        allCategoriesComplete && (
          <div className="w-full border-2 border-green-200 bg-green-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-700">
                All photo requirements met! / सबै फोटो आवश्यकताहरू पूरा भए!
              </p>
            </div>
          </div>
        )
      )}

      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Processing photos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* New image previews by category */}
      {newImagePreviews.length > 0 && (
        <section className="space-y-3">
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
            const newInCategory = getNewImagesByCategory(category);
            if (newInCategory.length === 0) return null;

            return (
              <div key={`new-${category}`} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <p className="text-sm font-semibold text-slate-700">
                    New {config.labelEn} / नयाँ {config.labelNp}
                  </p>
                  <Badge className="text-[10px] bg-green-500 text-white">
                    {newInCategory.length}/
                    {config.maxCount -
                      getExistingImagesByCategory(category).length}{" "}
                    remaining slots
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {newInCategory.map((preview, idx) => {
                    const globalIndex = newImagePreviews.findIndex(
                      (p) => p === preview,
                    );
                    return (
                      <motion.div
                        key={globalIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group aspect-square"
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden border-2 border-green-200 group-hover:border-red-300 transition-colors">
                          <img
                            src={preview}
                            alt={`New ${category} photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveNewWithCategory(globalIndex)
                          }
                          aria-label={`Remove new ${category} photo ${idx + 1}`}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 hover:scale-110"
                        >
                          <XCircle className="w-4 h-4" aria-hidden />
                        </button>
                        <div className="absolute top-1.5 left-1.5">
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-green-500 text-white border-0">
                            New
                          </Badge>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5">
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0">
                            {category.slice(0, 1)}
                            {idx + 1}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Removed images warning */}
      {removedImages.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">
            <strong>{removedImages.length}</strong> photo
            {removedImages.length !== 1 ? "s" : ""} will be permanently removed
            when you save changes.
          </p>
        </div>
      )}

      {/* Category completion summary */}
      {!allCategoriesComplete && totalImages > 0 && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700 font-semibold mb-2">
            Remaining photos needed / बाँकी तस्बिरहरू:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
              const remaining = config.maxCount - getTotalCount(category);
              if (remaining <= 0) return null;
              return (
                <Badge
                  key={category}
                  variant="outline"
                  className="bg-amber-100 text-amber-700 border-amber-200"
                >
                  {config.emoji} {remaining} more {category} photo
                  {remaining !== 1 ? "s" : ""}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
