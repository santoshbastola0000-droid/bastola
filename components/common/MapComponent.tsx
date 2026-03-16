import { Map } from "lucide-react";
import dynamic from "next/dynamic";

export const MapComponent = dynamic(
  () => import("@/components/ui/enhanced-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Map className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  },
);
