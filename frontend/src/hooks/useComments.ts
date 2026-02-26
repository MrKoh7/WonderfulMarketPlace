import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment } from '../lib/api';
import type { Comment } from '../types';

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation<Comment, Error, { productId: string; content: string }>({
    mutationFn: createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product', variables.productId],
      });
    },
  });
};

export const useDeleteComment = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { commentId: string }>({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product', productId],
      });
    },
  });
};
