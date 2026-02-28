import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import * as queries from '../db/queries';

// GET current user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const items = await queries.getCartItemsByUserId(userId);
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Error Fetching Data: ', error);
    res.status(500).json({ error: 'Failed to fetch cart data' });
  }
};

// POST - add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: 'productId is required' });

    const product = await queries.getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.userId === userId) {
      return res
        .status(403)
        .json({ error: 'You cannot add your own product to cart' });
    }

    const item = await queries.addToCart(userId, productId);
    return res.status(201).json(item);
  } catch (error) {
    console.error('Error adding to cart: ', error);
    res.status(500).json({ error: 'Error adding to cart' });
  }
};

// PATCH -update quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { id } = req.params as { id: string };
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const item = await queries.updateCartItemQuantity(id, quantity);
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error updating cart item: ', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// DELETE - remove one item
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { id } = req.params as { id: string };
    await queries.removeCartItem(id);
    return res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item: ', error);
    res.status(500).json({ error: 'Fail to remove cart item' });
  }
};

// DELETE - clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    await queries.clearCart(userId);
    return res.status(200).json({ message: 'Cart Cleaned' });
  } catch (error) {
    console.error('Error clearing cart : ', error);
    res.status(500).json({ error: 'Fail to clear cart' });
  }
};
