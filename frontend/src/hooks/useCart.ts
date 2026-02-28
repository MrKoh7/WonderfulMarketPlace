import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../lib/api';

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
