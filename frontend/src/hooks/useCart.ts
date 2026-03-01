import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../lib/api';
import type { CartItem, CartResponse } from '../types';

export const useCart = () => {
  return useQuery<CartResponse, Error>({
    queryKey: ['cart'],
    queryFn: getCart,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation<CartItem, Error, string>({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation<CartItem, Error, { id: string; quantity: number }>({
    mutationFn: updateCartItem,

    onMutate: async ({ id, quantity }) => {
      // Cancel in-flight refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot current cache for rollback on error
      const previousCart = queryClient.getQueryData<CartResponse>(['cart']);

      // Instantly update the quantity in cache before server responds
      queryClient.setQueryData<CartResponse>(['cart'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        };
      });

      return { previousCart };
    },

    onError: (_err, _variables, context: any) => {
      // Roll back to previous cache state if server rejects the update
      if (context?.previousCart) {
        queryClient.setQueryData<CartResponse>(['cart'], context.previousCart);
      }
    },

    onSettled: () => {
      // Always sync with server after mutation resolves either way
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, void>({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
