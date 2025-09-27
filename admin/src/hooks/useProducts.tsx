import { useState, useCallback } from 'react';
import { productApi, ProductFilters, Product } from '@/lib/api/products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const fetchProducts = useCallback(async (filters: ProductFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getProducts({
        ...filters,
        page: filters.page !== undefined ? filters.page : currentPage,
      });
      setProducts(response.content);
      setTotalProducts(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
      return response;
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchProductById = useCallback(async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await productApi.getProductById(productId);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const newProduct = await productApi.createProduct(productData);
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      setTotalProducts(prev => prev + 1);
      return newProduct;
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId: number, productData: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProduct = await productApi.updateProduct(productId, productData);
      // Update the product in the list if it exists
      setProducts(prevProducts => 
        prevProducts.map(product => product.id === productId ? updatedProduct : product)
      );
      return updatedProduct;
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      await productApi.deleteProduct(productId);
      // Remove the product from the list
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      setTotalProducts(prev => prev - 1);
      return true;
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadProductImages = useCallback(async (productId: number, files: File[]) => {
    try {
      setLoading(true);
      setError(null);
      const imageUrls = await productApi.uploadProductImages(productId, files);
      return imageUrls;
    } catch (err: any) {
      console.error('Error uploading product images:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await productApi.getCategories();
      setCategories(fetchedCategories);
      return fetchedCategories;
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBrands = await productApi.getBrands();
      setBrands(fetchedBrands);
      return fetchedBrands;
    } catch (err: any) {
      console.error('Error fetching brands:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    totalProducts,
    totalPages,
    currentPage,
    categories,
    brands,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    fetchCategories,
    fetchBrands,
    setCurrentPage
  };
}
