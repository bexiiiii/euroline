import { apiFetch } from '../api';

export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  clientName?: string;
  country?: string;
  state?: string;
  city?: string;
  officeAddress?: string;
  type?: string;
  surname?: string;
  name?: string;
  fathername?: string;
  phone?: string;
  lastBrowser?: string;
  banned: boolean;
  createdAt?: string;
}

export interface UserFilters {
  page?: number;
  size?: number;
  q?: string; // изменили search на q для соответствия бэкенду
  role?: string;
  banned?: boolean;
}

export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const userApi = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.size !== undefined) queryParams.append('size', filters.size.toString());
    if (filters.q) queryParams.append('q', filters.q); // изменили search на q
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.banned !== undefined) queryParams.append('banned', filters.banned.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiFetch<UserListResponse>(`/api/users${query}`); // исправили путь
  },

  /**
   * Get a specific user by ID
   */
  getUserById: async (userId: number): Promise<User> => {
    return apiFetch<User>(`/api/users/${userId}`); // исправили путь
  },

  /**
   * Update user information
   */
  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    return apiFetch<User>(`/api/users/${userId}`, { // исправили путь
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Ban or unban a user
   */
  toggleUserBan: async (userId: number, banned: boolean): Promise<User> => {
    return apiFetch<User>(`/api/users/${userId}/status?banned=${banned}`, { // исправили путь и метод
      method: 'PATCH',
    });
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: number): Promise<void> => {
    return apiFetch<void>(`/api/users/${userId}`, { // исправили путь
      method: 'DELETE',
    });
  },

  /**
   * Create a new user
   */
  createUser: async (userData: {
    email: string;
    password: string;
    role: string;
    name?: string;
    surname?: string;
    clientName?: string;
    phone?: string;
  }): Promise<User> => {
    return apiFetch<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Update user role
   */
  updateUserRole: async (userId: number, role: 'USER' | 'ADMIN'): Promise<User> => {
    return apiFetch<User>(`/api/users/${userId}/role?role=${role}`, {
      method: 'PATCH',
    });
  },
};
