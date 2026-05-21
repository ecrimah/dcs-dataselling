"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CartLine {
  key: string;
  bundleId: string;
  phone: string;
}

const STORAGE_KEY = "dcs-vendor-cart";

interface CartContextValue {
  cart: CartLine[];
  count: number;
  setCart: (lines: CartLine[]) => void;
  addLine: (line: Omit<CartLine, "key">) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function VendorCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<CartLine[]>([]);

  useEffect(() => {
    setCartState(loadCart());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCartState(loadCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((lines: CartLine[]) => {
    setCartState(lines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, []);

  const setCart = useCallback((lines: CartLine[]) => persist(lines), [persist]);

  const addLine = useCallback(
    (line: Omit<CartLine, "key">) => {
      const next = [...loadCart(), { ...line, key: `${line.bundleId}-${line.phone}-${Date.now()}` }];
      persist(next);
    },
    [persist],
  );

  const removeLine = useCallback(
    (key: string) => {
      persist(loadCart().filter((c) => c.key !== key));
    },
    [persist],
  );

  const clearCart = useCallback(() => persist([]), [persist]);

  return (
    <CartContext.Provider
      value={{ cart, count: cart.length, setCart, addLine, removeLine, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useVendorCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: [] as CartLine[],
      count: 0,
      setCart: () => {},
      addLine: () => {},
      removeLine: () => {},
      clearCart: () => {},
    };
  }
  return ctx;
}
