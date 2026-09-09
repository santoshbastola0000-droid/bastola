import { redirect } from "next/navigation";

export default function HostPage() {
  redirect("/user/dashboard/rooms/create");
}
