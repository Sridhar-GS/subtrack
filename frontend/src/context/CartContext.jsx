import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartId(null);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart/');
      setCartId(res.data.id);
      setCartItems(res.data.items || []);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, unitPrice, variantId = null, planId = null) => {
    try {
      const res = await api.post('/cart/items', {
        product_id: productId,
        variant_id: variantId,
        plan_id: planId,
        quantity,
        unit_price: unitPrice,
      });
      setCartItems(res.data.items || []);
      setCartId(res.data.id);
    } catch (err) {
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      setCartItems(res.data.items || []);
    } catch (err) {
      throw err;
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/');
      setCartItems([]);
    } catch (err) {
      throw err;
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, cartId, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
