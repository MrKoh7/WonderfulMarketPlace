import type { Request, Response } from 'express';
import * as queries from '../db/queries';
import { getAuth } from '@clerk/express';

// GET all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await queries.getAllProduct();
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error Fetching Products: ', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

// Get products for current user (protected)
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const products = await queries.getProductsByUserId(userId);
    return res.status(200).json({ products });
  } catch (error) {
    console.error('Error getting user product: ', error);
    res.status(500).json({ error: 'Failed to get user  product' });
  }
};

// GET single product (by id)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const product = await queries.getProductById(id);

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product: ', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

// Create Product (protected)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { title, description, imageUrl } = req.body;

    if (!title || !description || !imageUrl) {
      res
        .status(400)
        .json({ error: 'Title, description and imageUrl are required!' });
      return;
    }

    const product = await queries.createProduct({
      title,
      description,
      imageUrl,
      userId,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creaating product: ', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update Product (protected)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { id } = req.params as { id: string };
    const { title, description, imageUrl } = req.body;

    const existingProduct = await queries.getProductById(id);
    if (!existingProduct) {
      res.status(404).json({ error: 'Product not Found' });
      return;
    }

    if (existingProduct.userId !== userId) {
      res.status(403).json({ error: 'You can only update your own product' });
      return;
    }

    const product = await queries.updateProductById(id, {
      title,
      description,
      imageUrl,
    });

    res.status(200).json(product);
  } catch (error) {
    console.error('Error Updating product: ', error);
    res.status(500).json({ error: 'Failed to updated product' });
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { id } = req.params as { id: string };
    const existingProduct = await queries.getProductById(id);
    if (!existingProduct) {
      res.status(404).json({ error: 'Product not Found' });
      return;
    }

    if (existingProduct.userId !== userId) {
      res.status(403).json({ error: 'You can only update your own product' });
      return;
    }

    await queries.deleteProductById(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error Deleting Product: ', error);
    res.status(500).json({ error: 'Error Deleting Product' });
  }
};
