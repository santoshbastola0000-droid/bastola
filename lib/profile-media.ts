const API_URL = String(
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.roomkhoj.com",
).replace(/\/$/, "");

export const profileMediaUrl = (
  url?: string | null,
) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  return `${API_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};
