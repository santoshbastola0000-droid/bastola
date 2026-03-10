export type PropertyType =
  | "apartment"
  | "house"
  | "flat"
  | "studio"
  | "room"
  | "villa"
  | "condo";

export type RentalPeriod = "month" | "week" | "night" | "year";

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  period?: RentalPeriod;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  city: string;
  state: string;
  country?: string;
  address?: string;
  zip_code?: string;
  images?: string[];
  rating?: number;
  reviews_count?: number;
  is_available?: boolean;
  featured?: boolean;
  amenities?: string[];
  host_id?: string;
  host_name?: string;
  host_avatar?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  pets_allowed?: boolean;
  furnished?: boolean;
  parking_available?: boolean;
}

export interface PropertyFilters {
  city?: string;
  state?: string;
  property_type?: PropertyType;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  min_area?: number;
  amenities?: string[];
  is_available?: boolean;
  featured?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles/km
}
