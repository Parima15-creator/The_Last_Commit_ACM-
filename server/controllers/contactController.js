import { store } from '../db/store.js';

export function getAllContacts(req, res) {
  try {
    const contacts = store.getContacts();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function createContact(req, res) {
  try {
    const { name, phone = '', email = '', upiId = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    const cleanName = name.trim();
    const existing = store.getContacts().find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({ error: `A contact named "${cleanName}" already exists.` });
    }

    // Validate phone number if provided (numeric, 10-15 chars)
    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return res.status(400).json({ error: 'Please enter a valid phone number (8-15 digits).' });
      }
    }

    // Validate UPI ID if provided (contains @ and alphanumeric)
    if (upiId && upiId.trim()) {
      const cleanUpi = upiId.trim();
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(cleanUpi)) {
        return res.status(400).json({ error: 'Please enter a valid UPI ID (e.g. name@bank).' });
      }
    }

    const newContact = store.addContact({
      name: cleanName,
      phone: phone.trim(),
      email: email.trim(),
      upiId: upiId.trim(),
    });

    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateContact(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, email, upiId } = req.body;

    const existing = store.getContactById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (name && name.trim()) {
      const duplicate = store.getContacts().find(
        (c) => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({ error: `A contact named "${name.trim()}" already exists.` });
      }
    }

    if (upiId && upiId.trim()) {
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        return res.status(400).json({ error: 'Please enter a valid UPI ID format (e.g. name@bank).' });
      }
    }

    const updated = store.updateContact(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(upiId !== undefined ? { upiId: upiId.trim() } : {}),
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const deleted = store.deleteContact(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Returns previous bills and payments associated with this contact
 */
export function getContactHistory(req, res) {
  try {
    const { id } = req.params;
    const contact = store.getContactById(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const name = contact.name.toLowerCase();
    const bills = store.getBills().filter((b) =>
      (b.participants || []).some((p) => p.toLowerCase() === name) ||
      (b.paidBy && b.paidBy.toLowerCase() === name)
    );

    const payments = store.getPayments().filter(
      (p) => p.from.toLowerCase() === name || p.to.toLowerCase() === name
    );

    res.json({
      contact,
      bills,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
