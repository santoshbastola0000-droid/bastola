"use client";
import dynamic from "next/dynamic";
import { useUserStore } from "@/stores/user-store";
import { RoomBrowseScreen } from "@/components/rooms/RoomBrowseScreen";
const FeedChrome=dynamic(()=>import("@/components/social/FeedChrome").then(module=>module.FeedChrome));
export default function Home() {
 const user=useUserStore(state=>state.user);
 return user?<FeedChrome/>:<RoomBrowseScreen/>;
}
