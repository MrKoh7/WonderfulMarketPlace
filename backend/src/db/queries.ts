import { db } from './index';
import { eq, ilike, or, count, and, sql, isNull } from 'drizzle-orm';
import {
  users,
  comments,
  products,
  type NewUser,
  type NewComment,
  type NewProduct,
  cartItems,
  orders,
  orderItems,
} from './schema';

/**
 *
 * User Queries
 *
 */
export const createUser = async (data: NewUser) => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

export const getUserById = async (id: string) => {
  return db.query.users.findFirst({ where: eq(users.id, id) });
};

export const updateUser = async (id: string, data: Partial<NewUser>) => {
  const existingUser = await getUserById(id);
  if (!existingUser) {
    throw new Error(`User with id ${id} not found!`);
  }

  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user;
};

// create or update in one method
export const upsertUser = async (data: NewUser) => {
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.id,
      set: data,
    })
    .returning();
  return user;
};

/**
 *
 * Product Queries
 *
 */
export const createProduct = async (data: NewProduct) => {
  const [product] = await db.insert(products).values(data).returning();
  return product;
};

export const getAllProduct = async () => {
  return db.query.products.findMany({
    columns: { embedding: false },
    with: { user: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
    // get latest products first
    // Drizzle ORM expects an array even for a single column in the square bracket
  });
};

// Search products by title or description using case-insensitive ILIKE
export const searchProducts = async (
  search?: string,
  page: number = 1,
  limit: number = 12,
) => {
  const pattern = search ? `%${search}%` : undefined;
  const offset = (page - 1) * limit;
  const whereCondition = pattern
    ? or(ilike(products.title, pattern), ilike(products.description, pattern))
    : undefined;

  const data = await db.query.products.findMany({
    where: whereCondition,
    columns: {
      embedding: false,
    },
    with: { user: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
    offset: offset,
    limit: limit,
  });

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(products)
    .where(whereCondition);

  return { data, total };
};

export const getProductById = async (id: string) => {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { embedding: false },
    with: {
      user: true,
      comments: {
        with: { user: true },
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      },
    },
  });
};

export const getProductsByUserId = async (userId: string) => {
  return db.query.products.findMany({
    where: eq(products.userId, userId),
    columns: { embedding: false },
    with: { user: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
};

export const updateProductById = async (
  id: string,
  data: Partial<NewProduct>,
) => {
  const exisitingProduct = await getProductById(id);
  if (!exisitingProduct) {
    throw new Error(`Product with id ${id} not found!`);
  }

  const [product] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning();
  return product;
};

export const deleteProductById = async (id: string) => {
  const exisitingProduct = await getProductById(id);
  if (!exisitingProduct) {
    throw new Error(`Product with id ${id} not found!`);
  }
  const [product] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();
  return product;
};

/**
 *
 * Cart Items
 */

export const getCartItemsByUserId = async (userId: string) => {
  return db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: { product: { with: { user: true } } },
  });
};

export const addToCart = async (userId: string, productId: string) => {
  const existing = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.userId, userId),
      eq(cartItems.productId, productId),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity: existing.quantity + 1 })
      .where(eq(cartItems.id, existing.id))
      .returning();
    return updated;
  }

  const [newItem] = await db
    .insert(cartItems)
    .values({ userId, productId, quantity: 1 })
    .returning();
  return newItem;
};

export const updateCartItemQuantity = async (id: string, quantity: number) => {
  const [updated] = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, id))
    .returning();
  return updated;
};

export const removeCartItem = async (id: string) => {
  await db.delete(cartItems).where(eq(cartItems.id, id));
};

export const clearCart = async (userId: string) => {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
};

/**
 *
 * Comments Queries
 *
 */
export const createComment = async (data: NewComment) => {
  const [comment] = await db.insert(comments).values(data).returning();
  return comment;
};

export const deleteComment = async (id: string) => {
  const exisitingComment = await getCommentById(id);
  if (!exisitingComment) {
    throw new Error(`Comment with id ${id} not found`);
  }

  const [comment] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();
  return comment;
};

export const getCommentById = async (id: string) => {
  return db.query.comments.findFirst({
    where: eq(comments.id, id),
    with: { user: true },
  });
};

/**
 *
 * Order Queries
 *
 */

export const createOrder = async (data: {
  buyerId: string;
  sellerId: string;
  stripePaymentIntentId: string;
  totalAmount: string;
  platformFee: string;
  items: {
    productId: string;
    quantity: number;
    priceAtPurchase: string;
  }[];
}) => {
  // Create the order and its items in a single transaction
  // If any part fails, the whole thing rolls back
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        status: 'pending',
        totalAmount: data.totalAmount,
        platformFee: data.platformFee,
      })
      .returning();

    await tx.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    );

    return order;
  });
};

export const updateOrderStatus = async (
  stripePaymentIntentId: string,
  status: string,
) => {
  const [order] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.stripePaymentIntentId, stripePaymentIntentId))
    .returning();
  return order;
};

export const getOrdersByBuyerId = async (buyerId: string) => {
  return db.query.orders.findMany({
    where: eq(orders.buyerId, buyerId),
    with: {
      orderItems: {
        with: { product: true },
      },
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
};

export const updateUserStripeAccount = async (
  userId: string,
  stripeAccountId: string,
) => {
  const [user] = await db
    .update(users)
    .set({ stripeAccountId })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

export const completeUserStripeOnboarding = async (userId: string) => {
  const [user] = await db
    .update(users)
    .set({ stripeOnboardingComplete: true })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

// Semantic Search Queries
export const searchProductsByEmbedding = async (queryEmbedding: number[]) => {
  const vectorString = `[${queryEmbedding.join(',')}]`;

  console.log('[Query] Vector length:', queryEmbedding.length);

  try {
    const results = await db.execute(sql`
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.image_url,
        p.user_id,
        p.created_at,
        1 - (p.embedding <=> ${vectorString}::vector) AS similarity,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'imageUrl', u.image_url
        ) AS user
      FROM product p
      JOIN users u ON p.user_id = u.id
      WHERE p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> ${vectorString}::vector) > 0.35
      ORDER BY p.embedding <=> ${vectorString}::vector
      LIMIT 12
    `);

    console.log('[Query] Row count:', results.rows.length);
    return results.rows;
  } catch (err: any) {
    console.error('[Query] Raw SQL error:', err.message);
    throw err;
  }
};

// Updates a single product's embedding vector - called on create/update
export const updateProductEmbedding = async (
  productId: string,
  embeddingVector: number[],
) => {
  const vectorString = JSON.stringify(embeddingVector);

  await db.execute(sql`
    UPDATE product
    SET embedding = ${vectorString}::vector
    WHERE id = ${productId}::uuid
    `);
};

// Fetch all products with no embedding yet - for backfill script
export const getProductWithoutEmbedding = async () => {
  return db.query.products.findMany({
    where: isNull(products.embedding),
    columns: { embedding: false },
  });
};
