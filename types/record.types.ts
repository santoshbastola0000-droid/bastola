export interface Record {
  id: string;
  name: string;
  customerNumber: string;
  roomPlaceNumber: string;
  roomPlaceAddress: string;
  payMode: PayMode;
  paymentStatus: PaymentStatus;
  formCharge: number;
  remarks: string;
  recordYearId: string;
  createdAt: string;
}

export interface RecordYear {
  id: string;
  year: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  records: Record[];
}

export interface RecordsResponse {
  message: string;
  data: Record[];
  pagination: Pagination;
}

export interface RecordResponse {
  message: string;
  data: Record;
}

export interface CreateRecordDTO {
  name: string;
  customerNumber: string;
  roomPlaceNumber: string;
  roomPlaceAddress: string;
  payMode: PayMode;
  paymentStatus: PaymentStatus;
  formCharge: number;
  remarks: string;
  recordYearId: string;
}

export interface RecordsFilter {
  page?: number;
  take?: number;
  search?: string;
  recordYearId?: string;
}

export enum PaymentStatus {
  PAID = "Paid",
  DUE = "Due",
}

export enum PayMode {
  DIGITAL = "Digital",
  CASH = "Cash",
}

export interface Pagination {
  previousPage: number | null;
  nextPage: number | null;
  total: number;
  count: number;
}

export interface UpdateRecordDTO {
  name?: string;
  customerNumber?: string;
  roomPlaceNumber?: string;
  roomPlaceAddress?: string;
  payMode?: PayMode;
  paymentStatus?: PaymentStatus;
  formCharge?: number;
  remarks?: string;
  recordYearId?: string;
}
