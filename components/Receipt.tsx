import React, { useRef } from 'react';
import type { Transaction } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  onClose: () => void;
  storeName?: string;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction, onClose, storeName }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Calculate the effective discount percentage from both percent and rupee discounts
  const calculateEffectivePercentage = () => {
    const percentDiscount = transaction.discountPercent || 0;
    const rupeeDiscount = transaction.discountRs || 0;
    
    if (transaction.subtotal === 0) return percentDiscount;
    
    // Calculate percentage equivalent of rupee discount
    const rupeePercentage = (rupeeDiscount / transaction.subtotal) * 100;
    
    // Return total effective percentage
    return percentDiscount + rupeePercentage;
  };

  const effectiveDiscountPercent = calculateEffectivePercentage();

  const handlePrint = () => {
    try {
      // Use iframe to print with full styling preserved
      if (!rootRef.current) return;

      // Get the HTML from the receipt
      const receiptHTML = rootRef.current.innerHTML;

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Write HTML to iframe with inline styles for print (optimized for thermal receipt printer - full width)
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"><\/script>
            <style>
              /* Standard print margins for receipts */
              @page {
                size: 80mm auto;
                margin: 5mm;
                padding: 0;
              }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                width: 100% !important;
                background: white;
                color: black;
              }
              * { 
                color: black !important; 
                background: transparent !important;
              }
              .no-print { display: none !important; }
              div[id="receipt-modal"] {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 4mm !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              table {
                width: 100% !important;
              }
            </style>
          </head>
          <body>
            ${receiptHTML}
          </body>
          </html>
        `);
        doc.close();

        // Wait for content and Tailwind to render, then print
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remove iframe after print dialog closes
          setTimeout(() => {
            iframe.remove();
          }, 500);
        }, 800);
      }
    } catch (e) {
      // Fallback
      window.print();
    }
  };

  return (
  <div ref={rootRef} id="receipt-modal" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-black dark:text-gray-200 w-full">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">{storeName || 'Stock Desk'}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Transaction Receipt</p>
      </div>
      <div className="text-sm space-y-2 text-black dark:text-gray-300">
        <p><strong className="text-white">Transaction ID:</strong> #{String(transaction.id).slice(-6)}</p>
        <p><strong className="text-white">Date:</strong> {transaction.timestamp.toLocaleString()}</p>
      </div>
      <div className="border-t border-b border-dashed my-3 py-3 border-gray-400 dark:border-gray-600">
        <table className="w-full text-sm text-black dark:text-gray-300">
          <thead>
            <tr>
              <th className="text-left font-semibold text-white">Item</th>
              <th className="text-center font-semibold text-white">Qty</th>
              <th className="text-right font-semibold text-white">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map(item => (
              <tr key={item.productSku}>
                <td className="text-left text-black dark:text-gray-300">{item.name}</td>
                <td className="text-center text-black dark:text-gray-300">{item.quantitySold}</td>
                <td className="text-right text-black dark:text-gray-300">Rs {(item.pricePerItem * item.quantitySold).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm space-y-1 text-black dark:text-gray-300">
        <div className="flex justify-between">
          <span className="text-white">Subtotal:</span>
          <span className="text-gray">Rs {transaction.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white">Discount (%):</span>
          <span className="text-gray">{effectiveDiscountPercent.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white">Discount (Rs):</span>
          <span className="text-gray">Rs {(transaction.discountRs || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base">
          <span className="text-gray">Total:</span>
          <span className="text-gray">Rs {transaction.total.toFixed(2)}</span>
        </div>
      </div>
      {/* Developer contact shown on receipt */}
      <div className="mt-6 text-center text-sm text-gray-700 dark:text-gray-400">
        <div className="font-semibold">:Contact Developer:</div>
        <div className="mt-1">contactstockdesk@gmail.com</div>
      </div>
      <div className="mt-6 flex space-x-2 no-print">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="w-full px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default Receipt;