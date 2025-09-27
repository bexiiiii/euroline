// Common types used across API modules
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}
