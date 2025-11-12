import React, { useState, useMemo, useCallback } from 'react';
import type { Product, CartItem, Transaction, Contact } from '../types';
import ContactSelectDialog from './ContactSelectDialog';
import Modal from './Modal';
import Receipt from './Receipt';

interface BillingScreenProps {
  products: Product[];
  onCheckout: (cart: CartItem[], discountPercent: number, discountRs: number, contactId?: string) => Promise<Transaction | null>;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ products, onCheckout }) => {
  // Local editable store name only for Billing view. Persisted in localStorage.
  const [storeName, setStoreName] = useState<string>(() => {
    try { return localStorage.getItem('storeName') || ''; } catch (e) { return ''; }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountRs, setDiscountRs] = useState<number>(0);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showContactSelect, setShowContactSelect] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) 
      && p.quantity > 0
    );
  }, [searchTerm, products]);
  
  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productSku === product.sku);
      if (existingItem) {
        return prevCart.map(item =>
          item.productSku === product.sku
            ? { ...item, quantity: Math.min(product.quantity, item.quantity + 1) }
            : item
        );
      }
      return [...prevCart, { productSku: product.sku, name: product.name, price: product.price, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productSku: string, newQuantity: number) => {
    const product = products.find(p => p.sku === productSku);
    if (!product) return;
    
    const clampedQuantity = Math.max(0, Math.min(product.quantity, newQuantity));

    setCart(prevCart => {
      if (clampedQuantity === 0) {
        return prevCart.filter(item => item.productSku !== productSku);
      }
      return prevCart.map(item =>
        item.productSku === productSku ? { ...item, quantity: clampedQuantity } : item
      );
    });
  }, [products]);
  
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  // Apply percentage first, then subtract fixed rupee discount
  const total = useMemo(() => {
    const afterPercent = subtotal * (1 - discount / 100);
    const t = Math.max(0, afterPercent - (discountRs || 0));
    return t;
  }, [subtotal, discount, discountRs]);
  
  const handleCheckout = async (addToKhata: boolean = false) => {
    if (cart.length === 0) return;
    if (addToKhata && !selectedContact) {
      setShowContactSelect(true);
      return;
    }
    const transaction = await onCheckout(cart, discount, discountRs, selectedContact?.id);
    if(transaction) {
      setLastTransaction(transaction);
      setCart([]);
      setDiscount(0);
      setDiscountRs(0);
      setSearchTerm('');
      setSelectedContact(null);
    }
  };

  const handleClearBill = () => {
    setCart([]);
    setDiscount(0);
  };

  return (
    <>
      {/* Centered editable store name only visible in Billing view */}
      <div className="max-w-4xl mx-auto py-4">
        <label className="sr-only" htmlFor="billing-store-name">Store name for Receipt</label>
        <input
          id="billing-store-name"
          value={storeName}
          onChange={(e) => {
            const v = e.target.value;
            setStoreName(v);
            try { localStorage.setItem('storeName', v); } catch (e) {}
          }}
          placeholder="Enter store name for receipt (centered)"
          className="w-full text-center text-2xl font-bold bg-transparent border-0 focus:outline-none text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-10rem)]">
        {/* Left Pane: Product Selection */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
          <h2 className="text-xl font-bold mb-4">Add Products</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <div className="mt-4 flex-grow overflow-y-auto">
            {searchTerm && (
              <div className="pr-2">
                {filteredProducts.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map(p => (
                      <li key={p.sku} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{p.sku} | Rs {p.price.toFixed(2)} | <span className="font-semibold">In Stock: {p.quantity}</span></p>
                        </div>
                        <button onClick={() => addToCart(p)} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm font-semibold">Add</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">No products found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Bill Summary */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
          <h3 className="text-xl font-bold mb-4">Bill Summary</h3>
          <div className="flex-grow overflow-y-auto -mr-6 pr-6">
              {cart.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cart.map(item => (
                    <li key={item.productSku} className="py-3">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm w-4/6">{item.name}</p>
                        <p className="text-sm font-semibold">Rs {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Qty:</span>
                        <button onClick={() => updateQuantity(item.productSku, item.quantity - 1)} className="px-2 py-0.5 border dark:border-gray-600 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-700">-</button>
                        <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.productSku, parseInt(e.target.value) || 0)} className="w-12 text-center border-t border-b dark:border-gray-600 bg-transparent"/>
                        <button onClick={() => updateQuantity(item.productSku, item.quantity + 1)} className="px-2 py-0.5 border dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700">+</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-center">Search for a product to begin.</p>
                </div>
              )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><p>Subtotal:</p><p>Rs {subtotal.toFixed(2)}</p></div>
              <div className="flex justify-between items-center space-x-2">
                <label htmlFor="discount">Discount (%):</label>
                <input 
                  id="discount"
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} 
                  className="w-16 p-1 text-right border rounded-md bg-transparent dark:border-gray-600"
                />

                <label htmlFor="discountRs" className="ml-4">Discount (Rs):</label>
                <input
                  id="discountRs"
                  type="number"
                  value={discountRs}
                  onChange={(e) => setDiscountRs(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 p-1 text-right border rounded-md bg-transparent dark:border-gray-600"
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t dark:border-gray-600 pt-2 mt-2"><p>Grand Total:</p><p>Rs {total.toFixed(2)}</p></div>
            </div>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button onClick={handleClearBill} disabled={cart.length === 0} className="w-full bg-gray-500 text-white py-3 rounded-md font-bold hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    Clear Bill
                </button>
                <button onClick={() => handleCheckout(false)} disabled={cart.length === 0} className="w-full bg-blue-500 text-white py-3 rounded-md font-bold hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    Checkout
                </button>
              </div>
              {cart.length > 0 && (
                <button 
                  onClick={() => handleCheckout(true)}
                  className="w-full bg-indigo-500 text-white py-3 rounded-md font-bold hover:bg-indigo-600"
                >
                  {selectedContact ? `Add to ${selectedContact.name}'s Khata` : 'Add to Khata'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={!!lastTransaction} onClose={() => setLastTransaction(null)} title="Transaction Receipt" size="sm">
        {lastTransaction && <Receipt transaction={lastTransaction} onClose={() => setLastTransaction(null)} storeName={storeName} />}
      </Modal>
      <ContactSelectDialog 
        isOpen={showContactSelect}
        onClose={() => setShowContactSelect(false)}
        onContactSelect={(contact) => {
          setSelectedContact(contact);
          setShowContactSelect(false);
          handleCheckout(true);
        }}
      />
    </>
  );
};

export default BillingScreen;