import type { Metadata } from "next";
import { NavBar } from "@/components/common/navbar";
import { RoomAvailability } from "@/components/office/RoomAvailability";

export const metadata: Metadata = {
  title: "Room Availability | Room Khoj",
  description: "Browse available rooms added by the Room Khoj office and reception.",
  alternates: { canonical: "https://www.roomkhoj.com/rooms/availability" },
};

export default function RoomAvailabilityPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 px-4 pt-24 pb-32">
        <RoomAvailability embedded hideContact />
      </main>
    </>
  );
}
