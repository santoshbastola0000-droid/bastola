import { privateApi } from '@/http/api/privateApi';
import { apiV1Path } from '@/http/api/versioned-path';
import type { ShiftingBooking, ShiftingList, ShiftingRequest } from '@/types/shifting.types';

const root = apiV1Path('/shifting');
export const shiftingService = {
  async list(admin: boolean, page: number, status = '') {
    return (await privateApi.get<ShiftingList>(`${root}/${admin ? 'admin' : 'me'}`, { params: { page, ...(status ? { status } : {}) } })).data;
  },
  async create(payload: ShiftingRequest, photos: File[]) {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    photos.forEach(photo => form.append('photos', photo));
    return (await privateApi.post<{ data: ShiftingBooking }>(root, form)).data.data;
  },
  async action(id: string, action: 'quote' | 'accept' | 'status' | 'cancel' | 'messages' | 'review', payload: object) {
    return (await privateApi.post<{ data: ShiftingBooking }>(`${root}/${id}/${action}`, payload)).data.data;
  },
  async photo(id: string, index: number) {
    return (await privateApi.get<Blob>(`${root}/${id}/photos/${index}`, { responseType: 'blob' })).data;
  },
};
