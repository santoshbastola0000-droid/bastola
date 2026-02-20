import L from "leaflet";

// Custom red theme marker icons
export const createSelectedMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-8 h-8 bg-[#E11D48] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#E11D48]"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const createCurrentLocationMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-6 h-6 bg-[#2563EB] rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-pulse">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute -inset-2 bg-[#2563EB]/20 rounded-full animate-ping"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export const createDefaultMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-6 h-6 bg-gray-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};
