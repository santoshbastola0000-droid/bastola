import { UnlockResult, UnlockStatus } from "./unlock.types";
import { UserRole } from "./user.types";

export enum RoomStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  AVAILABLE = "Available",
  RENTED = "Rented",
  ARCHIVED = "Archived",
}

export enum RoomCategory {
  FLAT = "Flat",
  SINGLE = "Single",
  APARTMENT = "Apartment",
  SHARED = "Shared",
  DOUBLE = "Double",
  HOUSE = "House",
  ATTACHED_BATHROOM = "Attached Bathroom",
  SHUTTER = "Shutter",
  HOTEL = "Hotel",
  OFFICE_SPACE = "Office Space",
  HOSTEL = "Hostel",
}

export enum TenantType {
  STUDENT = "Student",
  WORKING_PROFESSIONAL = "Working Professional",
  FAMILY = "Family",
  SINGLE_PERSON = "Single Person",
  COUPLE = "Couple",
  ANY = "Any",
}

export enum GenderPreference {
  MALE_ONLY = "Male Only",
  FEMALE_ONLY = "Female Only",
  NO_PREFERENCE = "No Preference",
}

export interface Location {
  id: string;
  name: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface WaterSupplyTimings {
  morning: string;
  evening: string;
  notes?: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  category: RoomCategory;
  price: number;
  address: string;
  amenities: string[];
  approvalStatus: RoomStatus;
  listingStatus: RoomStatus;
  bathroomCapacity: number;
  floorNumber: number;
  ownerLivesInHouse: boolean;
  ownerFloorNumber?: number | null;
  totalHouseCapacity: number;
  rentedRoomsCount: number;
  currentOccupants: number;
  waterSupplyTimings: WaterSupplyTimings;
  allowsWomen: boolean;
  roomCapacity: number;
  roomArea: number;
  contactPerson?: string;
  contactPhone?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  locationId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    isVerified: boolean;
    role: UserRole;
  };
  location?: Location;
  tiktokUrl?: string;
  serviceCharge?: number;
  commissionAmount?: number;
  commissionPaidAt?: string;
  transactionId?: string;
  commissionSettingsId?: string;
  adminRemarks?: string;
  approvedAt?: string;
  approvedById?: string;

  // ── New tenant preference fields ─────────────────────────────────────────
  tenantTypes?: TenantType[] | null;
  genderPreference?: GenderPreference | null;
  smokingAllowed?: boolean | null;
  alcoholAllowed?: boolean | null;
  nonVegAllowed?: boolean | null;
  buffaloMeatAllowed?: boolean | null;
  porkAllowed?: boolean | null;
  lateNightAllowed?: boolean | null;
  babyAllowed?: boolean | null;
  otherRules?: string | null;
  gateClosingTime?: string | null;
  hasClothDryingArea?: boolean | null;
  hasSunlight?: boolean | null;
  existingProblems?: string | null;
  ownerCommunity?: string | null;
  communityPreference?: string | null;
  // Distances
  distanceHighwayM?: number | null;
}

export interface RoomStats {
  total: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  available: number;
  rented: number;
  archived: number;
  byCategory: Record<string, number>;
}

export interface CreateRoomDTO {
  title: string;
  description: string;
  category: RoomCategory;
  price: number;
  address: string;
  amenities: string[];
  bathroomCapacity: number;
  floorNumber: number;
  ownerLivesInHouse: boolean;
  ownerFloorNumber?: number | null;
  totalHouseCapacity: number;
  waterSupplyTimings: WaterSupplyTimings;
  allowsWomen: boolean;
  roomCapacity: number;
  roomArea: number;
  contactPerson?: string;
  contactPhone?: string;
  images: File[];
  location: Omit<Location, "id">;
  tiktokUrl?: string;
  tenantTypes?: TenantType[];
  genderPreference?: GenderPreference;
  smokingAllowed?: boolean | null;
  alcoholAllowed?: boolean | null;
  nonVegAllowed?: boolean | null;
  buffaloMeatAllowed?: boolean | null;
  porkAllowed?: boolean | null;
  lateNightAllowed?: boolean | null;
  babyAllowed?: boolean | null;
  otherRules?: string;
  gateClosingTime?: string;
  hasClothDryingArea?: boolean | null;
  hasSunlight?: boolean | null;
  existingProblems?: string;
  ownerCommunity?: string;
  communityPreference?: string;
  distanceHighwayM?: number | null;
}

export interface UpdateRoomDTO {
  title?: string;
  description?: string;
  category?: RoomCategory;
  price?: number;
  address?: string;
  amenities?: string[];
  bathroomCapacity?: number;
  floorNumber?: number;
  ownerLivesInHouse?: boolean;
  ownerFloorNumber?: number | null;
  totalHouseCapacity?: number;
  rentedRoomsCount?: number;
  currentOccupants?: number;
  waterSupplyTimings?: WaterSupplyTimings;
  allowsWomen?: boolean;
  roomCapacity?: number;
  roomArea?: number;
  contactPerson?: string;
  contactPhone?: string;
  images?: string[];
  location?: Partial<Location>;
  tiktokUrl?: string;
  tenantTypes?: TenantType[];
  genderPreference?: GenderPreference;
  smokingAllowed?: boolean | null;
  alcoholAllowed?: boolean | null;
  nonVegAllowed?: boolean | null;
  buffaloMeatAllowed?: boolean | null;
  porkAllowed?: boolean | null;
  lateNightAllowed?: boolean | null;
  babyAllowed?: boolean | null;
  otherRules?: string;
  gateClosingTime?: string;
  hasClothDryingArea?: boolean | null;
  hasSunlight?: boolean | null;
  existingProblems?: string;
  ownerCommunity?: string;
  communityPreference?: string;
  distanceHighwayM?: number | null;
}

export interface RoomFilters {
  city?: string;
  page?: number;
  take?: number;
  search?: string;
  approvalStatus?: RoomStatus;
  listingStatus?: RoomStatus;
  category?: RoomCategory;
  minPrice?: number;
  maxPrice?: number;
  allowsWomen?: boolean;
  ownerLivesInHouse?: boolean;
  userId?: string;
  includeAll?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface RoomsResponse {
  data: Room[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}

export interface RoomUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomTitle: string;
  unlockStatus: UnlockStatus | null;
  isAuthenticated: boolean;
  onUnlocked: (result: UnlockResult) => void;
  onRequestTopUp: () => void;
}

export interface ImageWithCategory {
  id: string;
  file: File;
  preview: string;
  category: string;
}
