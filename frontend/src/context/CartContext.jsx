import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "aiel_cart_v1";

function reducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, { ...action.item, key: `${action.item.product_id}-${action.item.size}-${action.item.color}-${Date.now()}` }];
    case "remove":
      return state.filter((i) => i.key !== action.key);
    case "update":
      return state.map((i) => (i.key === action.key ? { ...i, ...action.patch } : i));
    case "clear":
      return [];
    case "load":
      return action.items || [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "load", items: JSON.parse(raw) });
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totals = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const amount = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    return { count, amount };
  }, [items]);

  const value = {
    items,
    totals,
    open,
    setOpen,
    addItem: (item) => dispatch({ type: "add", item }),
    removeItem: (key) => dispatch({ type: "remove", key }),
    updateItem: (key, patch) => dispatch({ type: "update", key, patch }),
    clear: () => dispatch({ type: "clear" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
