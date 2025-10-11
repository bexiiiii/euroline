import { useState, useCallback } from 'react';
import { ordersApi, OrderFilters, Order, OrderStatus } from '@/lib/api/orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchOrders = useCallback(async (filters: OrderFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getOrders({
        ...filters,
        page: filters.page !== undefined ? filters.page : currentPage,
      });
      setOrders(response.content);
      setTotalOrders(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
      return response;
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchOrderById = useCallback(async (orderId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await ordersApi.getOrder(orderId);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: number, status: OrderStatus) => {
    try {
      setLoading(true);
      setError(null);
      const updatedOrder = await ordersApi.updateOrderStatus(orderId, status);
      // Update the order in the list if it exists
      setOrders(prevOrders => 
        prevOrders.map(order => order.id === orderId ? updatedOrder : order)
      );
      return updatedOrder;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderStats = useCallback(async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      setLoading(true);
      setError(null);
      return await ordersApi.getStats();
    } catch (err: any) {
      console.error('Error fetching order stats:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportOrders = useCallback(async (filters: OrderFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await ordersApi.exportOrders(filters);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (err: any) {
      console.error('Error exporting orders:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    totalOrders,
    totalPages,
    currentPage,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    updateOrderStatus,
    getOrderStats,
    exportOrders,
    setCurrentPage
  };
}
