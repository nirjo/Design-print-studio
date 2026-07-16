import { create } from 'zustand';

// Calculate price based on logic
const calculatePricing = (state) => {
  let basePrice = 499; // Default 180 GSM
  if (state.fabric === '220 GSM') basePrice += 100;
  if (state.fabric === '240 GSM') basePrice += 150;
  if (state.fabric === 'Dry Fit') basePrice += 50;

  // Add cost for prints
  const printCost = state.layers.length * 50; 
  
  const unitPrice = basePrice + printCost;
  const originalTotalPrice = unitPrice * state.quantity;

  // Scratch Discount
  const scratchAmount = (originalTotalPrice * (state.scratchDiscount / 100));
  
  // Bulk Discount
  let bulkPercent = 0;
  if (state.quantity >= 5 && state.quantity <= 9) bulkPercent = 5;
  else if (state.quantity >= 10 && state.quantity <= 24) bulkPercent = 10;
  else if (state.quantity >= 25 && state.quantity <= 49) bulkPercent = 15;
  else if (state.quantity >= 50 && state.quantity <= 99) bulkPercent = 20;
  else if (state.quantity >= 100) bulkPercent = 25;

  const bulkAmount = ((originalTotalPrice - scratchAmount) * (bulkPercent / 100));

  const totalSavings = scratchAmount + bulkAmount;
  const finalPrice = originalTotalPrice - totalSavings;

  return {
    originalTotalPrice,
    scratchAmount,
    bulkAmount,
    bulkPercent,
    totalSavings,
    finalPrice
  };
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
  setFabric: (fabric) => {
    const next = { ...get(), fabric };
    set({ fabric, pricing: calculatePricing(next) });
  },
  printMethod: 'DTF',
  setPrintMethod: (printMethod) => set({ printMethod }),
  quantity: 1,
  setQuantity: (quantity) => {
    const next = { ...get(), quantity };
    set({ quantity, pricing: calculatePricing(next) });
  },

  // Discounts
  scratchDiscount: 0,
  setScratchDiscount: (percent) => {
    const next = { ...get(), scratchDiscount: percent };
    set({ scratchDiscount: percent, pricing: calculatePricing(next) });
  },

  // 3D Flip State
  isFlipped: false,
  setIsFlipped: (isFlipped) => set({ isFlipped }),

  // Design State
  activePrintArea: 'Front Center', // Front Center, Back Center, etc.
  setActivePrintArea: (area) => set({ activePrintArea: area }),
  
  // Canvas Layers (Images, Text)
  layers: [],
  activeLayerId: null,

  addLayer: (layer) => set((state) => {
    const newLayers = [...state.layers, { ...layer, id: Date.now().toString(), zIndex: state.layers.length }];
    const next = { ...state, layers: newLayers };
    return { layers: newLayers, activeLayerId: layer.id, pricing: calculatePricing(next) };
  }),
  
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
  })),

  removeLayer: (id) => set((state) => {
    const newLayers = state.layers.filter(l => l.id !== id);
    const next = { ...state, layers: newLayers };
    return { layers: newLayers, activeLayerId: null, pricing: calculatePricing(next) };
  }),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  
  resetDesign: () => set((state) => {
    const next = { ...state, layers: [] };
    return { 
      layers: [], 
      activeLayerId: null,
      pricing: calculatePricing(next) 
    };
  }),

  // Calculated Pricing
  pricing: {
    originalTotalPrice: 499,
    scratchAmount: 0,
    bulkAmount: 0,
    bulkPercent: 0,
    totalSavings: 0,
    finalPrice: 499
  }
}));
