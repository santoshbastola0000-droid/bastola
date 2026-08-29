import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProviderWrapper } from "@/app/providers";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionChecker } from "@/components/SessionChecker";
import { GlobalChatbot } from "@/components/GlobalChatbot";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { RoomKhojAIFloatingButton } from "@/components/RoomKhojAIFloatingButton";
import { GuestLoginPopup } from "@/components/GuestLoginPopup";
import { GlobalIncomingCall } from "@/components/GlobalIncomingCall";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { AutoPushPermission } from "@/components/AutoPushPermission";
import { AutoLocationUpdate } from "@/components/AutoLocationUpdate";
import { PermissionStatusSync } from "@/components/PermissionStatusSync";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.roomkhoj.com"),

  title: {
    default: "RoomKhoj | Rooms for Rent & Jobs in Nepal",
    template: "%s | RoomKhoj",
  },

  description:
    "Find rooms, flats, apartments and houses for rent in Nepal. Search room rentals and job opportunities in Pokhara with RoomKhoj.",

  applicationName: "RoomKhoj",
  creator: "RoomKhoj",
  publisher: "RoomKhoj",

  keywords: [
    "RoomKhoj",
    "rooms for rent in Nepal",
    "room rental Pokhara",
    "room for rent in Pokhara",
    "jobs in Pokhara",
    "job vacancy in Pokhara",
    "flat for rent in Nepal",
  ],

  openGraph: {
    title: "RoomKhoj | Rooms for Rent & Jobs in Nepal",
    description:
      "Find rental rooms, flats, houses and job opportunities in Nepal with RoomKhoj.",
    url: "https://www.roomkhoj.com",
    siteName: "RoomKhoj",
    locale: "en_NP",
    type: "website",
    images: [
      {
        url: "/roomkhoj-logo.png",
        width: 1254,
        height: 1254,
        alt: "RoomKhoj",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "RoomKhoj | Rooms for Rent & Jobs in Nepal",
    description:
      "Find rental rooms and job opportunities in Nepal with RoomKhoj.",
    images: ["/roomkhoj-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/roomkhoj-logo.png",
    apple: "/roomkhoj-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0`}
      >
        <LanguageProvider>
        <SessionChecker />
        <AutoPushPermission />
        <AutoLocationUpdate />
        <PermissionStatusSync />
        <QueryClientProviderWrapper>
          <TooltipProvider>
            <GuestLoginPopup />
            <GlobalIncomingCall />
            <PwaInstallPrompt />
            {children}

          <RoomKhojAIFloatingButton />
          <MobileBottomNav />           
          <GlobalChatbot />
          </TooltipProvider>
          <Toaster />
        </QueryClientProviderWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
