import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProviderWrapper } from "@/app/providers";
import { NavBar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { Toaster } from "sonner";
<Toaster />;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Service",
  description: "Rental service app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProviderWrapper>
          <NavBar />
          {children}
          <Footer />
          <Toaster />;
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
