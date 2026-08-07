import Footer from "@/components/common/footer";
import { NavBar } from "@/components/common/navbar";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "RoomKhoj",
  description: "Rental service app",
};

export default function Authlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NavBar />
      {children}
      <Footer />
    </Suspense>
  );
}
