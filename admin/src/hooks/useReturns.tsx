import { useState, useCallback } from 'react';
import { returnApi, ReturnFilters, Return, ReturnStatus } from '@/lib/api/returns';

export function useReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [totalReturns, setTotalReturns] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pendingReturns, setPendingReturns] = useState<Return[]>([]);

  const fetchReturns = useCallback(async (filters: ReturnFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await returnApi.getReturns({
        ...filters,
        page: filters.page !== undefined ? filters.page : currentPage,
      });
      setReturns(response.content);
      setTotalReturns(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
      return response;
    } catch (err: any) {
      console.error('Error fetching returns:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchReturnById = useCallback(async (returnId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await returnApi.getReturnById(returnId);
    } catch (err: any) {
      console.error('Error fetching return:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReturnStatus = useCallback(async (returnId: number, status: ReturnStatus, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedReturn = await returnApi.updateReturnStatus(returnId, status, notes);
      
      // Update the return in both lists if it exists
      setReturns(prevReturns => 
        prevReturns.map(returnItem => returnItem.id === returnId ? updatedReturn : returnItem)
      );
      
      // If it was in pending returns, update or remove as needed
      if (status !== 'PENDING') {
        setPendingReturns(prevPending => prevPending.filter(returnItem => returnItem.id !== returnId));
      } else {
        setPendingReturns(prevPending => {
          const exists = prevPending.some(returnItem => returnItem.id === returnId);
          if (!exists) {
            return [...prevPending, updatedReturn];
          }
          return prevPending.map(returnItem => returnItem.id === returnId ? updatedReturn : returnItem);
        });
      }
      
      return updatedReturn;
    } catch (err: any) {
      console.error('Error updating return status:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const pendingItems = await returnApi.getPendingReturns();
      setPendingReturns(pendingItems);
      return pendingItems;
    } catch (err: any) {
      console.error('Error fetching pending returns:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    returns,
    totalReturns,
    totalPages,
    currentPage,
    pendingReturns,
    loading,
    error,
    fetchReturns,
    fetchReturnById,
    updateReturnStatus,
    fetchPendingReturns,
    setCurrentPage
  };
}
