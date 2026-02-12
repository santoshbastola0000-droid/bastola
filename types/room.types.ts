export enum RoomStatus {
    PENDING = 'pending',
    AVAILABLE = 'available',
    OCCUPIED = 'occupied',
    UNDER_MAINTENANCE = 'under_maintenance',
    RENTED = 'rented',
    REJECTED = 'rejected'
}

export enum RoomCategory {
    SINGLE = 'single',
    SHARED = 'shared',
    STUDIO = 'studio',
    APARTMENT = 'apartment',
    HOSTEL = 'hostel',
    PG = 'pg',
    FULL_HOUSE = 'full_house',
    OTHER = 'other'
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
    status: RoomStatus;
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
    contactEmail?: string;
    contactWhatsapp?: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
    userId: string;
    locationId: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    location?: Location;
}

export interface RoomStats {
    total: number;
    available: number;
    occupied: number;
    pending: number;
    rented: number;
    averagePrice: number;
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
    images: string[];
    location: Omit<Location, 'id'>;
}

export interface UpdateRoomDTO {
    title?: string;
    description?: string;
    category?: RoomCategory;
    price?: number;
    address?: string;
    amenities?: string[];
    status?: RoomStatus;
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
}

export interface RoomFilters {
    page?: number;
    take?: number;
    search?: string;
    status?: RoomStatus;
    category?: RoomCategory;
    minPrice?: number;
    maxPrice?: number;
    allowsWomen?: boolean;
    ownerLivesInHouse?: boolean;
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