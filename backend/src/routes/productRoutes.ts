import { Router } from 'express';
import * as productController from '../controllers/productControllers';
import { requireAuth } from '@clerk/express';

const router = Router();

// GET /api/products : get all products (public)
router.get('/', productController.getAllProducts);

// GET /api/products/my - get user's products
router.get('/my', requireAuth(), productController.getMyProducts);

// GET /api/products/:id - get single productby ID
router.get('/:id', productController.getProductById);

// POST /api/products - create new product (protected)
router.post('/', requireAuth(), productController.createProduct);

// PUT /api/products/:id - update product (protected - owner only)
router.put('/:id', requireAuth(), productController.updateProduct);

// DELETE 
router.delete("/:id", requireAuth(), productController.deleteProduct)
export default router;
