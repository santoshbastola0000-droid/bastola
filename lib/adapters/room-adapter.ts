import { Room } from "@/types/room.types";
import { Property } from "@/types/property.types";

export function adaptRoomToProperty(room: Room): Property {
  const priceNum = room.price;

  const propertyTypeMap: Record<
    string,
    "apartment" | "house" | "flat" | "studio" | "room" | "villa" | "condo"
  > = {
    Apartment: "apartment",
    House: "house",
    Flat: "flat",
    Studio: "studio",
    Room: "room",
    Villa: "villa",
    Condo: "condo",
  };

  const amenitiesMap: Record<string, string> = {
    wifi: "wifi",
    ac: "air conditioning",
    parking: "parking",
    // Add more mappings as needed
  };

  const mappedAmenities =
    room.amenities?.map((a) => amenitiesMap[a] || a) || [];

  // Safely access location properties with fallbacks
  const location = room.location || {
    city: "",
    state: "",
    country: "",
    postalCode: "",
    latitude: 0,
    longitude: 0,
  };

  // Safely access user properties with fallbacks
  const user = room.user || {
    name: "Unknown Host",
  };

  // Build image URLs safely
  const images =
    room.images?.map((img) => {
      if (img.startsWith("http")) return img;
      const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
        /\/$/,
        "",
      );
      const cleanImagePath = img.replace(/^\//, "");
      return `${baseUrl}/${cleanImagePath}`;
    }) || [];

  return {
    id: room.id,
    title: room.title || "Untitled Property",
    description: room.description || "No description available",
    price: priceNum,
    period: "month", // Default to month since your API doesn't specify
    property_type: propertyTypeMap[room.category] || "apartment",
    bedrooms: room.roomCapacity || 1,
    bathrooms: room.bathroomCapacity || 1,
    area_sqft: room.roomArea ? room.roomArea * 10.764 : 0, // Convert m² to ft²
    city: location.city || "Pokhara",
    state: location.state || "Gandaki",
    country: location.country || "Nepal",
    address: room.address || "",
    zip_code: location.postalCode || "",
    images: images,
    rating: 4.5, // Default rating since API doesn't provide
    reviews_count: 0, // Default since API doesn't provide
    is_available: room.status === "Approved",
    featured: false, // Default since API doesn't provide
    amenities: mappedAmenities,
    host_id: room.userId || "",
    host_name: user.name || "Property Owner",
    host_avatar: "", // Default since API doesn't provide
    created_at: room.createdAt || new Date().toISOString(),
    updated_at: room.updatedAt || new Date().toISOString(),
    latitude: location.latitude ? location.latitude : undefined,
    longitude: location.longitude ? location.longitude : undefined,
    pets_allowed: room.allowsWomen || false, // Using allowsWomen as pets_allowed for now
    furnished: room.amenities?.includes("ac") || false, // Example mapping
    parking_available: room.amenities?.includes("parking") || false,
  };
}

// Convert array of Rooms to array of Properties
export function adaptRoomsToProperties(rooms: Room[]): Property[] {
  if (!rooms || !Array.isArray(rooms)) return [];
  return rooms.map(adaptRoomToProperty);
}
