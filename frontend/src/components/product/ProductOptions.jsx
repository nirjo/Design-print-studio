import React from 'react';
import { useProductStore } from '../../store/useProductStore';

const COLORS = [
  { id: 'white', hex: '#FFFFFF', name: 'White' },
  { id: 'black', hex: '#111111', name: 'Black' },
  { id: 'red', hex: '#C62828', name: 'Red' },
  { id: 'royalblue', hex: '#2962FF', name: 'Royal Blue' },
  { id: 'yellow', hex: '#FBC02D', name: 'Yellow' },
  { id: 'navy', hex: '#000080', name: 'Navy' },
  { id: 'bottle green', hex: '#006A4E', name: 'Bottle Green' },
  { id: 'maroon', hex: '#800000', name: 'Maroon' },
  { id: 'gray', hex: '#808080', name: 'Gray' },
  { id: 'olive', hex: '#808000', name: 'Olive' },
  { id: 'orange', hex: '#FFA500', name: 'Orange' },
  { id: 'sky blue', hex: '#87CEEB', name: 'Sky Blue' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const FABRICS = ['100% Cotton', '180 GSM', '220 GSM', '240 GSM', 'Dry Fit', 'Poly Cotton', 'French Terry'];
const PRINT_METHODS = ['DTF', 'DTG', 'Screen Printing', 'Vinyl', 'Embroidery'];

export default function ProductOptions() {
  const { color, setColor, size, setSize, fabric, setFabric, printMethod, setPrintMethod } = useProductStore();

  return (
    <div className="space-y-10 py-6">
      
      {/* COLORS */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">T-Shirt Color</h3>
          <span className="text-xs text-gray-500 capitalize">{color}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setColor(c.id)}
              className={`w-10 h-10 rounded-full transition-all duration-200 relative group
                ${color === c.id ? 'ring-2 ring-offset-2 ring-black scale-110 shadow-lg' : 'ring-1 ring-gray-200 hover:ring-gray-400 hover:scale-105'}`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            >
              {color === c.id && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke={['white','yellow','sky blue'].includes(c.id) ? '#111' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SIZES */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">Size</h3>
          <button className="text-xs text-blue-600 hover:underline">Size Guide</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-12 h-12 flex items-center justify-center rounded-xl border text-sm transition-all
                ${size === s ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* FABRIC */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">Fabric Quality</h3>
        <div className="flex flex-wrap gap-2">
          {FABRICS.map((f) => (
            <button
              key={f}
              onClick={() => setFabric(f)}
              className={`px-4 py-2.5 rounded-xl border text-sm transition-all
                ${fabric === f ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* PRINT METHOD */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">Print Method</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRINT_METHODS.map((pm) => (
            <button
              key={pm}
              onClick={() => setPrintMethod(pm)}
              className={`px-3 py-3 rounded-xl border text-sm text-center transition-all flex flex-col items-center gap-1
                ${printMethod === pm ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
            >
              <span className="font-medium">{pm}</span>
              {pm === 'DTF' && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Recommended</span>}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
