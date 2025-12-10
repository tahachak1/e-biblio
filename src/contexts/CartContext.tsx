import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const RENTAL_MULTIPLIERS: Record<number, number> = {
  7: 1,
  14: 1.8,
  30: 3,
};

const DEFAULT_RENTAL_DURATION = 7;

const computeRentalPrice = (base: number, duration: number) => {
  const multiplier = RENTAL_MULTIPLIERS[duration] ?? 1;
  return Number((base * multiplier).toFixed(2));
};

interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  rentalDuration?: number;
  image: string;
  quantity: number;
  type: 'purchase' | 'rent';
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateRentalDuration: (id: string, duration: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Charger le panier depuis le localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsed: CartItem[] = JSON.parse(savedCart);
      setCart(
        parsed.map((item) => {
          if (item.type !== 'rent') return item;
          const duration = item.rentalDuration || DEFAULT_RENTAL_DURATION;
          const multiplier = RENTAL_MULTIPLIERS[duration] ?? 1;
          const base = item.rentPrice ?? item.price / multiplier;
          return {
            ...item,
            rentPrice: base,
            rentalDuration: duration,
            price: computeRentalPrice(base, duration),
          };
        })
      );
    }
  }, []);

  useEffect(() => {
    // Sauvegarder le panier dans le localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const normalized: Omit<CartItem, 'quantity'> = item.type === 'rent'
      ? {
          ...item,
          rentPrice: item.rentPrice ?? item.price,
          rentalDuration: item.rentalDuration || DEFAULT_RENTAL_DURATION,
          price: item.price ?? 0,
        }
      : item;
    const baseRentPrice = normalized.rentPrice ?? normalized.price;
    const priceWithDuration =
      normalized.type === 'rent'
        ? computeRentalPrice(baseRentPrice, normalized.rentalDuration || DEFAULT_RENTAL_DURATION)
        : normalized.price;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === normalized.id && cartItem.type === normalized.type
      );
      
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === normalized.id && cartItem.type === normalized.type
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                rentPrice: normalized.type === 'rent' ? baseRentPrice : cartItem.rentPrice,
                rentalDuration: normalized.type === 'rent'
                  ? cartItem.rentalDuration || normalized.rentalDuration || DEFAULT_RENTAL_DURATION
                  : cartItem.rentalDuration,
                price: normalized.type === 'rent'
                  ? computeRentalPrice(
                      baseRentPrice,
                      cartItem.rentalDuration || normalized.rentalDuration || DEFAULT_RENTAL_DURATION
                    )
                  : cartItem.price,
              }
            : cartItem
        );
      }
      
      return [
        ...prevCart,
        {
          ...normalized,
          price: priceWithDuration,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const updateRentalDuration = (id: string, duration: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== id || item.type !== 'rent') return item;
        const previousMultiplier = RENTAL_MULTIPLIERS[item.rentalDuration || DEFAULT_RENTAL_DURATION] ?? 1;
        const base = item.rentPrice ?? item.price / previousMultiplier;
        return {
          ...item,
          rentalDuration: duration,
          price: computeRentalPrice(base, duration),
        };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateRentalDuration,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
