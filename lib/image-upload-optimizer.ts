const COMPRESSIBLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function optimizedName(name: string) {
  const base = String(name || "image").replace(/\.[^.]+$/, "");
  return `${base}.webp`;
}

export async function optimizeImageUpload(
  file: File,
  options: { maxWidth?: number; quality?: number; minBytes?: number } = {},
): Promise<File> {
  const maxWidth = options.maxWidth ?? 1600;
  const quality = options.quality ?? 0.8;
  const minBytes = options.minBytes ?? 350 * 1024;

  if (
    typeof window === "undefined" ||
    !COMPRESSIBLE_TYPES.has(String(file.type || "").toLowerCase()) ||
    file.size < minBytes
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxWidth / Math.max(1, bitmap.width));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], optimizedName(file.name), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    // HEIC/HEIF and uncommon browser codecs can fail to decode client-side.
    // Keep the original and let the server-side normalizer handle those files.
    return file;
  }
}

export async function optimizeFormDataImages(form: FormData) {
  const replacements: Array<{ key: string; oldFile: File; nextFile: File }> = [];

  for (const [key, value] of form.entries()) {
    if (!(value instanceof File) || !String(value.type || "").startsWith("image/")) continue;
    const nextFile = await optimizeImageUpload(value);
    if (nextFile !== value) replacements.push({ key, oldFile: value, nextFile });
  }

  for (const replacement of replacements) {
    const values = form.getAll(replacement.key);
    form.delete(replacement.key);
    for (const value of values) {
      form.append(
        replacement.key,
        value === replacement.oldFile ? replacement.nextFile : value,
      );
    }
  }

  return form;
}
