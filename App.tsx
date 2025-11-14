
import React, { useState, useCallback, useEffect } from 'react';
import type { View, Product, Transaction, Theme, CartItem, TransactionItem, Contact } from './types';
import Header from './components/Header';
import DashboardScreen, { AnalyticsScreen } from './components/DashboardScreen';
import BillingScreen from './components/BillingScreen';
import ProductsScreen from './components/InventoryScreen';
import KhataScreen from './components/KhataScreen';
import TransactionScreen from './components/TransactionScreen';
import AiAssistant from './components/AiAssistant';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import AuthScreen from './components/AuthScreen';

const SupabaseSetupInstructions = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Needed</h1>
      <p className="mb-4">
        Your Supabase connection details are missing. To use the application, you need to add your Supabase URL and Anon Key to the project.
      </p>
      <p className="mb-6">
        Please open the file <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono text-sm">supabaseClient.ts</code> and replace the placeholder values with your actual project credentials.
      </p>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
        <pre className="text-sm whitespace-pre-wrap">
          <code>
            {`// supabaseClient.ts

// ❗️ PASTE YOUR SUPABASE DETAILS HERE ❗️
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';`}
          </code>
        </pre>
      </div>
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        You can find these details in your Supabase project settings under the "API" section. The application will start working automatically once you save the changes to the file.
      </p>
    </div>
  </div>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [productCostMap, setProductCostMap] = useState<Record<string, number>>({});
  const [supportsExpiry, setSupportsExpiry] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [productPage, setProductPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCTS_PER_PAGE = 50;
  const [dashboardMetrics, setDashboardMetrics] = useState({
    lowStockCount: 0,
    nearExpiryCount: 0,
  });
  
  // If supabase is not configured, show instructions.
  if (!supabase) {
    return <SupabaseSetupInstructions />;
  }

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const fetchDashboardMetrics = async () => {
    if (!session) return;

    const { data: lowStockCount, error: lowStockError } = await supabase
      .rpc('get_low_stock_count');

    if (lowStockError) console.error('Error fetching low stock count:', lowStockError);

    const { data: nearExpiryCount, error: nearExpiryError } = await supabase
      .rpc('get_near_expiry_count');
      
    if (nearExpiryError) console.error('Error fetching near expiry count:', nearExpiryError);

    setDashboardMetrics({
      lowStockCount: lowStockCount || 0,
      nearExpiryCount: nearExpiryCount || 0,
    });
  };

  const fetchData = async (page: number = 1) => {
      if(!session) return;
      
      const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE - 1;
      
      const { data: productsData, error: productsError, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(startIndex, endIndex)
        .order('name', { ascending: true });
      
      if(productsError) console.error("Error fetching products:", productsError);
      else {
        try {
          // Determine whether the products table returns an expiry column
          const supports = Array.isArray(productsData) && productsData.length > 0 && (('expiry_date' in productsData[0]) || ('expiryDate' in productsData[0]));
          setSupportsExpiry(Boolean(supports));

          // Merge any locally stored expiry dates when the DB doesn't have the column
          const localExpiryMap = JSON.parse(localStorage.getItem('expiry_dates') || '{}');

          const mapped = productsData.map((p: any) => ({
            ...p,
            costPrice: p.cost_price,
            lowStockThreshold: p.low_stock_threshold,
            expiryDate: p.expiry_date || p.expiryDate || localExpiryMap[p.sku] || null
          }));

          setProducts(mapped);
          setTotalProducts(count || 0);
        } catch (e) {
          console.error('Error processing productsData', e);
          setProducts(productsData.map((p: any) => ({...p, costPrice: p.cost_price, lowStockThreshold: p.low_stock_threshold})));
          setTotalProducts(count || 0);
        }
      }
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`*, transaction_items(*)`)
        .order('timestamp', { ascending: false });
        
      if(transactionsError) console.error("Error fetching transactions:", transactionsError);
      else {
        const formattedTransactions = transactionsData.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
          discountPercent: t.discount_percent,
          items: t.transaction_items.map((ti: any) => ({
            productSku: ti.product_sku,
            name: ti.name,
            quantitySold: ti.quantity_sold,
            pricePerItem: ti.price_per_item,
          }))
        }));
        setTransactions(formattedTransactions);
      }

      // Also fetch a lightweight map of sku -> cost_price for ALL products so dashboard metrics (COGS/profit) are accurate
      const { data: allProductsCostData, error: allProductsCostError } = await supabase
        .from('products')
        .select('sku, cost_price');

      if (allProductsCostError) {
        console.error('Error fetching product cost map:', allProductsCostError);
      } else if (Array.isArray(allProductsCostData)) {
        const map: Record<string, number> = {};
        allProductsCostData.forEach((p: any) => {
          map[p.sku] = Number(p.cost_price || 0);
        });
        setProductCostMap(map);
      }

      // Fetch contacts (customers and suppliers)
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if(contactsError) console.error("Error fetching contacts:", contactsError);
      else setContacts(contactsData || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    if(session) {
      fetchData(productPage);
      fetchDashboardMetrics();
    }
  }, [session, productPage]);


  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const handleCheckout = async (cart: CartItem[], discountPercent: number, discountRs: number = 0, contactId?: string): Promise<Transaction | null> => {
    if (!session) return null;

    for (const item of cart) {
        const product = products.find(p => p.sku === item.productSku);
        if(!product || product.quantity < item.quantity) {
            alert(`Not enough stock for ${item.name}.`);
            return null;
        }
    }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const afterPercent = subtotal * (1 - discountPercent / 100);
  const total = Math.max(0, afterPercent - (discountRs || 0));

    // Start a transaction in the database
    const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({ 
            user_id: session.user.id, 
            subtotal,
            total,
            discount_percent: discountPercent,
            contact_id: contactId || null,
        })
        .select()
        .single();
        
    if (contactId) {
      // If this is a Khata transaction, create a ledger entry
      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert({
          contact_id: contactId,
          amount: total,
          entry_type: 'credit_given',
          description: `Sale of ${cart.length} item(s)`
        });

      if (ledgerError) {
        console.error("Error creating ledger entry:", ledgerError);
        alert("Transaction completed but failed to add to Khata. Please add manually.");
      }
    }
    
    if (transactionError || !transactionData) {
        console.error("Error creating transaction", transactionError?.message);
        alert(`Failed to process transaction: ${transactionError?.message}`);
        return null;
    }

    const transactionItems: TransactionItem[] = cart.map(item => ({
        productSku: item.productSku,
        name: item.name,
        quantitySold: item.quantity,
        pricePerItem: item.price,
    }));
    
    const { error: itemsError } = await supabase.from('transaction_items').insert(
      cart.map(item => ({
        transaction_id: transactionData.id,
        product_sku: item.productSku,
        name: item.name,
        quantity_sold: item.quantity,
        price_per_item: item.price,
      }))
    );
    if(itemsError) {
        console.error("Error creating transaction items", itemsError.message);
        alert(`Transaction was created, but failed to add items: ${itemsError.message}`);
    }

    for (const item of cart) {
        const product = products.find(p => p.sku === item.productSku)!;
        const newQuantity = product.quantity - item.quantity;
        const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .match({ sku: item.productSku, user_id: session.user.id });
        if (updateError) {
            console.error(`Failed to update stock for ${item.productSku}:`, updateError.message);
            alert(`Transaction complete, but failed to update stock for ${item.name}. Please manually adjust it.`);
        }
    }

    await fetchData(productPage);
    await fetchDashboardMetrics();

    const newTransaction: Transaction = {
      id: transactionData.id,
      user_id: session.user.id,
      timestamp: new Date(transactionData.timestamp),
      items: transactionItems,
      subtotal,
      discountPercent,
      discountRs,
      total,
    };
    
    return newTransaction;
  };
  
  const handleProductUpdate = async (updatedProduct: Product) => {
    if(!session) return;
  const toUpdate: any = {
    name: updatedProduct.name,
    cost_price: updatedProduct.costPrice,
    price: updatedProduct.price,
    quantity: updatedProduct.quantity,
    low_stock_threshold: updatedProduct.lowStockThreshold
  };

  if (supportsExpiry) {
    toUpdate.expiry_date = updatedProduct.expiryDate || null;
  }

  const { error } = await supabase.from('products').update(toUpdate).match({ sku: updatedProduct.sku, user_id: session.user.id });

    if(error) {
        console.error("Error updating product:", error.message);
        alert(`Failed to update product: ${error.message}`);
    }
    else {
        await fetchData(productPage);
        await fetchDashboardMetrics();
    }

    // If DB does not support expiry column, persist it locally so it survives reloads on this browser
    if (!supportsExpiry) {
      try {
        const map = JSON.parse(localStorage.getItem('expiry_dates') || '{}');
        if (updatedProduct.expiryDate) map[updatedProduct.sku] = updatedProduct.expiryDate;
        else delete map[updatedProduct.sku];
        localStorage.setItem('expiry_dates', JSON.stringify(map));
        setProducts(prev => prev.map(p => p.sku === updatedProduct.sku ? {...updatedProduct} : p));
      } catch (e) {
        console.error('Failed to persist expiry locally', e);
      }
    }
  };
  
  const handleProductAdd = async (newProduct: Product) => {
    if(!session) return;
    
    const insertObj: any = {
      sku: newProduct.sku,
      user_id: session.user.id,
      name: newProduct.name,
      cost_price: newProduct.costPrice,
      price: newProduct.price,
      quantity: newProduct.quantity,
      low_stock_threshold: newProduct.lowStockThreshold,
    };
    if (supportsExpiry) insertObj.expiry_date = newProduct.expiryDate || null;

    const { error } = await supabase.from('products').insert(insertObj);

    if(error) {
        console.error("Error adding product:", error.message);
        if(error.code === '23505') {
          alert('A product with this SKU already exists.');
        } else {
          alert(`Failed to add product: ${error.message}`);
        }
    } else {
        await fetchData(productPage);
        await fetchDashboardMetrics();
    }

    // If DB doesn't support expiry, save it in localStorage as a fallback
    if (!supportsExpiry && newProduct.expiryDate) {
      try {
        const map = JSON.parse(localStorage.getItem('expiry_dates') || '{}');
        map[newProduct.sku] = newProduct.expiryDate;
        localStorage.setItem('expiry_dates', JSON.stringify(map));
      } catch (e) {
        console.error('Failed to persist expiry locally', e);
      }
    }
  };
  
  const handleProductDelete = async (sku: string) => {
    if(!session || !confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from('products').delete().match({ sku: sku, user_id: session.user.id });

    if(error) {
        console.error("Error deleting product:", error.message);
        alert(`Failed to delete product: ${error.message}`);
    }
    else {
        await fetchData(productPage);
        await fetchDashboardMetrics();
    }
    // Clean local expiry cache when product deleted
    try {
       const map = JSON.parse(localStorage.getItem('expiry_dates') || '{}');
      if (map[sku]) {
        delete map[sku];
        localStorage.setItem('expiry_dates', JSON.stringify(map));
      }
    } catch (e) {
      // ignore
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProducts([]);
    setTransactions([]);
    setContacts([]);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!session) return;

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .delete()
      .match({ transaction_id: transactionId });

    if (itemsError) {
      console.error('Error deleting transaction items:', itemsError.message);
      alert('Failed to delete transaction items');
      return;
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .match({ id: transactionId, user_id: session.user.id });

    if (transactionError) {
      console.error('Error deleting transaction:', transactionError.message);
      alert('Failed to delete transaction');
    } else {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      alert('Transaction deleted successfully');
      await fetchDashboardMetrics();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <DashboardScreen 
                 products={products}
                 totalProducts={totalProducts}
                   lowStockCount={dashboardMetrics.lowStockCount}
                   nearExpiryCount={dashboardMetrics.nearExpiryCount}
                   transactions={transactions}
                   allProductCosts={productCostMap}
               />;
      case 'Billing':
        return <BillingScreen products={products} onCheckout={handleCheckout} />;
      case 'Products':
        return <ProductsScreen 
                  products={products} 
                  onAdd={handleProductAdd} 
                  onUpdate={handleProductUpdate} 
                  onDelete={handleProductDelete}
                  currentPage={productPage}
                  onPageChange={setProductPage}
                  totalProducts={totalProducts}
                  itemsPerPage={PRODUCTS_PER_PAGE}
                />;
      case 'Analytics':
        // FIX: Added the missing 'products' prop to the AnalyticsScreen component.
        return <AnalyticsScreen transactions={transactions} products={products} />;
      case 'Khata':
        return <KhataScreen />;
      case 'Transactions':
        return <TransactionScreen 
                 transactions={transactions}
                 contacts={contacts}
                 onDelete={handleDeleteTransaction}
               />;
      default:
        return <div className="p-8 text-center"><h1 className="text-2xl font-bold">Welcome to {currentView}</h1></div>;
    }
  };

  if(isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <h1 className="text-2xl font-bold animate-pulse">Loading Stock Desk...</h1>
        </div>
    );
  }

  if(!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <Header
        onViewChange={handleViewChange}
        currentView={currentView}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSignOut={handleSignOut}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
      <AiAssistant products={products} transactions={transactions} contacts={contacts} />
    </div>
  );
};

export default App;
