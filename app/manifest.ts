import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoomKhoj",
    short_name: "RoomKhoj",
    description: "Find rooms, jobs and connect with people across Nepal.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ef233c",
    icons: [
      {
        src: "/roomkhoj-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
