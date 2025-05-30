import express from 'express';
import {
  addCartItem,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  getCart
} from '../controllers/cartController';

const router = express.Router();

// Cart routes
router.get('/cart', getCart);
router.post('/cart/items', addCartItem);
router.get('/cart/:cartId/items', getCartItems);
router.put('/cart/items/:id', updateCartItemQuantity);
router.delete('/cart/items/:id', removeCartItem);
router.delete('/cart/:cartId', clearCart);

export default router;
