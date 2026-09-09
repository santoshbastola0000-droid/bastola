import { redirect } from "next/navigation";

export default function Home() {
  // Public/guest discovery stays open for SEO and room browsing. Auth flows
  // explicitly land normal users on /feed after successful sign-in.
  redirect("/rooms");
}
