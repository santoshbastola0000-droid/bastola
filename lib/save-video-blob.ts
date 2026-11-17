export async function saveVideoBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
  // iOS Safari exposes Save to Files through the native share sheet.
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      // Fall back to a browser download if sharing is unavailable or fails.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
