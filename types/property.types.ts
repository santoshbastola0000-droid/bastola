import { RoomStatus } from "./room.types";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  period: "day" | "week" | "month" | "year";
  property_type:
    | "apartment"
    | "house"
    | "flat"
    | "studio"
    | "room"
    | "villa"
    | "condo";
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  city: string;
  state: string;
  country: string;
  address: string;
  zip_code: string;
  images: string[];
  rating: number;
  reviews_count: number;
  is_available: boolean;
  featured: boolean;
  amenities: string[];
  host_id: string;
  host_name: string;
  host_email?: string;
  host_phone?: string;
  host_avatar?: string;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;

  // Property features
  pets_allowed?: boolean;
  furnished?: boolean;
  parking_available?: boolean;

  // Room specific fields (optional for backward compatibility)
  approval_status?: RoomStatus;
  listing_status?: RoomStatus;
  floor_number?: number;
  total_house_capacity?: number;
  current_occupants?: number;
  water_supply_timings?: {
    morning: string;
    evening: string;
    notes?: string;
  };
  allows_women?: boolean;
  owner_lives_in_house?: boolean;
  tiktok_url?: string;
  service_charge?: number;
  commission_amount?: number;
  commission_paid_at?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
}

export interface PropertyFilters {
  city?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  pets_allowed?: boolean;
  furnished?: boolean;
  parking_available?: boolean;
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
}

export interface PropertiesResponse {
  data: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
