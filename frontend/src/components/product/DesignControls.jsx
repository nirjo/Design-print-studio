import React, { useState } from 'react';
import { Upload, Type, Image as ImageIcon, RotateCw, Trash2 } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { toast } from 'sonner';

const PRINT_AREAS = [
  'Front Center', 'Back Center', 'Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve'
];

const FONTS = ['Inter', 'Anton', 'Bricolage Grotesque', 'Italianno', 'Arial', 'Times New Roman'];

export default function DesignControls() {
  const { 
    activePrintArea, setActivePrintArea, 
    addLayer, updateLayer, removeLayer, 
    activeLayerId, layers 
  } = useProductStore();

  const [textInput, setTextInput] = useState('');

  const activeLayer = layers.find(l => l.id === activeLayerId);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large (25MB max)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      addLayer({
        type: 'image',
        src: event.target.result,
        x: 50, y: 50,
        width: 150, height: 150,
        rotation: 0,
        printArea: activePrintArea
      });
      toast.success('Image added to design');
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    addLayer({
      type: 'text',
      text: textInput,
      x: 50, y: 50,
      width: 200, height: 60,
      rotation: 0,
      printArea: activePrintArea,
      fontFamily: 'Inter',
      fontSize: 32,
      color: '#111111',
      bold: false,
      italic: false,
      letterSpacing: 0,
      align: 'center',
      uppercase: false
    });
    setTextInput('');
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* PRINT AREA SELECTOR */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">Select Print Area</h3>
        <select 
          value={activePrintArea} 
          onChange={(e) => setActivePrintArea(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {PRINT_AREAS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">Design elements are grouped by print area.</p>
      </div>

      <hr className="border-gray-100" />

      {/* ADD ELEMENTS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upload Button */}
        <div>
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer h-24">
            <Upload size={20} className="text-gray-500 mb-2" />
            <span className="text-xs font-medium text-gray-700">Upload Image</span>
            <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        
        {/* Add Text */}
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="Enter custom text..." 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleAddText}
            className="w-full py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Type size={16} /> Add Text
          </button>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* ACTIVE LAYER CONTROLS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">
          Layer Controls {activeLayer ? <span className="text-blue-600 lowercase font-normal">(Editing)</span> : ''}
        </h3>
        
        {!activeLayer ? (
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center text-sm text-gray-500">
            Click on an element in the preview to edit it.
          </div>
        ) : (
          <div className="space-y-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            
            {/* Common Controls */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-1"><RotateCw size={14} /> Rotation</span>
                <span>{activeLayer.rotation || 0}°</span>
              </label>
              <input 
                type="range" min="-180" max="180" 
                value={activeLayer.rotation || 0} 
                onChange={(e) => updateLayer(activeLayer.id, { rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text specific controls */}
            {activeLayer.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Text Content</label>
                  <input 
                    type="text" 
                    value={activeLayer.text} 
                    onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Font</label>
                    <select 
                      value={activeLayer.fontFamily} 
                      onChange={(e) => updateLayer(activeLayer.id, { fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
                    <input 
                      type="color" 
                      value={activeLayer.color} 
                      onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })}
                      className="w-full h-[38px] p-1 border border-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => updateLayer(activeLayer.id, { bold: !activeLayer.bold })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-bold ${activeLayer.bold ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    B
                  </button>
                  <button 
                    onClick={() => updateLayer(activeLayer.id, { italic: !activeLayer.italic })}
                    className={`flex-1 py-2 rounded-lg border text-sm italic ${activeLayer.italic ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    I
                  </button>
                  <button 
                    onClick={() => updateLayer(activeLayer.id, { uppercase: !activeLayer.uppercase })}
                    className={`flex-1 py-2 rounded-lg border text-sm ${activeLayer.uppercase ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    TT
                  </button>
                </div>
              </>
            )}

            <button 
              onClick={() => removeLayer(activeLayer.id)}
              className="w-full py-2.5 mt-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete Element
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
