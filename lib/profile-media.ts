const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.roomkhoj.com";

export const profileMediaUrl = (
  url?: string | null,
) => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_URL}${url}`;
};
