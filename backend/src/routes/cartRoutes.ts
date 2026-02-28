import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController';

const router = Router()

router.get('/', requireAuth(), getCart)
router.post('/', requireAuth(), addToCart)
router.patch('/:id', requireAuth(), updateCartItem)
router.delete('/:id', requireAuth(), removeCartItem)
router.delete('/', requireAuth(), clearCart)

export default router