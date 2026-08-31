export type ShiftingStatus = 'REQUESTED' | 'QUOTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface MovingAddress { address: string; city: 'Pokhara'; floor: number; lift: boolean; vehicleAccess: boolean; latitude?: number; longitude?: number }
export interface ShiftingRequest {
  clientRequestId: string; from: MovingAddress; to: MovingAddress; moveAt: string; rooms: number; items: string;
  service: 'VEHICLE' | 'LABOUR' | 'BOTH'; extras: string[]; phone: string; notes: string;
}
export interface ShiftingQuote { amount: number; inclusions: string; team: string; vehicle: string; contactPhone: string; availabilityConfirmed: boolean; version: number; quotedAt: string }
export interface ShiftingBooking {
  id: string; userId: string; details: ShiftingRequest; status: ShiftingStatus; quote: ShiftingQuote | null; photoCount: number;
  messages: { by: 'ADMIN' | 'USER'; text: string; at: string }[];
  history: { action: string; actorId: string; at: string; note?: string }[];
  review: { rating: number; text: string } | null; createdAt: string; updatedAt: string;
}
export interface ShiftingList { data: ShiftingBooking[]; total: number; page: number; pageSize: number }
