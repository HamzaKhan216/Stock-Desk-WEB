import React, { useState, useMemo } from 'react';
import type { Transaction, Contact } from '../types';
import { TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Modal from './Modal';
import Receipt from './Receipt';

interface TransactionScreenProps {
  transactions: Transaction[];
  contacts: Contact[];
  onDelete: (transactionId: number) => void;
}

const TRANSACTIONS_PER_PAGE = 20;

const TransactionScreen: React.FC<TransactionScreenProps> = ({ transactions, contacts, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'khata' | 'direct'>('all');

  // Filter transactions based on search and type
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Filter by type
    if (filterType === 'khata') {
      result = result.filter(t => t.contact_id);
    } else if (filterType === 'direct') {
      result = result.filter(t => !t.contact_id);
    }

    // Filter by search term (search in transaction ID, date, or contact name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => {
        const transId = String(t.id).toLowerCase();
        const date = new Date(t.timestamp).toLocaleDateString().toLowerCase();
        const contact = contacts.find(c => c.id === t.contact_id);
        const contactName = contact ? contact.name.toLowerCase() : '';
        return transId.includes(term) || date.includes(term) || contactName.includes(term);
      });
    }

    return result;
  }, [transactions, searchTerm, filterType, contacts]);

  // Paginate results
  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleDelete = async (transactionId: number) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      onDelete(transactionId);
      setCurrentPage(1);
    }
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const getContactName = (contactId?: string): string => {
    if (!contactId) return 'Direct Sale';
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Unknown Contact';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total: {filteredTransactions.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by ID, date, or contact name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilterType('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => {
              setFilterType('khata');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === 'khata'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Khata Only
          </button>
          <button
            onClick={() => {
              setFilterType('direct');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === 'direct'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Direct Sales Only
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
        {paginatedTransactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount (Rs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                    #{String(transaction.id).slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(transaction.timestamp).toLocaleDateString()} {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.contact_id
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {getContactName(transaction.contact_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {transaction.items.reduce((sum, item) => sum + item.quantitySold, 0)} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    Rs {transaction.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewReceipt(transaction)}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id!)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete transaction"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No transactions found</p>
            {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Transaction Receipt" size="sm">
        {selectedTransaction && <Receipt transaction={selectedTransaction} onClose={() => setShowReceiptModal(false)} />}
      </Modal>
    </div>
  );
};

export default TransactionScreen;
