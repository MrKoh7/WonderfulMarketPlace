// ─── Base entity types (mirrors backend/src/db/schema.ts $inferSelect) ───
// Dates are `string` because JSON serialization converts Date → ISO string

export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  productId: string;
  createdAt: string;
}

// ─── Composed types (what the API actually returns) ───

export interface CommentWithUser extends Comment {
  user: User | null;
}

export interface ProductWithUser extends Product {
  price: string | null;
  user: User | null;
  comments?: CommentWithUser[];
}

export interface ProductWithDetails extends Product {
  user: User | null;
  comments: CommentWithUser[];
  price: string | null;
}

// ─── API response shapes ───

export interface PaginatedProducts {
  data: ProductWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyProductsResponse {
  products: ProductWithUser[];
}

// ─── Input types (for create/update mutations) ───

export interface ProductFormData {
  title: string;
  description: string;
  imageUrl: string;
  price: string | null;
}

export interface SyncUserData {
  email: string | undefined;
  name: string | null;
  imageUrl: string;
}
