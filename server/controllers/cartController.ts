import { Request, Response } from 'express';
import { MongoDBStorage } from '../storage/MongoDBStorage';
import { FreeProduct } from '../../shared/schema';
import FreeProductModel from '../models/FreeProduct';

const storage = new MongoDBStorage();

// Helper function to calculate cart total
async function calculateCartTotal(cartId: string): Promise<number> {
  const cartItems = await storage.getCartItemsWithProductDetails(cartId);
  return cartItems.reduce((total, item) => {
    if (!item.isFree) {
      return total + (item.product.price * item.quantity);
    }
    return total;
  }, 0);
}

// Add item to cart with validation for free products
export async function addCartItem(req: Request, res: Response) {
  try {
    const { cartId, productId, quantity, isFree } = req.body;

    // If it's a free product, validate it
    if (isFree) {
      const freeProduct = await FreeProductModel.findById(productId);
      
      // Check if free product exists and is enabled
      if (!freeProduct || !freeProduct.enabled) {
        return res.status(404).json({ message: 'Free product not found or disabled' });
      }

      // Calculate current cart total
      const cartTotal = await calculateCartTotal(cartId);

      // Validate minimum order value
      if (cartTotal < freeProduct.minOrderValue) {
        return res.status(400).json({ 
          message: `Minimum order value of ₹${freeProduct.minOrderValue} required to add this free product` 
        });
      }

      // Validate maximum order value - only apply if maxOrderValue is not null
      if (freeProduct.maxOrderValue !== null && cartTotal > freeProduct.maxOrderValue) {
        return res.status(400).json({ 
          message: `Cart total exceeds maximum order value of ₹${freeProduct.maxOrderValue} for this free product` 
        });
      }
    }

    // Add item to cart
    const cartItem = await storage.addCartItem({
      cartId,
      productId,
      quantity,
      isFree: isFree || false
    });

    res.json(cartItem);
  } catch (error) {
    console.error('Add cart item error:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
}

// Get cart items
export async function getCartItems(req: Request, res: Response) {
  try {
    const { cartId } = req.params;
    const cartItems = await storage.getCartItemsWithProductDetails(cartId);
    res.json(cartItems);
  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Get cart item to check if it's a free product
    const cartItems = await storage.getCartItems(id);
    const cartItem = cartItems[0];

    if (cartItem?.isFree) {
      const freeProduct = await FreeProductModel.findById(cartItem.productId);
      
      if (!freeProduct || !freeProduct.enabled) {
        return res.status(404).json({ message: 'Free product not found or disabled' });
      }

      // Calculate current cart total
      const cartTotal = await calculateCartTotal(cartItem.cartId);

      // Validate minimum order value
      if (cartTotal < freeProduct.minOrderValue) {
        return res.status(400).json({ 
          message: `Minimum order value of ₹${freeProduct.minOrderValue} required for this free product` 
        });
      }

      // Validate maximum order value - only apply if maxOrderValue is not null
      if (freeProduct.maxOrderValue !== null && cartTotal > freeProduct.maxOrderValue) {
        return res.status(400).json({ 
          message: `Cart total exceeds maximum order value of ₹${freeProduct.maxOrderValue} for this free product` 
        });
      }
    }

    const updatedCartItem = await storage.updateCartItemQuantity(id, quantity);
    if (!updatedCartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json(updatedCartItem);
  } catch (error) {
    console.error('Update cart item quantity error:', error);
    res.status(500).json({ message: 'Error updating cart item quantity' });
  }
}

// Remove item from cart
export async function removeCartItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = await storage.removeCartItem(id);
    if (!success) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.json({ message: 'Cart item removed successfully' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Error removing cart item' });
  }
}

// Clear cart
export async function clearCart(req: Request, res: Response) {
  try {
    const { cartId } = req.params;
    const success = await storage.clearCart(cartId);
    if (!success) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
}

// New: Get or create cart by sessionId or userId
export async function getCart(req: Request, res: Response) {
  try {
    const { sessionId, userId } = req.query;
    let cart = await storage.getCart(userId as string, sessionId as string);
    if (!cart) {
      if (!sessionId && !userId) {
        return res.status(400).json({ message: 'sessionId or userId required' });
      }
      const createData: any = {};
      if (sessionId) createData.sessionId = sessionId as string;
      if (userId) createData.userId = userId as string;
      cart = await storage.createCart(createData);
    }
    // fetch existing items to restore cart on client
    const items = await storage.getCartItemsWithProductDetails(cart.id as string);
    res.json({ ...cart, items });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Error getting cart', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
