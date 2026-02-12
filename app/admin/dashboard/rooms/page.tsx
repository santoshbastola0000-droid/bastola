import type { Metadata } from "next";
import { RoomList } from "@/components/admin/RoomList";

export const metadata: Metadata = {
    title: "Rooms Management | Rental Service",
    description: "Manage rooms and listings",
};

export default function RoomsPage() {
    return <RoomList />;
}