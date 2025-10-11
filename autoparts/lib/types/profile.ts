export interface UserProfile {
  name?: string;
  surname?: string;
  fathername?: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  type?: string;
  clientName?: string;
  role?: string;
  balance?: number;
  officeAddress?: string;
}

export interface UserProfileUpdateRequest {
  name?: string;
  surname?: string;
  fathername?: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  type?: string;
  clientName?: string;
  officeAddress?: string;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: number;
}
