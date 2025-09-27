import { useState, useCallback } from 'react';
import { userApi, UserFilters, User, UserListResponse } from '@/lib/api/users';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchUsers = useCallback(async (filters: UserFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getUsers({
        ...filters,
        page: filters.page !== undefined ? filters.page : currentPage,
      });
      setUsers(response.content);
      setTotalUsers(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
      return response;
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchUserById = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await userApi.getUserById(userId);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: number, userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userApi.updateUser(userId, userData);
      // Update the user in the list if it exists
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === userId ? updatedUser : user)
      );
      return updatedUser;
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleUserBan = useCallback(async (userId: number, banned: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userApi.toggleUserBan(userId, banned);
      // Update the user in the list if it exists
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === userId ? updatedUser : user)
      );
      return updatedUser;
    } catch (err: any) {
      console.error('Error toggling user ban:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      await userApi.deleteUser(userId);
      // Remove the user from the list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setTotalUsers(prev => prev - 1);
      return true;
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    totalUsers,
    totalPages,
    currentPage,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    updateUser,
    toggleUserBan,
    deleteUser,
    setCurrentPage
  };
}
