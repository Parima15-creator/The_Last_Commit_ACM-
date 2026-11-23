import { store } from '../db/store.js';

export function getSettings(req, res) {
  try {
    const user = store.getUser();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateSettings(req, res) {
  try {
    const { name, upiId, phone, email, currency } = req.body;

    const updated = store.updateUser({
      ...(name ? { name: name.trim() } : {}),
      ...(upiId !== undefined ? { upiId: upiId.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(currency ? { currency: currency.trim() } : {}),
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
