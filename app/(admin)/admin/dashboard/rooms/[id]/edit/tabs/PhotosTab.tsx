"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/Formprimitives";
import { resolveImageUrl } from "@/lib/utils";

interface PhotosTabProps {
  existingImages: string[];
  newImagePreviews: string[];
  removedImages: string[];
  uploadProgress: number;
  onRemoveExisting: (url: string) => void;
  onAddNew: (files: File[]) => void;
  onRemoveNew: (index: number) => void;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE_MB = 10;

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
  const totalImages = existingImages.length + newImagePreviews.length;

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

    const totalAfter = totalImages + valid.length;
    if (totalAfter > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    if (valid.length > 0) {
      onAddNew(valid);
    }

    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={ImageIcon}
        title="Room Photos / कोठाका फोटोहरू"
        subtitle="Manage existing photos and add new ones"
      />

      {/* Summary pill */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-800">
              {totalImages} / {MAX_PHOTOS}
            </span>
            <span className="text-xs text-blue-600">photos total</span>
          </div>
          <Progress
            value={(totalImages / MAX_PHOTOS) * 100}
            className="h-1.5 mt-1.5 bg-blue-200"
          />
        </div>
        <div className="text-right text-xs text-blue-600 flex-shrink-0">
          <p>{existingImages.length} existing</p>
          <p>{newImagePreviews.length} new</p>
        </div>
      </div>

      {/* Existing images */}
      {existingImages.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            Existing Photos / हालका फोटोहरू
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {existingImages.map((img, i) => (
              <div key={img} className="relative group aspect-square">
                <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-red-300 transition-colors">
                  <img
                    src={resolveImageUrl(img)}
                    alt={`Existing room photo ${i + 1}`}
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
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 hover:scale-110"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                </button>
                <div className="absolute bottom-1.5 left-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0"
                  >
                    #{i + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        aria-label="Add new photos"
      />

      {totalImages < MAX_PHOTOS ? (
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
              Add new photos / नयाँ फोटो थप्नुहोस्
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {MAX_PHOTOS - totalImages} slot
              {MAX_PHOTOS - totalImages !== 1 ? "s" : ""} remaining · Max{" "}
              {MAX_FILE_SIZE_MB}MB each
            </p>
          </div>
        </button>
      ) : (
        <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-slate-400">
            Maximum photos reached / अधिकतम फोटो पुग्यो
          </p>
        </div>
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

      {/* New image previews */}
      {newImagePreviews.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            New Photos / नयाँ फोटोहरू
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {newImagePreviews.map((preview, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group aspect-square"
              >
                <div className="w-full h-full rounded-xl overflow-hidden border-2 border-green-200 group-hover:border-red-300 transition-colors">
                  <img
                    src={preview}
                    alt={`New photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveNew(i)}
                  aria-label={`Remove new photo ${i + 1}`}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 hover:scale-110"
                >
                  <XCircle className="w-4 h-4" aria-hidden />
                </button>
                <div className="absolute top-1.5 left-1.5">
                  <Badge className="text-[10px] px-1.5 py-0.5 bg-green-500 text-white border-0">
                    New
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
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
    </div>
  );
}
