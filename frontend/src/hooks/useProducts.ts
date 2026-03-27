import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
} from '../lib/api';
import type {
  PaginatedProducts,
  ProductWithDetails,
  ProductFormData,
  Product,
  MyProductsResponse,
} from '../types';
import { semanticSearchProducts } from '../lib/api';

// Accepts optional search term — queryKey includes search so TanStack Query
// automatically refetches when the debounced search value changes
export const useProducts = (
  search: string | undefined,
  page: number = 1,
  limit: number = 12,
) => {
  return useQuery<PaginatedProducts, Error>({
    queryKey: ['products', search, page, limit],
    queryFn: () => getAllProducts(search, page, limit),
  });
};

export const useCreateProduct = () => {
  return useMutation<Product, Error, ProductFormData>({
    mutationFn: createProduct,
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery<ProductWithDetails, Error>({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
};

export const useMyProducts = () => {
  return useQuery<MyProductsResponse, Error>({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, ProductFormData & { id: string }>({
    mutationFn: updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
};

export const useSemanticSearch = (query: string) => {
  return useQuery<ProductWithDetails[], Error>({
    queryKey: ['semantic-search', query],
    queryFn: () => semanticSearchProducts(query),
    enabled: query.trim().length >= 3,
    staleTime: 0,
    gcTime: 0
  });
};
