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
  CartItem,
  CartResponse,
  CreatePaymentIntentResponse,
  OnboardingStatusResponse,
  OnboardingUrlResponse,
  Order,
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
export const getCart = async (): Promise<CartResponse> => {
  const { data } = await api.get<CartResponse>('/cart');
  return data;
};

export const addToCart = async (productId: string): Promise<CartItem> => {
  const { data } = await api.post<CartItem>('/cart', { productId });
  return data;
};

export const updateCartItem = async ({
  id,
  quantity,
}: {
  id: string;
  quantity: number;
}): Promise<CartItem> => {
  const { data } = await api.patch<CartItem>(`/cart/${id}`, { quantity });
  return data;
};

export const removeCartItem = async (
  id: string,
): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/cart/${id}`);
  return data;
};

export const clearCart = async (): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>('/cart');
  return data;
};

// Payments API
export const createPaymentIntent = async (
  sellerId: string,
): Promise<CreatePaymentIntentResponse> => {
  const { data } = await api.post<CreatePaymentIntentResponse>(
    '/payments/create-payment-intent',
    { sellerId },
  );
  return data;
};

export const onboardSeller = async (): Promise<OnboardingUrlResponse> => {
  const { data } = await api.post<OnboardingUrlResponse>('/payments/onboard');
  return data;
};

export const getOnboardingStatus =
  async (): Promise<OnboardingStatusResponse> => {
    const { data } = await api.get<OnboardingStatusResponse>(
      '/payments/onboard/status',
    );
    return data;
  };

export const getMyOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/payments/orders');
  return data;
};

export const semanticSearchProducts = async (
  query: string,
): Promise<ProductWithDetails[]> => {
  const { data } = await api.get<any[]>('/ai/semantic-search', {
    params: { q: query },
  });

  // Raw SQL returns snake_case — map to camelCase to match ProductWithDetails type
  return data.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.price,
    imageUrl: item.image_url,
    userId: item.user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at ?? item.created_at,
    user: item.user,
    comments: [],
  }));
};
