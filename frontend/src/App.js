import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";
import CartDrawer from "./components/CartDrawer";
import { CartProvider } from "./context/CartContext";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Gallery from "./pages/Gallery";
import Catalogue from "./pages/Catalogue";
import Contact from "./pages/Contact";

function App() {
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <CartDrawer />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppFab />
        </BrowserRouter>
      </CartProvider>
    </div>
  );
}

export default App;
