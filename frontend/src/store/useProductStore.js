import { create } from 'zustand';

// Calculate price based on logic
const calculatePrice = (state) => {
  let basePrice = 499; // Default 180 GSM
  if (state.fabric === '220 GSM') basePrice += 100;
  if (state.fabric === '240 GSM') basePrice += 150;
  if (state.fabric === 'Dry Fit') basePrice += 50;

  // Add cost for prints
  const printCost = state.layers.length * 50; 
  
  return (basePrice + printCost) * state.quantity;
};

export const useProductStore = create((set, get) => ({
  // Product Data
  product: null,
  setProduct: (product) => set({ product }),

  // Options
  color: 'white',
  setColor: (color) => set({ color }),
  size: 'M',
  setSize: (size) => set({ size }),
  fabric: '180 GSM',
  setFabric: (fabric) => set({ fabric, totalPrice: calculatePrice({ ...get(), fabric }) }),
  printMethod: 'DTF',
  setPrintMethod: (printMethod) => set({ printMethod }),
  quantity: 1,
  setQuantity: (quantity) => set({ quantity, totalPrice: calculatePrice({ ...get(), quantity }) }),

  // Design State
  activePrintArea: 'Front', // Front, Back, Left Chest, Right Chest, etc.
  setActivePrintArea: (area) => set({ activePrintArea: area }),
  
  // Canvas Layers (Images, Text)
  layers: [],
  activeLayerId: null,

  addLayer: (layer) => set((state) => {
    const newLayers = [...state.layers, { ...layer, id: Date.now().toString(), zIndex: state.layers.length }];
    return { layers: newLayers, activeLayerId: layer.id, totalPrice: calculatePrice({ ...state, layers: newLayers }) };
  }),
  
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
  })),

  removeLayer: (id) => set((state) => {
    const newLayers = state.layers.filter(l => l.id !== id);
    return { layers: newLayers, activeLayerId: null, totalPrice: calculatePrice({ ...state, layers: newLayers }) };
  }),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  
  resetDesign: () => set((state) => ({ 
    layers: [], 
    activeLayerId: null,
    totalPrice: calculatePrice({ ...state, layers: [] }) 
  })),

  // Calculated Price
  totalPrice: 499,
}));
