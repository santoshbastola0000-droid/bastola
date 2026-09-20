export function syntheticBotAvatarDataUrl(input: { id?: string | null; name?: string | null }) {
  const id = String(input.id || "bot");
  const name = String(input.name || "Bot").trim() || "Bot";

  let hash = 0;
  const seed = `${id}:${name}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  const hue2 = (hue + 48 + (hash % 72)) % 360;
  const skin = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524"][hash % 4];
  const hair = ["#231f20", "#4b2e1f", "#6b4423", "#1f2937"][Math.floor(hash / 5) % 4];
  const initial = name.slice(0, 1).toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 72% 66%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 70% 52%)"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <circle cx="80" cy="66" r="34" fill="${skin}"/>
      <path d="M47 62c2-25 17-39 34-39 21 0 34 15 34 41-11-9-22-14-36-14-11 0-21 4-32 12z" fill="${hair}"/>
      <circle cx="67" cy="67" r="3" fill="#222"/>
      <circle cx="93" cy="67" r="3" fill="#222"/>
      <path d="M69 84c7 6 15 6 22 0" stroke="#7c3f2d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M34 146c7-32 24-48 46-48s39 16 46 48" fill="rgba(255,255,255,.88)"/>
      <circle cx="124" cy="124" r="20" fill="rgba(17,24,39,.82)"/>
      <text x="124" y="131" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#fff">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
