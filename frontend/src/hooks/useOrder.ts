import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '../lib/api';
import type { Order } from '../types';

export const useMyOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['my-order'],
    queryFn: getMyOrders,
  });
};
