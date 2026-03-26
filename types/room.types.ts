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
  totalHouseCapacity: number;
  waterSupplyTimings: WaterSupplyTimings;
  allowsWomen: boolean;
  roomCapacity: number;
  roomArea: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  images: File[];
  location: Omit<Location, "id">;
  tiktokUrl?: string;
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
  totalHouseCapacity?: number;
  rentedRoomsCount?: number;
  currentOccupants?: number;
  waterSupplyTimings?: WaterSupplyTimings;
  allowsWomen?: boolean;
  roomCapacity?: number;
  roomArea?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  images?: string[];
  location?: Partial<Location>;
  tiktokUrl?: string;
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
  radius?: number; // in kilometers
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
