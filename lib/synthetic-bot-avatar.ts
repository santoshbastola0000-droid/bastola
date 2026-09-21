type SyntheticAvatarInput = {
  id?: string | null;
  name?: string | null;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function personArtwork(hash: number) {
  const skin = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524"][hash % 4];
  const hair = ["#191919", "#3f2a1d", "#6a4328", "#263238"][
    Math.floor(hash / 5) % 4
  ];
  const shirt = ["#ffffff", "#e8f0fe", "#fee2e2", "#dcfce7", "#f3e8ff"][
    Math.floor(hash / 11) % 5
  ];

  return `
    <circle cx="80" cy="65" r="34" fill="${skin}"/>
    <path d="M46 61c3-25 18-39 35-39 21 0 34 16 34 41-11-9-23-14-36-14-12 0-22 4-33 12z" fill="${hair}"/>
    <circle cx="67" cy="67" r="3" fill="#222"/>
    <circle cx="93" cy="67" r="3" fill="#222"/>
    <path d="M69 84c7 6 15 6 22 0" stroke="#7c3f2d" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M32 151c7-35 25-53 48-53s41 18 48 53" fill="${shirt}"/>
  `;
}

function flowerArtwork(hash: number, hue: number) {
  const petalHue = (hue + 18 + (hash % 70)) % 360;
  const petal2 = (petalHue + 42) % 360;
  return `
    <path d="M80 157c-2-33 0-57 1-83" stroke="#237a3b" stroke-width="8" stroke-linecap="round"/>
    <path d="M79 115c-20-3-30-13-35-27 19-2 31 5 38 22" fill="#4cae63"/>
    <path d="M82 126c18-5 29-15 34-29-18-1-31 7-37 23" fill="#3f9b55"/>
    <g transform="translate(80 67)">
      <ellipse rx="18" ry="34" transform="rotate(0) translate(0 -25)" fill="hsl(${petalHue} 84% 72%)"/>
      <ellipse rx="18" ry="34" transform="rotate(60) translate(0 -25)" fill="hsl(${petal2} 82% 68%)"/>
      <ellipse rx="18" ry="34" transform="rotate(120) translate(0 -25)" fill="hsl(${petalHue} 86% 64%)"/>
      <ellipse rx="18" ry="34" transform="rotate(180) translate(0 -25)" fill="hsl(${petal2} 84% 74%)"/>
      <ellipse rx="18" ry="34" transform="rotate(240) translate(0 -25)" fill="hsl(${petalHue} 82% 70%)"/>
      <ellipse rx="18" ry="34" transform="rotate(300) translate(0 -25)" fill="hsl(${petal2} 86% 66%)"/>
      <circle r="20" fill="#f6c945"/>
      <circle r="8" fill="#8a5a12"/>
    </g>
  `;
}

function dogArtwork(hash: number) {
  const fur = ["#d5a56d", "#9b6a43", "#f0d2a4", "#6c4b35", "#d9d9d9"][
    hash % 5
  ];
  const ear = ["#5d3e2c", "#70492f", "#8b5d3c"][Math.floor(hash / 7) % 3];
  return `
    <ellipse cx="48" cy="58" rx="23" ry="42" transform="rotate(-24 48 58)" fill="${ear}"/>
    <ellipse cx="112" cy="58" rx="23" ry="42" transform="rotate(24 112 58)" fill="${ear}"/>
    <circle cx="80" cy="79" r="50" fill="${fur}"/>
    <ellipse cx="80" cy="103" rx="28" ry="23" fill="#f5e4cc"/>
    <circle cx="61" cy="74" r="6" fill="#1f2937"/>
    <circle cx="99" cy="74" r="6" fill="#1f2937"/>
    <ellipse cx="80" cy="96" rx="9" ry="7" fill="#222"/>
    <path d="M80 103c-7 8-15 9-22 4M80 103c7 8 15 9 22 4" stroke="#3b2a22" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M69 116c8 8 14 8 22 0" stroke="#d26868" stroke-width="5" fill="none" stroke-linecap="round"/>
  `;
}

function gymArtwork(hash: number, hue: number) {
  const plate = `hsl(${(hue + 190) % 360} 28% 22%)`;
  const accent = `hsl(${(hue + 10) % 360} 78% 55%)`;
  return `
    <circle cx="80" cy="80" r="54" fill="rgba(255,255,255,.15)"/>
    <rect x="36" y="74" width="88" height="12" rx="6" fill="#e5e7eb"/>
    <rect x="19" y="55" width="14" height="50" rx="5" fill="${plate}"/>
    <rect x="34" y="63" width="14" height="34" rx="5" fill="${plate}"/>
    <rect x="112" y="63" width="14" height="34" rx="5" fill="${plate}"/>
    <rect x="127" y="55" width="14" height="50" rx="5" fill="${plate}"/>
    <path d="M54 126c8-18 17-27 26-27s18 9 26 27" stroke="${accent}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="80" cy="48" r="15" fill="${accent}"/>
  `;
}

function mountainArtwork(hash: number, hue: number) {
  const sunX = 38 + (hash % 80);
  return `
    <circle cx="${sunX}" cy="42" r="18" fill="#ffd75e"/>
    <path d="M0 137 46 70 77 111 101 62 160 140 160 160 0 160z" fill="hsl(${(hue + 145) % 360} 34% 38%)"/>
    <path d="M74 113 101 62 126 97 113 91 101 81 91 94z" fill="#eef5f7"/>
    <path d="M0 136c30-17 58-19 82-5s48 16 78 1v28H0z" fill="hsl(${(hue + 105) % 360} 50% 33%)"/>
    <path d="M0 144c34-8 65-7 92 2s48 9 68 3v11H0z" fill="#2a6f77" opacity=".8"/>
  `;
}

function abstractArtwork(hash: number, hue: number) {
  const h2 = (hue + 120) % 360;
  const h3 = (hue + 230) % 360;
  return `
    <circle cx="48" cy="45" r="36" fill="hsl(${h2} 80% 67%)" opacity=".9"/>
    <rect x="72" y="22" width="70" height="70" rx="24" transform="rotate(18 107 57)" fill="hsl(${h3} 78% 60%)" opacity=".85"/>
    <path d="M13 132c24-39 50-52 76-38s40 8 59-14v80H8z" fill="rgba(255,255,255,.38)"/>
    <circle cx="102" cy="118" r="31" fill="hsl(${hue} 88% 72%)" opacity=".88"/>
    <circle cx="48" cy="112" r="14" fill="#fff" opacity=".75"/>
  `;
}

export function syntheticBotAvatarTheme(input: SyntheticAvatarInput) {
  const id = String(input.id || "bot");
  const name = String(input.name || "Bot").trim() || "Bot";
  const hash = hashSeed(`${id}:${name}`);
  return ["person", "flower", "dog", "gym", "nature", "abstract"][
    hash % 6
  ] as "person" | "flower" | "dog" | "gym" | "nature" | "abstract";
}

export function syntheticBotAvatarDataUrl(input: SyntheticAvatarInput) {
  const id = String(input.id || "bot");
  const name = String(input.name || "Bot").trim() || "Bot";
  const hash = hashSeed(`${id}:${name}`);
  const hue = hash % 360;
  const hue2 = (hue + 48 + (hash % 96)) % 360;
  const theme = syntheticBotAvatarTheme(input);
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toUpperCase())
      .join("") || "RK";

  const artwork =
    theme === "flower"
      ? flowerArtwork(hash, hue)
      : theme === "dog"
        ? dogArtwork(hash)
        : theme === "gym"
          ? gymArtwork(hash, hue)
          : theme === "nature"
            ? mountainArtwork(hash, hue)
            : theme === "abstract"
              ? abstractArtwork(hash, hue)
              : personArtwork(hash);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 72% 68%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 68% 50%)"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      ${artwork}
      <circle cx="128" cy="128" r="20" fill="rgba(15,23,42,.76)"/>
      <text
        x="128"
        y="134"
        text-anchor="middle"
        font-family="Arial,sans-serif"
        font-size="13"
        font-weight="700"
        fill="#fff"
      >${escapeXml(initials)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
