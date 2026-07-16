import React, { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useProductStore } from '../../store/useProductStore';
import whiteShirt from '../../assets/shirts/white.png';
import blackShirt from '../../assets/shirts/black.png';
import royalblueShirt from '../../assets/shirts/royalblue.png';
import redShirt from '../../assets/shirts/red.png';
import yellowShirt from '../../assets/shirts/yellow.png';

const COLOR_MAP = {
  black: { src: blackShirt },
  white: { src: whiteShirt },
  royalblue: { src: royalblueShirt },
  red: { src: redShirt },
  yellow: { src: yellowShirt },
  navy: { src: blackShirt }, // Fallback
  'bottle green': { src: blackShirt },
  maroon: { src: redShirt },
  gray: { src: whiteShirt },
  olive: { src: blackShirt },
  orange: { src: yellowShirt },
  'sky blue': { src: royalblueShirt },
};

export default function DesignCanvas() {
  const { color, activePrintArea, layers, activeLayerId, setActiveLayer, updateLayer, removeLayer } = useProductStore();
  const colorKey = color?.toLowerCase() || 'white';
  const containerRef = useRef(null);

  // The print boundary (chest area for front, etc)
  const getPrintBoundary = () => {
    switch(activePrintArea) {
      case 'Front Center':
      case 'Back Center':
        return { top: '25%', left: '30%', width: '40%', height: '50%' };
      case 'Left Chest':
        return { top: '28%', left: '55%', width: '15%', height: '15%' };
      case 'Right Chest':
        return { top: '28%', left: '30%', width: '15%', height: '15%' };
      case 'Left Sleeve':
      case 'Right Sleeve':
        return { top: '35%', left: '75%', width: '15%', height: '15%' };
      default:
        return { top: '25%', left: '30%', width: '40%', height: '50%' };
    }
  };

  const boundary = getPrintBoundary();

  return (
    <div id="design-canvas" className="relative w-full aspect-[4/5] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center">
      
      {/* Product Images (Preloaded & Faded) */}
      {Object.entries(COLOR_MAP).map(([key, info]) => {
        // Only render the ones we actually have distinct sources for to avoid duplicating the fallback ones in DOM unnecessarily
        if (!['black','white','royalblue','red','yellow'].includes(key)) return null;
        
        // Check if current color maps to this source (e.g. navy -> black)
        const isMappedActive = (COLOR_MAP[colorKey]?.src || whiteShirt) === info.src;
        
        return (
          <img
            key={key}
            src={info.src}
            alt="T-Shirt"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-in-out pointer-events-none"
            style={{
              opacity: isMappedActive ? 1 : 0,
              zIndex: isMappedActive ? 10 : 0,
            }}
            onError={(e) => {
              if (e.target.src !== whiteShirt) {
                console.warn(`Missing image for color variant: ${key}. Falling back to default white T-shirt.`);
                e.target.src = whiteShirt;
              }
            }}
          />
        );
      })}

      {/* Print Boundary Indicator */}
      <div 
        ref={containerRef}
        className="absolute z-20 border-2 border-dashed border-gray-300/40 rounded-lg pointer-events-none transition-all duration-300"
        style={{
          top: boundary.top,
          left: boundary.left,
          width: boundary.width,
          height: boundary.height,
        }}
      >
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur text-[9px] uppercase tracking-wider px-2 py-1 rounded text-gray-500 font-medium">
          {activePrintArea} Boundary
        </span>
      </div>

      {/* Design Layers */}
      <div 
        className="absolute z-30" 
        style={{
          top: boundary.top,
          left: boundary.left,
          width: boundary.width,
          height: boundary.height,
        }}
      >
        {layers.filter(l => l.printArea === activePrintArea).map((layer) => (
          <Rnd
            key={layer.id}
            bounds="parent"
            size={{ width: layer.width, height: layer.height }}
            position={{ x: layer.x, y: layer.y }}
            onDragStop={(e, d) => {
              updateLayer(layer.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateLayer(layer.id, {
                width: ref.style.width,
                height: ref.style.height,
                ...position,
              });
            }}
            onClick={() => setActiveLayer(layer.id)}
            className={`group ${activeLayerId === layer.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'} transition-all`}
            style={{
              transform: `rotate(${layer.rotation || 0}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeLayerId === layer.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-50 hover:bg-red-600"
              >
                ✕
              </button>
            )}

            {layer.type === 'image' ? (
              <img src={layer.src} alt="Design" className="w-full h-full object-contain pointer-events-none" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  fontFamily: layer.fontFamily || 'Inter',
                  fontSize: layer.fontSize || 24,
                  color: layer.color || '#000',
                  fontWeight: layer.bold ? 'bold' : 'normal',
                  fontStyle: layer.italic ? 'italic' : 'normal',
                  letterSpacing: `${layer.letterSpacing || 0}px`,
                  textAlign: layer.align || 'center',
                  textTransform: layer.uppercase ? 'uppercase' : layer.lowercase ? 'lowercase' : 'none',
                }}
              >
                {layer.text}
              </div>
            )}
          </Rnd>
        ))}
      </div>
    </div>
  );
}
