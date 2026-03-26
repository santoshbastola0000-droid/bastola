import { Room, RoomStatus } from "@/types/room.types";
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
    Double: "room",
    "Attached Bathroom": "room",
    Shutter: "room",
    Hotel: "apartment",
    "Office Space": "apartment",
    Hostel: "room",
    Shared: "room",
    Single: "room",
  };

  // Check if room is available for public listing
  const isAvailableForListing =
    room.approvalStatus === RoomStatus.APPROVED &&
    room.listingStatus === RoomStatus.AVAILABLE;

  const amenitiesMap: Record<string, string> = {
    wifi: "wifi",
    ac: "air conditioning",
    parking: "parking",
    tv: "television",
    kitchen: "kitchen",
    security: "security system",
    "hot-water": "hot water",
    furnished: "furnished",
    gym: "gym",
    pool: "swimming pool",
    balcony: "balcony",
    laundry: "laundry",
  };

  const mappedAmenities =
    room.amenities?.map((a) => amenitiesMap[a.toLowerCase()] || a) || [];

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
    email: "",
    phoneNumber: "",
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

  // Determine if pets are allowed (mapping based on amenities)
  const petsAllowed =
    room.amenities?.some(
      (a) =>
        a.toLowerCase().includes("pet") || a.toLowerCase().includes("animal"),
    ) || false;

  // Determine if furnished (mapping based on amenities)
  const furnished =
    room.amenities?.some(
      (a) =>
        a.toLowerCase().includes("furnished") ||
        a.toLowerCase().includes("furniture") ||
        a === "furnished",
    ) || false;

  // Parking availability
  const parkingAvailable =
    room.amenities?.some(
      (a) => a.toLowerCase().includes("parking") || a === "parking",
    ) || false;

  return {
    id: room.id,
    title: room.title || "Untitled Property",
    description: room.description || "No description available",
    price: priceNum,
    period: "month",
    property_type: propertyTypeMap[room.category] || "apartment",
    bedrooms: room.roomCapacity || 1,
    bathrooms: room.bathroomCapacity || 1,
    area_sqft: room.roomArea ? Math.round(room.roomArea * 10.764) : 0, // Convert m² to ft² and round
    city: location.city || "Pokhara",
    state: location.state || "Gandaki",
    country: location.country || "Nepal",
    address: room.address || "",
    zip_code: location.postalCode || "",
    images: images,
    rating: 4.5, // Default rating since API doesn't provide
    reviews_count: 0, // Default since API doesn't provide
    is_available: isAvailableForListing,
    featured: false,
    amenities: mappedAmenities,
    host_id: room.userId || "",
    host_name: user.name || "Property Owner",
    host_email: user.email || "",
    host_phone: user.phoneNumber || "",
    host_avatar: "", // Default since API doesn't provide
    created_at: room.createdAt || new Date().toISOString(),
    updated_at: room.updatedAt || new Date().toISOString(),
    latitude: location.latitude ? Number(location.latitude) : undefined,
    longitude: location.longitude ? Number(location.longitude) : undefined,

    // Property features
    pets_allowed: petsAllowed,
    furnished: furnished,
    parking_available: parkingAvailable,

    // Room specific fields (for internal use)
    approval_status: room.approvalStatus,
    listing_status: room.listingStatus,

    // Additional metadata
    floor_number: room.floorNumber,
    total_house_capacity: room.totalHouseCapacity,
    current_occupants: room.currentOccupants,
    water_supply_timings: room.waterSupplyTimings,
    allows_women: room.allowsWomen,
    owner_lives_in_house: room.ownerLivesInHouse,
    tiktok_url: room.tiktokUrl,

    // Commission info
    service_charge: room.serviceCharge,
    commission_amount: room.commissionAmount,
    commission_paid_at: room.commissionPaidAt,

    // Contact info
    contact_person: room.contactPerson,
    contact_phone: room.contactPhone,
  };
}

// Convert array of Rooms to array of Properties
export function adaptRoomsToProperties(rooms: Room[]): Property[] {
  if (!rooms || !Array.isArray(rooms)) return [];
  return rooms.map(adaptRoomToProperty);
}

// Filter function to get only available properties for public listing
export function getAvailableProperties(rooms: Room[]): Property[] {
  const availableRooms = rooms.filter(
    (room) =>
      room.approvalStatus === RoomStatus.APPROVED &&
      room.listingStatus === RoomStatus.AVAILABLE,
  );
  return adaptRoomsToProperties(availableRooms);
}

// Get properties by approval status
export function getPropertiesByApprovalStatus(
  rooms: Room[],
  status: RoomStatus.APPROVED | RoomStatus.PENDING | RoomStatus.REJECTED,
): Property[] {
  const filteredRooms = rooms.filter((room) => room.approvalStatus === status);
  return adaptRoomsToProperties(filteredRooms);
}

// Get properties by listing status
export function getPropertiesByListingStatus(
  rooms: Room[],
  status: RoomStatus.AVAILABLE | RoomStatus.RENTED | RoomStatus.ARCHIVED,
): Property[] {
  const filteredRooms = rooms.filter((room) => room.listingStatus === status);
  return adaptRoomsToProperties(filteredRooms);
}
