import api from './axios';
import type {
  PaginatedProducts,
  ProductWithDetails,
  ProductFormData,
  Product,
  User,
  Comment,
  SyncUserData,
  MyProductsResponse,
} from '../types';

// USERS API
export const syncUser = async (userData: SyncUserData): Promise<User> => {
  const { data } = await api.post<User>('/users/sync', userData);
  return data;
};

// Products API
export const getAllProducts = async (
  search: string | undefined,
  page: number,
  limit: number,
): Promise<PaginatedProducts> => {
  const params = { page, limit, ...(search && { search }) };
  const { data } = await api.get<PaginatedProducts>('/products', { params });
  return data;
};

export const getProductById = async (
  id: string,
): Promise<ProductWithDetails> => {
  const { data } = await api.get<ProductWithDetails>(`/products/${id}`);
  return data;
};

export const getMyProducts = async (): Promise<MyProductsResponse> => {
  const { data } = await api.get<MyProductsResponse>('/products/my');
  return data;
};

export const createProduct = async (
  productData: ProductFormData,
): Promise<Product> => {
  const { data } = await api.post<Product>('/products', productData);
  return data;
};

export const updateProduct = async ({
  id,
  ...productData
}: ProductFormData & { id: string }): Promise<Product> => {
  const { data } = await api.put<Product>(`/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (
  id: string,
): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/products/${id}`);
  return data;
};

// Comments API
export const createComment = async ({
  productId,
  content,
}: {
  productId: string;
  content: string;
}): Promise<Comment> => {
  const { data } = await api.post<Comment>(`/comments/${productId}`, {
    content,
  });
  return data;
};

export const deleteComment = async ({
  commentId,
}: {
  commentId: string;
}): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

// Cart API
export const getCart = async () => {
  const { data } = await api.get('/cart');
  return data;
};

export const addToCart = async (productId: string) => {
  const { data } = await api.post('/cart', { productId });
  return data;
};

export const updateCartItem = async ({
  id,
  quantity,
}: {
  id: string;
  quantity: number;
}) => {
  const { data } = await api.patch(`/cart/${id}`, { quantity });
  return data;
};

export const removeCartItem = async (id: string) => {
  const { data } = await api.delete(`/cart/${id}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart');
  return data;
};
