import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { supabase } from '../supabaseClient';

interface ContactSelectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onContactSelect: (contact: Contact) => void;
}

const ContactSelectDialog: React.FC<ContactSelectDialogProps> = ({ isOpen, onClose, onContactSelect }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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

        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Select Contact</h2>
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded mb-4 dark:bg-gray-700"
                />
                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading contacts...</div>
                    ) : filteredContacts.length > 0 ? (
                        <div className="divide-y">
                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => onContactSelect(contact)}
                                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium">{contact.name}</p>
                                        <p className="text-sm text-gray-500">{contact.phone_number || 'No phone number'}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${
                                        contact.current_balance > 0
                                            ? 'text-red-600'
                                            : contact.current_balance < 0
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                    }`}>
                                        {contact.current_balance !== 0 && 
                                            `Rs ${Math.abs(contact.current_balance).toFixed(2)} ${
                                                contact.current_balance > 0 ? '(Due)' : '(Advance)'
                                            }`
                                        }
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500">No contacts found</div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactSelectDialog;