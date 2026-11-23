import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = config.dbPath || path.resolve(__dirname, '../data/jholfree.json');

// Ensure parent data directory exists
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const defaultData = {
  user: {
    id: 'user_default',
    name: config.upiDefaultName || 'Me',
    upiId: config.upiDefaultId || 'you.jholfree@okaxis',
    phone: '',
    email: '',
    currency: '₹',
  },
  contacts: [],
  bills: [],
  payments: [],
};

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          user: { ...defaultData.user, ...(parsed.user || {}) },
          contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
          bills: Array.isArray(parsed.bills) ? parsed.bills : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        };
      }
    } catch (err) {
      console.error('Failed to read database file, initializing default store:', err.message);
    }
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  }

  save(dataToSave = this.data) {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Database write error:', err.message);
    }
  }

  // --- User / Settings ---
  getUser() {
    return this.data.user;
  }

  updateUser(updates) {
    this.data.user = { ...this.data.user, ...updates };
    this.save();
    return this.data.user;
  }

  // --- Contacts ---
  getContacts() {
    return this.data.contacts;
  }

  getContactById(id) {
    return this.data.contacts.find((c) => c.id === id);
  }

  addContact(contact) {
    const newContact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: contact.name.trim(),
      phone: (contact.phone || '').trim(),
      email: (contact.email || '').trim(),
      upiId: (contact.upiId || '').trim(),
      createdAt: new Date().toISOString(),
    };
    this.data.contacts.push(newContact);
    this.save();
    return newContact;
  }

  updateContact(id, updates) {
    const idx = this.data.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.contacts[idx] = {
      ...this.data.contacts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.contacts[idx];
  }

  deleteContact(id) {
    const idx = this.data.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.contacts.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Bills ---
  getBills() {
    return this.data.bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getBillById(id) {
    return this.data.bills.find((b) => b.id === id);
  }

  addBill(bill) {
    const newBill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: bill.title || 'Restaurant Bill',
      date: bill.date || new Date().toISOString().split('T')[0],
      currency: bill.currency || '₹',
      paidBy: bill.paidBy || this.data.user.name,
      splitMode: bill.splitMode || 'equal', // 'equal' | 'item'
      items: (bill.items || []).map((it, idx) => ({
        id: it.id || `item_${idx + 1}_${Date.now()}`,
        name: it.name || `Dish ${idx + 1}`,
        qty: parseInt(it.qty, 10) || 1,
        price: parseFloat(it.price) || 0,
        assignedTo: Array.isArray(it.assignedTo) ? it.assignedTo : [],
      })),
      cgst: parseFloat(bill.cgst) || 0,
      sgst: parseFloat(bill.sgst) || 0,
      serviceCharge: parseFloat(bill.serviceCharge) || 0,
      discount: parseFloat(bill.discount) || 0,
      roundOff: parseFloat(bill.roundOff) || 0,
      printedTotal: parseFloat(bill.printedTotal) || 0,
      calculatedTotal: parseFloat(bill.calculatedTotal) || 0,
      participants: Array.isArray(bill.participants) && bill.participants.length > 0
        ? bill.participants
        : [this.data.user.name],
      shares: bill.shares || {},
      status: bill.status || 'pending', // 'pending' | 'settled'
      notes: bill.notes || '',
      receiptImage: bill.receiptImage || null,
      createdAt: new Date().toISOString(),
    };

    this.data.bills.push(newBill);
    this.save();
    return newBill;
  }

  updateBill(id, updates) {
    const idx = this.data.bills.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.data.bills[idx] = {
      ...this.data.bills[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.bills[idx];
  }

  deleteBill(id) {
    const idx = this.data.bills.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.data.bills.splice(idx, 1);
    // Also remove associated payment requests
    this.data.payments = this.data.payments.filter((p) => p.billId !== id);
    this.save();
    return true;
  }

  // --- Payments ---
  getPayments() {
    return this.data.payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPaymentsByBill(billId) {
    return this.data.payments.filter((p) => p.billId === billId);
  }

  setPaymentsForBill(billId, paymentsList) {
    // Remove existing payments for this bill
    this.data.payments = this.data.payments.filter((p) => p.billId !== billId);
    // Add new ones
    paymentsList.forEach((p) => {
      this.data.payments.push({
        id: p.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        billId,
        billTitle: p.billTitle || 'Bill',
        from: p.from,
        to: p.to,
        amountRupees: p.amountRupees,
        amountPaise: p.amountPaise,
        upiUri: p.upiUri || '',
        status: p.status || 'pending', // 'pending' | 'marked_paid' | 'completed'
        createdAt: new Date().toISOString(),
      });
    });
    this.save();
    return this.getPaymentsByBill(billId);
  }

  updatePaymentStatus(id, status) {
    const payment = this.data.payments.find((p) => p.id === id);
    if (!payment) return null;
    payment.status = status;
    payment.updatedAt = new Date().toISOString();
    this.save();
    return payment;
  }
}

export const store = new Store();
