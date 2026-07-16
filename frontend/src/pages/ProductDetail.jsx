import React, { useEffect, useState } from "react";

import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, ArrowLeft, ChevronDown, Check, Star, Eye, Share2, X } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Accordion from "@radix-ui/react-accordion";
import html2canvas from "html2canvas";
import { toast, Toaster } from "sonner";
import { useCart } from "../context/CartContext";
import { useProductStore } from "../store/useProductStore";

import DesignCanvas from "../components/product/DesignCanvas";
import ProductOptions from "../components/product/ProductOptions";
import DesignControls from "../components/product/DesignControls";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, setOpen } = useCart();
  const { 
    setProduct, product, color, size, fabric, printMethod, quantity, setQuantity, totalPrice, layers, activePrintArea
  } = useProductStore();
  
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const handlePreview = async () => {
    const canvasElement = document.getElementById('design-canvas');
    if (!canvasElement) return;
    
    setIsGeneratingPreview(true);
    try {
      // Small delay to ensure all UI is settled
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(canvasElement, {
        useCORS: true,
        scale: 2, // High res
        backgroundColor: null
      });
      setPreviewImage(canvas.toDataURL("image/png"));
    } catch (err) {
      toast.error("Failed to generate preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!previewImage) return;
    
    // Check if Web Share API is supported (mostly mobile + some desktop browsers)
    if (navigator.share) {
      try {
        const response = await fetch(previewImage);
        const blob = await response.blob();
        const file = new File([blob], 'my-custom-design.png', { type: 'image/png' });
        
        await navigator.share({
          title: 'My Custom T-Shirt Design',
          text: `Check out my custom design for ${product.name}!`,
          files: [file]
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Sharing failed or not supported on this browser.");
        }
      }
    } else {
      // Fallback: Download image and open WhatsApp Web
      const link = document.createElement('a');
      link.download = 'my-custom-design.png';
      link.href = previewImage;
      link.click();
      
      const message = encodeURIComponent(`Check out my custom design for ${product.name}! I've just saved the image.`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
      toast.success("Image downloaded. You can now send it on WhatsApp.");
    }
  };

  useEffect(() => {
    axios.get(`${API}/products/${id}`).then((r) => {
      setProduct(r.data);
      if (r.data.colors?.length > 0) setColor(r.data.colors[0].toLowerCase());
      if (r.data.sizes?.length > 0) setSize(r.data.sizes[1] || r.data.sizes[0]);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id, setProduct]);

  if (loading || !product) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
  }

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      size,
      color,
      fabric,
      print_area: activePrintArea,
      print_method: printMethod,
      quantity,
      unit_price: totalPrice / quantity,
      design_layers: layers,
    });
    toast.success(`${product.name} added to cart`, { 
      description: `${color} · ${size} · ${quantity} items` 
    });
    setOpen(true);
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 pb-24">
      <Toaster theme="light" position="top-right" />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <div className="text-sm font-semibold tracking-widest uppercase">Aiel Studio</div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
          
          {/* LEFT: VISUALS (CANVAS) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <DesignCanvas />
            
            {/* Gallery Thumbnails (Static placeholders to match layout) */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-300 text-xs uppercase tracking-widest">
                  View {i}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS & CONTROLS */}
          <div className="lg:col-span-5 mt-10 lg:mt-0">
            
            {/* Product Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span className="text-xs font-medium text-gray-500">(128 Reviews)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{product.description}</p>
              
              <div className="flex items-end gap-3">
                <span className="text-3xl font-light tracking-tight text-gray-900">₹{totalPrice}</span>
                {quantity > 1 && <span className="text-sm text-gray-500 mb-1">Total for {quantity}</span>}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
                <Check size={12} /> In Stock & Ready to Print
              </div>
            </div>

            {/* TABBED INTERFACE */}
            <Tabs.Root defaultValue="options" className="mt-10">
              <Tabs.List className="flex border-b border-gray-200 mb-6">
                <Tabs.Trigger value="options" className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-gray-500 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black hover:text-gray-800 transition-colors">
                  Product Options
                </Tabs.Trigger>
                <Tabs.Trigger value="design" className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-gray-500 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black hover:text-gray-800 transition-colors">
                  Design Studio
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="options" className="animate-fade-in outline-none">
                <ProductOptions />
              </Tabs.Content>

              <Tabs.Content value="design" className="animate-fade-in outline-none">
                <DesignControls />
              </Tabs.Content>
            </Tabs.Root>

            <hr className="my-10 border-gray-100" />

            {/* QUANTITY & ADD TO CART */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl h-14 bg-white px-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">−</button>
                <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">+</button>
              </div>
              <button 
                onClick={handlePreview}
                disabled={isGeneratingPreview}
                className="px-6 border border-gray-200 text-gray-700 rounded-xl h-14 font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Eye size={18} /> {isGeneratingPreview ? "Loading..." : "Preview"}
              </button>
              <button 
                onClick={handleAdd}
                className="flex-1 bg-black text-white rounded-xl h-14 font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
              >
                <ShoppingBag size={18} /> Add to Cart — ₹{totalPrice}
              </button>
            </div>

            {/* PRODUCT INFO ACCORDION */}
            <div className="mt-12">
              <Accordion.Root type="multiple" className="border-t border-gray-200">
                {[
                  { title: "Product Details", content: "Premium 100% combed cotton, bio-washed for an ultra-soft feel. Durable stitching and true-to-size fit." },
                  { title: "Fabric & Care", content: "Machine wash cold inside out. Do not bleach. Tumble dry low. Do not iron directly on print." },
                  { title: "Shipping & Returns", content: "Orders are printed and shipped within 3-5 business days. 14-day hassle-free return policy on defective items." }
                ].map((item, i) => (
                  <Accordion.Item key={i} value={`item-${i}`} className="border-b border-gray-200">
                    <Accordion.Header>
                      <Accordion.Trigger className="flex items-center justify-between w-full py-5 text-sm font-semibold uppercase tracking-wider text-gray-900 hover:text-gray-600 transition-colors group">
                        {item.title}
                        <ChevronDown size={16} className="text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-300" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden text-sm text-gray-600 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <div className="pb-5 leading-relaxed">{item.content}</div>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </div>

          </div>
        </div>
      </main>

      {/* PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewImage(null)} />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg tracking-tight">Design Preview</h3>
              <button onClick={() => setPreviewImage(null)} className="p-2 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-auto bg-gray-50 flex justify-center">
              <img src={previewImage} alt="Design Preview" className="max-h-[60vh] object-contain rounded-xl shadow-sm border border-gray-200" />
            </div>
            
            <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleShareWhatsApp}
                className="flex-1 bg-[#25D366] text-white py-3.5 rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors shadow-sm"
              >
                <Share2 size={18} /> Share on WhatsApp
              </button>
              <button 
                onClick={() => setPreviewImage(null)}
                className="flex-1 sm:flex-none sm:px-8 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold tracking-wide hover:bg-gray-50 transition-colors"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
