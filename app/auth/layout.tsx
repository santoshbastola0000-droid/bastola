import { Footer } from "@/components/common/footer";
import { NavBar } from "@/components/common/navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Service",
  description: "Rental service app",
};

export default function Authlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
