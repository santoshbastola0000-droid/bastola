import { redirect } from "next/navigation";

export default function Home() {
  // Use the social feed as the main RoomKhoj home experience.
  redirect("/feed");
}
