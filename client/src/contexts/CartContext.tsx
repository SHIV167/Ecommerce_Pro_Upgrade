import { createContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface FreeProduct extends Product {
  minOrderValue: number;
  maxOrderValue?: number;
  isFreeProduct: boolean;
}

interface CartItem {
  id: string;
  product: Product | FreeProduct;
  quantity: number;
  isGift?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (product: Product, quantity?: number) => Promise<void>;
  addGiftToCart: (product: Product & { isGift: boolean }, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  removeItemFromCart: (productId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  totalItems: number;
  isEmpty: boolean;
  freeProducts: Product[];
  eligibleFreeProducts: Product[];
  cart: {
    id: string | null;
    totalPrice: number;
    totalItems: number;
  };
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addItem: async () => {},
  addGiftToCart: async () => {},
  removeItem: async () => {},
  removeItemFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  subtotal: 0,
  totalItems: 0,
  isEmpty: true,
  freeProducts: [],
  eligibleFreeProducts: [],
  cart: {
    id: null,
    totalPrice: 0,
    totalItems: 0
  }
});

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [freeProducts, setFreeProducts] = useState<Product[]>([]);
  const [eligibleFreeProducts, setEligibleFreeProducts] = useState<Product[]>([]);

  // Calculate derived values
  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      (item.product && typeof item.product.price === 'number'
        ? item.product.price * item.quantity
        : 0),
    0
  );
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isEmpty = cartItems.length === 0;

  // Load free products
  useEffect(() => {
    const loadFreeProducts = async () => {
      try {
        const response = await apiRequest('GET', '/api/free-products');
        if (response.ok) {
          const data = await response.json();
          // Get product details for each free product
          const productsWithDetails = await Promise.all(
            data.map(async (freeProduct: any) => {
              try {
                const productResponse = await apiRequest('GET', `/api/products/${freeProduct.productId}`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  return {
                    ...productData,
                    minOrderValue: freeProduct.minOrderValue,
                    maxOrderValue: freeProduct.maxOrderValue,
                    isFreeProduct: true
                  };
                }
              } catch (error) {
                console.error('Failed to fetch product details:', error);
              }
              return null;
            })
          );
          setFreeProducts(productsWithDetails.filter(Boolean));
        }
      } catch (error) {
        console.error('Failed to load free products:', error);
      }
    };
    loadFreeProducts();
  }, []);

  // Check for eligible free products when subtotal changes and manage free products
  useEffect(() => {
    const eligible = (freeProducts as FreeProduct[]).filter((product) => {
      if (!product || typeof product.minOrderValue !== 'number') return false;
      
      // Check if subtotal is within the valid range
      const isAboveMin = product.minOrderValue <= subtotal;
      const isBelowMax = !product.maxOrderValue || subtotal <= product.maxOrderValue;
      
      return isAboveMin && isBelowMax;
    });
    setEligibleFreeProducts(eligible);

    // Get non-free items in cart
    const nonFreeItems = cartItems.filter(item => !item.product?.isFreeProduct);

    // If cart is empty (no non-free items), remove all free products
    if (nonFreeItems.length === 0) {
      cartItems.forEach(item => {
        if (item.product?.isFreeProduct) {
          removeItem(item.id);
        }
      });
      return;
    }

    // Automatically add eligible free products to cart
    eligible.forEach(async (product) => {
      if (!product?._id) return;
      
      const isInCart = cartItems.some(
        item => item.product?._id === product._id
      );

      if (!isInCart) {
        try {
          // Add the free product flag
          const freeProduct = {
            ...product,
            isFreeProduct: true
          };
          await addItem(freeProduct);
        } catch (error) {
          console.error('Failed to add free product:', error);
        }
      }
    });

    // Remove non-eligible free products
    cartItems.forEach(item => {
      if (item.product?.isFreeProduct && !eligible.some(p => p._id === item.product._id)) {
        removeItem(item.id);
      }
    });
  }, [subtotal, freeProducts, cartItems]);

  // Initialize cart on component mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Generate a unique session ID if we don't have one
        let sessionId = localStorage.getItem("cartSessionId");
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("cartSessionId", sessionId);
        }

        // Fetch cart from API
        const response = await fetch(`/api/cart?sessionId=${sessionId}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setCartId(data.id);
          
          if (data.items && Array.isArray(data.items)) {
            setCartItems(data.items);
          }
        }
      } catch (error) {
        console.error("Failed to initialize cart:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeCart();
  }, []);

  // Add item to cart with optimistic updates
  const addItem = async (product: Product, quantity: number = 1) => {
    const previousItems = [...cartItems];
    try {
      // Ensure cartId is available before proceeding
      let currentCartId = cartId;
      if (!currentCartId) {
        const sessionId = localStorage.getItem("cartSessionId");
        const cartResponse = await apiRequest("GET", `/api/cart?sessionId=${sessionId}`);
        const cartData = await cartResponse.json();
        setCartId(cartData.id);
        currentCartId = cartData.id;
      }
      if (!currentCartId) throw new Error("Cart ID not initialized");

      // Find if the item already exists
      const existingItemIndex = cartItems.findIndex(
        (item) => {
          const itemId = (item.product as any).id ?? (item.product as any)._id;
          const prodId = (product as any).id ?? (product as any)._id;
          return itemId === prodId;
        }
      );

      if (existingItemIndex !== -1) {
        // Optimistically update existing item
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedItems);

        // Update in API
        await apiRequest("PUT", `/api/cart/items/${cartItems[existingItemIndex].id}`, {
          quantity: updatedItems[existingItemIndex].quantity,
        });
      } else {
        // Add to API first to get the real MongoDB ID
        const prodId = (product as any).id ?? (product as any)._id;
        const response = await apiRequest("POST", "/api/cart/items", {
          cartId: currentCartId,
          productId: prodId,
          quantity: quantity,
        });

        // Parse the response to get the MongoDB ID
        const data = await response.json();
        const cartItemId = data._id;

        // Add item with real MongoDB ID
        const newItem: CartItem = {
          id: cartItemId,
          product,
          quantity: quantity,
        };
        setCartItems([...cartItems, newItem]);
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      setCartItems(previousItems);
      throw error;
    }
  };

  // Remove item from cart with optimistic updates
  const removeItem = async (itemId: string) => {
    // Store previous state for rollback
    const previousItems = [...cartItems];
    
    try {
      // Optimistically remove item
      setCartItems(cartItems.filter((item) => item.id !== itemId));

      // Remove from API
      if (cartId) {
        await apiRequest("DELETE", `/api/cart/items/${itemId}`, null);
      }
    } catch (error) {
      console.error("Failed to remove item from cart:", error);
      // Rollback on error
      setCartItems(previousItems);
    }
  };

  // Update item quantity with optimistic updates
  const updateQuantity = async (itemId: string, quantity: number) => {
    // Store previous state for rollback
    const previousItems = [...cartItems];

    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      // Optimistically update quantity
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );

      // Update in API
      if (cartId) {
        await apiRequest("PUT", `/api/cart/items/${itemId}`, { quantity });
      }
    } catch (error) {
      console.error("Failed to update cart item quantity:", error);
      // Rollback on error
      setCartItems(previousItems);
    }
  };

  // Clear cart with optimistic updates
  const clearCart = async () => {
    // Store previous state for rollback
    const previousItems = [...cartItems];

    try {
      // First remove all free products
      const freeItemIds = cartItems
        .filter(item => item.product?.isFreeProduct)
        .map(item => item.id);
      
      for (const id of freeItemIds) {
        await removeItem(id);
      }

      // Then clear remaining items
      setCartItems([]);

      // Clear in API
      if (cartId) {
        await apiRequest("DELETE", `/api/cart/${cartId}`, null);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Rollback on error
      setCartItems(previousItems);
    }
  };

  // Add gift item to cart (for gift popup)
  const addGiftToCart = async (product: Product & { isGift: boolean }, quantity: number = 1) => {
    const previousItems = [...cartItems];
    try {
      // Ensure cartId is available before proceeding
      let currentCartId = cartId;
      if (!currentCartId) {
        const sessionId = localStorage.getItem("cartSessionId");
        const cartResponse = await apiRequest("GET", `/api/cart?sessionId=${sessionId}`);
        const cartData = await cartResponse.json();
        setCartId(cartData.id);
        currentCartId = cartData.id;
      }
      if (!currentCartId) throw new Error("Cart ID not initialized");

      // Create optimistic update with gift flag
      const newItem: CartItem = {
        id: String(Date.now()), // Temporary ID
        product: product,
        quantity: 1,
        isGift: true
      };

      setCartItems([...cartItems, newItem]);

      // Send to backend
      const response = await apiRequest("POST", `/api/cart/${currentCartId}/items`, {
        productId: (product as any)._id || (product as any).id,
        quantity: 1,
        isGift: true
      });

      if (!response.ok) {
        // Revert on failure
        setCartItems(previousItems);
        throw new Error("Failed to add gift item");
      }

      // Update cart with server response
      const updatedCart = await response.json();
      if (updatedCart.items) {
        setCartItems(updatedCart.items);
      }
    } catch (error) {
      console.error("Failed to add gift item:", error);
      // Revert to previous state
      setCartItems(previousItems);
    }
  };

  // Remove item by product ID (for gift popup)
  const removeItemFromCart = async (productId: string) => {
    const previousItems = [...cartItems];
    try {
      // Find the item with this product ID
      const itemToRemove = cartItems.find(
        item => (item.product as any)._id === productId || (item.product as any).id === productId
      );

      if (!itemToRemove) return;

      // Call the existing removeItem function
      await removeItem(itemToRemove.id);
    } catch (error) {
      console.error("Failed to remove item by product ID:", error);
      // Revert to previous state
      setCartItems(previousItems);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        addGiftToCart,
        removeItem,
        removeItemFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        isEmpty: cartItems.length === 0,
        freeProducts,
        eligibleFreeProducts,
        cart: {
          id: cartId || '',
          totalPrice: subtotal,
          totalItems
        }
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
