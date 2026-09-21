type SyntheticAvatarInput = {
  id?: string | null;
  name?: string | null;
};

type SyntheticAvatarTheme =
  | "dog"
  | "cat"
  | "flower"
  | "nature"
  | "gym"
  | "coffee"
  | "bike"
  | "travel"
  | "person";

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function personFallbackDataUrl(input: SyntheticAvatarInput, hash: number) {
  const name = String(input.name || "User").trim() || "User";
  const hue = hash % 360;
  const hue2 = (hue + 52) % 360;
  const skin = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524"][hash % 4];
  const hair = ["#191919", "#3f2a1d", "#6a4328", "#263238"][
    Math.floor(hash / 5) % 4
  ];
  const shirt = ["#111827", "#334155", "#3f3f46", "#1f2937"][
    Math.floor(hash / 11) % 4
  ];
  const initial = name.slice(0, 1).toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 45% 68%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 38% 44%)"/>
        </linearGradient>
      </defs>
      <rect width="480" height="480" fill="url(#bg)"/>
      <circle cx="240" cy="194" r="88" fill="${skin}"/>
      <path d="M151 178c8-77 51-119 94-119 64 0 104 48 104 126-33-28-69-44-108-44-34 0-62 12-90 37z" fill="${hair}"/>
      <circle cx="205" cy="196" r="8" fill="#202124"/>
      <circle cx="275" cy="196" r="8" fill="#202124"/>
      <path d="M211 242c18 14 40 14 58 0" stroke="#7c3f2d" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M93 480c22-112 75-171 147-171s125 59 147 171" fill="${shirt}"/>
      <circle cx="394" cy="394" r="50" fill="rgba(15,23,42,.72)"/>
      <text x="394" y="412" text-anchor="middle" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="#fff">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function syntheticBotAvatarTheme(
  input: SyntheticAvatarInput,
): SyntheticAvatarTheme {
  const id = String(input.id || "bot");
  const name = String(input.name || "Bot").trim() || "Bot";
  const hash = hashSeed(`${id}:${name}`);

  const themes: SyntheticAvatarTheme[] = [
    "dog",
    "cat",
    "flower",
    "nature",
    "gym",
    "coffee",
    "bike",
    "travel",
    "person",
  ];

  return themes[hash % themes.length];
}

export function syntheticBotAvatarDataUrl(input: SyntheticAvatarInput) {
  const id = String(input.id || "bot");
  const name = String(input.name || "Bot").trim() || "Bot";
  const hash = hashSeed(`${id}:${name}`);
  const theme = syntheticBotAvatarTheme(input);

  if (theme === "person") {
    return personFallbackDataUrl(input, hash);
  }

  const categoryMap: Record<Exclude<SyntheticAvatarTheme, "person">, string> = {
    dog: "dog,pet",
    cat: "cat,pet",
    flower: "flower,garden",
    nature: "mountain,nature",
    gym: "gym,dumbbell",
    coffee: "coffee,cafe",
    bike: "motorbike,bicycle",
    travel: "travel,landscape",
  };

  const category = categoryMap[theme];
  const lock = (hash % 9999) + 1;

  // Stable photo-style avatar per bot. The lock keeps the same image for the
  // same bot across comments, reactions, search, profile, and admin views.
  return `https://loremflickr.com/480/480/${category}?lock=${lock}`;
}
