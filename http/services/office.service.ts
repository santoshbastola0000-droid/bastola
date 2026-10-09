import { privateApi } from '@/http/api/privateApi';
import { api } from '@/http/api/api';

export interface OfficeRoom {
  id: string; code: string; title: string; location: string; details: string;
  ownerName: string; ownerPhone: string; tiktokUrl: string; price: number | string;
  status: 'AVAILABLE' | 'RENTED'; createdAt?: string;
  matchProfile?: RoomMatchProfile;
  rentalCount?: number; rentalHistoryIncomplete?: boolean;
  currentRental?: { id: string; clientName?: string; clientPhone?: string; startedAt: string; number: number; tenant?: TenantDetails } | null;
}
export interface OfficeRental { id: string; number: number; clientName?: string; clientPhone?: string; startedAt: string; endedAt?: string | null; staffName?: string; origin: string; tenant?: TenantDetails; }
export interface RoomMatchProfile { city?: string; area?: string; roomType?: string; capacity?: number; facilities?: string[]; occupancy?: string; parkingVehicles?: string[]; }
export interface TenantRequirements { city: string; area: string; roomType: string; people: number; minRent: number; maxRent: number; facilities: string[]; alternativeAreas?: string[]; occupancy?: string; parkingRequired?: boolean; vehicle?: string; vehicleCount?: number; rentalEndsOn?: string; moveInDate?: string; }
export interface ReceptionClient { id: string; name: string; phone: string; notes: string; active: boolean; requirements: TenantRequirements; createdAt: string; updatedAt?: string; reasons?: string[]; mismatches?: string[]; score?: number; }
export interface OfficeHistory extends OfficeRoom {
  roomId: string; clientId: string; clientName: string; clientPhone: string;
  occurredAt?: string; notMovedReason?: string; tenantRental?: { tenant?: TenantDetails; number: number; startedAt: string; endedAt?: string };
  occupancyStatus?: 'MOVED_IN' | 'NOT_MOVED_IN' | null;
  action: string; notes: string; staffName?: string; recordId?: string; shareId?: string;
  formName?: string; formPhone?: string; formStatus?: string; formDestination?: string;
  createdAt: string;
}
export interface OfficeForm { id: string; name: string; customerNumber: string; status: string; customerDestination?: string; }
export interface OfficeOwnerSummary {
  ownerKey: string; ownerPhone: string; ownerNames: string[]; locations: string[];
  totalRooms: number; availableRooms: number; rentedRooms: number;
  totalClients: number; sentClients: number; visitedClients: number; movedInClients: number;
}
export interface OfficeStaff { id: string; name: string; email: string; phoneNumber: string; officeAccess: boolean; }
export interface TenantDetails { name: string; phone: string; people: number; moveInDate: string; address?: string; occupation?: string; emergencyContact?: string; notes?: string; documentId?: string; }
export interface BookingMessage { id: string; message: string; fromStaff: boolean; senderName: string; createdAt: string; }
export interface MatchedRoom extends OfficeRoom { reasons: string[]; mismatches: string[]; score: number; }
export interface BookingFee { amount: number | null; paymentAvailable: boolean; purpose: string; }
export interface OfficeRequest { id: string; roomId: string; clientName: string; clientPhone: string; message: string; status: string; serviceCharge?: number | string | null; paymentStatus?: string; code: string; title: string; location: string; createdAt: string; }
export interface ClientInput { clientId?: string; clientName: string; clientPhone: string; recordId?: string; notes: string; }
export interface OfficeSearch {
  users: { id: string; name: string; phoneNumber: string; email: string }[];
  rooms: { id: string; code: string; title: string; location: string; ownerPhone: string }[];
  clients: { id: string; name: string; phone: string }[];
  records: { id: string; name: string; customerNumber: string }[];
}
export const officeBackend = String(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.roomkhoj.com').replace(/\/$/,'');
const unwrap = <T,>(response: { data: T | { data: T } }): T => {
  const payload = response.data;
  return payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: T }).data : payload as T;
};
export const officeService = {
  myRequirements: async () => unwrap<{ client: ReceptionClient | null; name: string; phone: string }>(await privateApi.get('/office/my-requirements')),
  saveMyRequirements: async (data: { clientName: string; clientPhone: string; notes: string; requirements: TenantRequirements }) => privateApi.post('/office/my-requirements',data),
  matchingRooms: async (q = '',clientId?: string,page = 0) => unwrap<{ rooms: MatchedRoom[]; total: number }>(await privateApi.get('/office/matching-rooms',{params:{q,clientId,page}})),
  book: async (id: string,message = '') => unwrap<{ id: string }>(await privateApi.post(`/office/matching-rooms/${id}/request`,{message})),
  fee: async () => unwrap<BookingFee>(await privateApi.get('/office/booking-fee')),
  myBookings: async () => unwrap<OfficeRequest[]>(await privateApi.get('/office/my-bookings')),
  pay: async (id: string) => privateApi.post(`/office/requests/${id}/pay`),
  messages: async (id: string) => unwrap<BookingMessage[]>(await privateApi.get(`/office/requests/${id}/messages`)),
  sendMessage: async (id: string,message: string) => privateApi.post(`/office/requests/${id}/messages`,{message}),
  uploadDocument: async (file: File) => { const data = new FormData(); data.append('document',file); return unwrap<{id:string}>(await privateApi.post(`${officeBackend}/office/tenant-documents`,data)); },
  document: async (id: string) => (await privateApi.get<Blob>(`${officeBackend}/office/tenant-documents/${id}`,{responseType:'blob'})).data,
  access: async () => unwrap<{ allowed: boolean; isAdmin: boolean }>(await privateApi.get('/office/access')),
  clients: async (q = '',page = 0) => unwrap<{ clients: ReceptionClient[]; total: number }>(await privateApi.get('/office/clients',{ params: { q,page } })),
  saveClient: async (data: { clientName: string; clientPhone: string; notes: string; requirements: TenantRequirements }) => unwrap<ReceptionClient>(await privateApi.post('/office/clients',data)),
  clientActive: async (id: string,active: boolean) => privateApi.patch(`/office/clients/${id}/active`,{ active }),
  matchingClients: async (id: string,page = 0) => unwrap<{ clients: ReceptionClient[]; total: number; needsRoomDetails: boolean }>(await privateApi.get(`/office/rooms/${id}/matching-clients`,{ params: { page } })),
  rentals: async (id: string,page = 0) => unwrap<{ rentals: OfficeRental[]; total: number }>(await privateApi.get(`/office/rooms/${id}/rentals`,{ params: { page } })),
  myRooms: async () => unwrap<OfficeRoom[]>(await privateApi.get('/office/my-rooms')),
  myVideo: async (id: string) => (await privateApi.get<Blob>(`${officeBackend}/office/my-rooms/${id}/video`,{ responseType: 'blob',timeout: 15*60*1000 })).data,
  myRequest: async (id: string,message: string) => privateApi.post(`/office/my-rooms/${id}/request`,{ message }),
  rooms: async (q: string,status: string,page = 0) => unwrap<{ rooms: OfficeRoom[]; total: number; counts: { status: string; total: number }[]; owners: OfficeOwnerSummary[] }>(await privateApi.get('/office/rooms',{ params: { q,status,page } })),
  room: async (id: string) => unwrap<OfficeRoom>(await privateApi.get(`/office/rooms/${id}`)),
  create: async (data: FormData,onProgress: (percent: number) => void) => unwrap<OfficeRoom>(await privateApi.post(`${officeBackend}/office/rooms`,data,{
    // Send large videos straight to the API; do not route through Vercel's request-body limit.
    timeout: 15*60*1000,onUploadProgress: e => onProgress(e.total ? Math.round(e.loaded*100/e.total) : 0),
  })),
  update: async (id: string,data: Omit<OfficeRoom,'id'|'status'|'createdAt'>) => unwrap<OfficeRoom>(await privateApi.patch(`/office/rooms/${id}`,data)),
  status: async (id: string,status: string,tenant?: TenantDetails,sourceClientId?: string) => privateApi.patch(`/office/rooms/${id}/status`,{ status,tenant,sourceClientId }),
  share: async (id: string,client: ClientInput) => unwrap<{ token: string; shareId: string; expiresAt: string }>(await privateApi.post(`/office/rooms/${id}/share`,client)),
  visit: async (id: string,client: ClientInput,action: string,shareId?: string,occurredAt?: string) => privateApi.post(`/office/rooms/${id}/history`,{ ...client,action,shareId,occurredAt }),
  revoke: async (id: string) => privateApi.post(`/office/rooms/${id}/revoke`),
  history: async (q: string,roomId?: string,page = 0) => unwrap<{ history: OfficeHistory[]; total: number }>(await privateApi.get('/office/history',{ params: { q,roomId,page } })),
  forms: async (phone: string) => unwrap<OfficeForm[]>(await privateApi.get('/office/forms',{ params: { phone } })),
  staff: async (q: string) => unwrap<OfficeStaff[]>(await privateApi.get('/office/staff',{ params: { q } })),
  grant: async (id: string,active: boolean) => privateApi.patch(`/office/staff/${id}`,{ active }),
  requests: async (page = 0,q = '') => unwrap<{ requests: OfficeRequest[]; total: number }>(await privateApi.get('/office/requests',{ params: { page,q } })),
  requestStatus: async (id: string,status: string) => privateApi.patch(`/office/requests/${id}`,{ status }),
  search: async (q: string) => unwrap<OfficeSearch>(await privateApi.get('/office/search',{ params: { q } })),
  video: async (id: string) => (await privateApi.get<Blob>(`${officeBackend}/office/rooms/${id}/video`,{ responseType: 'blob',timeout: 15*60*1000 })).data,
  shared: async (token: string) => unwrap<OfficeRoom>(await api.get(`/office/shared/${token}`,{ headers: { 'Cache-Control': 'no-cache' } })),
  request: async (token: string,data: { name: string; phone: string; message: string }) => api.post(`/office/shared/${token}/request`,data),
};
export function officeError(error: unknown): string {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = e.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || e.message || 'Could not complete this action. Please try again.';
}


