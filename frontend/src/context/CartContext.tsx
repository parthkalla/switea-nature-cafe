import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  tableToken: string | null;
  tableInfo: { tableNumber: string; name: string; section?: string } | null;
  discountCode: string;
  setTableSession: (token: string, info: { tableNumber: string; name: string; section?: string }) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, variantId: string | undefined, delta: number) => void;
  removeItem: (menuItemId: string, variantId: string | undefined) => void;
  setDiscountCode: (code: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'switea_cart';
const TABLE_STORAGE_KEY = 'switea_table';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableToken, setTableToken] = useState<string | null>(() => {
    return localStorage.getItem('switea_table_token') || null;
  });

  const [tableInfo, setTableInfo] = useState<{ tableNumber: string; name: string; section?: string } | null>(() => {
    try {
      const saved = localStorage.getItem(TABLE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [discountCode, setDiscountCode] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setTableSession = (token: string, info: { tableNumber: string; name: string; section?: string }) => {
    setTableToken(token);
    setTableInfo(info);
    localStorage.setItem('switea_table_token', token);
    localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));
  };

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // Find matching item with exact variant
      const index = prev.findIndex(
        (i) => i.menuItemId === newItem.menuItemId && i.variantId === newItem.variantId
      );

      if (index > -1) {
        const updated = [...prev];
        updated[index].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (menuItemId: string, variantId: string | undefined, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === menuItemId && item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (menuItemId: string, variantId: string | undefined) => {
    setItems((prev) => prev.filter((i) => !(i.menuItemId === menuItemId && i.variantId === variantId)));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const subtotal = items.reduce((sum, item) => {
    const modTotal = (item.selectedModifiers || []).reduce((acc, m) => acc + m.price, 0);
    return sum + (item.price + modTotal) * item.quantity;
  }, 0);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        tableToken,
        tableInfo,
        discountCode,
        setTableSession,
        addItem,
        updateQuantity,
        removeItem,
        setDiscountCode,
        clearCart,
        subtotal,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
