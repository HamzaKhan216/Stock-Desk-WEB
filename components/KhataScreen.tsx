import React, { useState, useEffect } from 'react';
import { Contact, LedgerEntry, ContactType, EntryType } from '../types';
import { supabase } from '../supabaseClient';
import { AlertTriangleIcon, PackageIcon } from './Icons';

// Transaction Dialog Component
interface TransactionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact;
    onTransactionComplete: () => void;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({ isOpen, onClose, contact, onTransactionComplete }) => {
    const [amount, setAmount] = useState('');
    const [entryType, setEntryType] = useState<EntryType>('payment_received');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('ledger_entries')
                .insert({
                    contact_id: contact.id,
                    amount: parseFloat(amount),
                    entry_type: entryType,
                    description: description || null
                });

            if (error) throw error;
            onTransactionComplete();
            onClose();
            setAmount('');
            setDescription('');
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">New Transaction for {contact?.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount (Rs)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={entryType}
                            onChange={(e) => setEntryType(e.target.value as EntryType)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        >
                            <option value="payment_received">Payment Received (Jama)</option>
                            <option value="credit_given">Credit Given (Udhaar)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Contact Form Dialog Component
interface ContactFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onContactAdded: () => void;
}

const ContactFormDialog: React.FC<ContactFormDialogProps> = ({ isOpen, onClose, onContactAdded }) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [contactType, setContactType] = useState<ContactType>('customer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('contacts')
                .insert({
                    user_id: user.id,
                    name,
                    phone_number: phoneNumber || null,
                    contact_type: contactType
                });

            if (error) throw error;
            onContactAdded();
            onClose();
            setName('');
            setPhoneNumber('');
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Failed to add contact. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Contact</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={contactType}
                            onChange={(e) => setContactType(e.target.value as ContactType)}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        >
                            <option value="customer">Customer</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Transaction History Component
interface TransactionHistoryProps {
    contact: Contact;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ contact }) => {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error } = await supabase
                .from('ledger_entries')
                .select('*')
                .eq('contact_id', contact.id)
                .order('transaction_date', { ascending: false });

            if (error) {
                console.error('Error fetching entries:', error);
                return;
            }

            setEntries(data || []);
            setLoading(false);
        };

        fetchEntries();
    }, [contact.id]);

    if (loading) {
        return <div className="text-center py-4">Loading transactions...</div>;
    }

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {new Date(entry.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        entry.entry_type === 'payment_received' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                        {entry.entry_type === 'payment_received' ? 'Jama' : 'Udhaar'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                    <span className={entry.entry_type === 'payment_received' ? 'text-green-600' : 'text-red-600'}>
                                        Rs {entry.amount.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                    {entry.description || '-'}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No transactions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Main Khata Screen Component
const KhataScreen: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [showContactForm, setShowContactForm] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [filter, setFilter] = useState<ContactType | 'all'>('all');

    const fetchContacts = async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching contacts:', error);
            return;
        }

        setContacts(data || []);
        setLoading(false);
    };

    useEffect(() => {
        // Log current user ID
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user ID:', user?.id);
        };
        getCurrentUser();
        fetchContacts();
    }, []);

    const filteredContacts = contacts.filter(contact => 
        filter === 'all' || contact.contact_type === filter
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Khata Management</h1>
                <button
                    onClick={() => setShowContactForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add New Contact
                </button>
            </div>

            <div className="flex space-x-4 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded ${
                        filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('customer')}
                    className={`px-4 py-2 rounded ${
                        filter === 'customer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Customers
                </button>
                <button
                    onClick={() => setFilter('supplier')}
                    className={`px-4 py-2 rounded ${
                        filter === 'supplier'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Suppliers
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading contacts...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredContacts.map(contact => (
                        <div
                            key={contact.id}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{contact.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {contact.phone_number || 'No phone number'}
                                    </p>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {contact.contact_type === 'customer' ? 'Customer' : 'Supplier'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                                    <p className={`text-lg font-bold ${
                                        contact.current_balance > 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : contact.current_balance < 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        Rs {Math.abs(contact.current_balance).toFixed(2)}
                                        {contact.current_balance !== 0 && (
                                            <span className="text-xs ml-1">
                                                {contact.current_balance > 0 ? '(Due)' : '(Advance)'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedContact(contact);
                                        setShowTransactionForm(true);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Add Transaction
                                </button>
                                <button
                                    onClick={() => setSelectedContact(contact)}
                                    className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    View History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedContact && !showTransactionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                                <p className="text-sm text-gray-500">{selectedContact.phone_number || 'No phone number'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <TransactionHistory contact={selectedContact} />
                    </div>
                </div>
            )}

            <ContactFormDialog
                isOpen={showContactForm}
                onClose={() => setShowContactForm(false)}
                onContactAdded={() => {
                    fetchContacts();
                    setShowContactForm(false);
                }}
            />

            <TransactionDialog
                isOpen={showTransactionForm}
                onClose={() => {
                    setShowTransactionForm(false);
                    setSelectedContact(null);
                }}
                contact={selectedContact || undefined}
                onTransactionComplete={() => {
                    fetchContacts();
                    setShowTransactionForm(false);
                    setSelectedContact(null);
                }}
            />
        </div>
    );
};

export default KhataScreen;