"use client";
import { NavBar } from "@/components/common/navbar";
import { RoomAvailability } from "@/components/office/RoomAvailability";
export function RoomBrowseScreen() {
 return <><NavBar solid/><main className="min-h-screen bg-background px-3 pt-20 pb-28 sm:px-5"><RoomAvailability embedded hideContact/></main></>;
}
