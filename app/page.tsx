import { FeedChrome } from "@/components/social/FeedChrome";

export default function Home() {
  // Render the main feed directly so opening `/` does not pay for an extra
  // server redirect + second navigation before the home UI can start loading.
  return <FeedChrome />;
}
