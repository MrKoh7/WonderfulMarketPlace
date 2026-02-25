import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
} from '../lib/api';

// Accepts optional search term — queryKey includes search so TanStack Query
// automatically refetches when the debounced search value changes
export const useProducts = (search, page = 1, limit = 12) => {
  const result = useQuery({
    queryKey: ['products', search, page, limit],
    queryFn: () => getAllProducts(search, page, limit),
  });
  return result;
};

export const useCreateProduct = () => {
  return useMutation({ mutationFn: createProduct });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id, // double bang operator -> convert object to boolean
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
};

export const useMyProducts = () => {
  return useQuery({ queryKey: ['myProducts'], queryFn: getMyProducts });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
};
