import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  AtSign,
  Phone,
  Mail,
  History,
  X,
  Check,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function ContactsPage() {
  const { contacts, refreshContacts, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.upiId && c.upiId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setPhone('');
    setEmail('');
    setUpiId('');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setUpiId(contact.upiId || '');
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Contact name is required');
      return;
    }

    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        setFormError('Please enter a valid phone number (8-15 digits)');
        return;
      }
    }

    if (upiId && upiId.trim()) {
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        setFormError('Please enter a valid UPI ID (e.g. name@bank)');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingContact) {
        await api.updateContact(editingContact.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          upiId: upiId.trim(),
        });
        showToast(`Contact "${name}" updated!`);
      } else {
        await api.createContact({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          upiId: upiId.trim(),
        });
        showToast(`Contact "${name}" added!`);
      }
      await refreshContacts();
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id, contactName) => {
    if (!window.confirm(`Delete ${contactName} from your contacts?`)) return;
    try {
      await api.deleteContact(id);
      await refreshContacts();
      showToast(`Contact "${contactName}" removed`);
    } catch (err) {
      showToast(err.message || 'Failed to delete contact', 'error');
    }
  };

  const handleOpenHistory = async (contact) => {
    setViewingHistory(contact);
    setHistoryData(null);
    try {
      const data = await api.getContactHistory(contact.id);
      setHistoryData(data);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#292929]">
            My Contacts
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your friends and their UPI IDs for zero-hassle bill splitting.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-6 py-3 rounded-full bg-[#FFD83D] hover:bg-[#FFC928] text-[#292929] font-bold text-sm shadow-warm-sm transition-all border border-[#FFC928] active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FF8A1E]" />
          <span>Add New Contact</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#6B7280] absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone or UPI ID..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#FFE494] text-sm text-[#292929] placeholder-[#6B7280] focus:outline-none focus:border-[#FF8A1E] shadow-warm-sm"
        />
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No contacts added yet"
          description="Add your friends with their phone numbers and UPI IDs so you can add them to restaurant bills in one click."
          actionText="Add Your First Contact"
          onAction={openAddModal}
        />
      ) : filteredContacts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#FFE494] text-sm text-[#6B7280]">
          No contacts match "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm hover:shadow-warm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF4D9] text-[#292929] font-serif font-bold text-base flex items-center justify-center uppercase border border-[#FFE494]">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#292929]">
                        {c.name}
                      </h3>
                      {c.phone && (
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#292929] hover:bg-[#FFF4D9] cursor-pointer"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(c.id, c.name)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-[#FFF0E5] cursor-pointer"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-[#6B7280] pt-2 border-t border-[#FFE494]/60">
                  {c.upiId ? (
                    <div className="flex items-center gap-1 text-[#009F93] font-mono">
                      <AtSign className="w-3.5 h-3.5" />
                      <span className="truncate">{c.upiId}</span>
                    </div>
                  ) : (
                    <span className="text-[#6B7280] italic">No UPI ID registered</span>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1 text-[#6B7280]">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View History Action */}
              <div className="mt-4 pt-3 border-t border-[#FFE494]/60">
                <button
                  type="button"
                  onClick={() => handleOpenHistory(c)}
                  className="w-full py-1.5 rounded-xl bg-[#FFFDF7] hover:bg-[#FFF4D9] text-xs font-semibold text-[#FF8A1E] transition-colors border border-[#FFE494] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Past Expenses</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFE494] rounded-3xl max-w-md w-full p-6 shadow-warm-lg space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#292929]">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#292929] hover:bg-[#FFF4D9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-[#FFF0E5] border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-1.5">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. rohan@icici"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] font-mono focus:outline-none focus:border-[#FF8A1E]"
                />
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Used for generating instant UPI QR codes and payment requests.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-1.5">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rohan@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FFF4D9] text-[#292929] text-xs font-bold border border-[#FFE494] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white text-xs font-bold shadow-teal cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Past Expenses Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFE494] rounded-3xl max-w-lg w-full p-6 shadow-warm-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#FFE494]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#292929]">
                  {viewingHistory.name}'s Expense History
                </h3>
                <span className="text-xs text-[#6B7280]">
                  Past shared bills and settlement statuses
                </span>
              </div>
              <button
                onClick={() => setViewingHistory(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#292929] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!historyData ? (
              <div className="py-8 text-center text-sm text-[#6B7280]">Loading history...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
                    Bills Involved ({historyData.bills?.length || 0})
                  </h4>
                  {historyData.bills?.length === 0 ? (
                    <p className="text-xs text-[#6B7280]">No past bills recorded with this contact.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyData.bills.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#292929] block">{b.title}</span>
                            <span className="text-[#6B7280]">{b.date}</span>
                          </div>
                          <span className="font-bold">{formatRupees(b.calculatedTotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
                    Payment Requests ({historyData.payments?.length || 0})
                  </h4>
                  {historyData.payments?.length === 0 ? (
                    <p className="text-xs text-[#6B7280]">No payments recorded with this contact.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyData.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#292929] block">
                              {p.from} &rarr; {p.to}
                            </span>
                            <span className="text-[#6B7280]">{p.billTitle}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold block">{formatRupees(p.amountRupees)}</span>
                            <span className="text-[10px] uppercase font-bold text-[#009F93]">
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
