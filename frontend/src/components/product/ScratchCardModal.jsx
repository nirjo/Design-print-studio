import React, { useEffect, useRef, useState } from 'react';
import { X, Gift } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';

const DISCOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function ScratchCardModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const [discount, setDiscount] = useState(0);
  const { scratchDiscount, setScratchDiscount } = useProductStore();
  
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    if (isOpen && !scratchDiscount) {
      // Pick random discount
      const random = DISCOUNTS[Math.floor(Math.random() * DISCOUNTS.length)];
      setDiscount(random);
      setIsScratched(false);
      
      // Initialize canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const context = canvas.getContext('2d');
        ctx.current = context;
        
        // Fill silver overlay
        context.fillStyle = '#C0C0C0';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add texture/text
        context.fillStyle = '#999999';
        context.font = 'bold 20px Inter';
        context.textAlign = 'center';
        context.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 + 8);
      }, 100);
    } else if (isOpen && scratchDiscount) {
      setDiscount(scratchDiscount);
      setIsScratched(true);
    }
  }, [isOpen, scratchDiscount]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (isScratched) return;
    isDrawing.current = true;
    lastPoint.current = getCoordinates(e);
  };

  const draw = (e) => {
    if (!isDrawing.current || isScratched) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const currentPoint = getCoordinates(e);
    const context = ctx.current;
    
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.lineWidth = 40;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    
    lastPoint.current = currentPoint;
    checkScratched();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const checkScratched = () => {
    const canvas = canvasRef.current;
    const context = ctx.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }
    
    const totalPixels = pixels.length / 4;
    const percentScratched = (transparentPixels / totalPixels) * 100;
    
    // If 40% scratched, reveal the whole thing
    if (percentScratched > 40) {
      setIsScratched(true);
      setScratchDiscount(discount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col items-center text-center p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-cmyk-yellow/20 text-cmyk-yellow rounded-full flex items-center justify-center mb-6 mt-4">
          <Gift size={32} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Surprise Discount!</h2>
        <p className="text-sm text-gray-500 mb-8 px-4">Scratch the silver card below to reveal your exclusive discount code.</p>

        <div className="relative w-64 h-32 rounded-xl overflow-hidden shadow-inner border-2 border-dashed border-gray-300 mx-auto">
          {/* Hidden Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">You Unlocked</span>
            <span className="text-4xl font-extrabold text-cmyk-magenta">{discount}% OFF</span>
          </div>

          {/* Canvas Overlay */}
          {!isScratched && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          )}
        </div>
        
        {isScratched && (
          <div className="mt-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎉 Discount Applied!
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-black text-white py-3.5 rounded-xl font-semibold tracking-wide hover:bg-gray-800 transition-colors shadow-sm"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
