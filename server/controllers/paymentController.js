import { store } from '../db/store.js';

export function getAllPayments(req, res) {
  try {
    const { status, billId } = req.query;
    let payments = store.getPayments();

    if (status) {
      payments = payments.filter((p) => p.status === status);
    }
    if (billId) {
      payments = payments.filter((p) => p.billId === billId);
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'marked_paid', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = store.updatePaymentStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    // Check if all payments for this bill are completed or marked_paid
    const billPayments = store.getPaymentsByBill(updated.billId);
    const allSettled = billPayments.every((p) => p.status === 'completed' || p.status === 'marked_paid');
    if (allSettled && billPayments.length > 0) {
      store.updateBill(updated.billId, { status: 'settled' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Prepares shareable messages for WhatsApp, SMS, and Email
 */
export function getSharePayload(req, res) {
  try {
    const { id } = req.params;
    const payment = store.getPayments().find((p) => p.id === id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    const bill = store.getBillById(payment.billId);
    const billName = bill?.title || payment.billTitle || 'our dinner';
    const amountStr = `₹${payment.amountRupees.toFixed(2)}`;

    // Personalized WhatsApp text
    const whatsappText = `Hi ${payment.from}! Your share for ${billName} is ${amountStr}. Please settle the amount using this payment link:\n${payment.upiUri}\n\nThank you! (No Jhol via JholFree)`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

    // SMS text
    const smsText = `Hi ${payment.from}! Your share for ${billName} is ${amountStr}. Settle via UPI: ${payment.upiUri}`;

    // Email content
    const emailSubject = `Payment request for ${billName}: ${amountStr}`;
    const emailBody = `Hi ${payment.from},\n\nHope you had a great time! Your share for ${billName} is ${amountStr}.\n\nYou can pay directly via this UPI link:\n${payment.upiUri}\n\nBest regards,\n${payment.to}`;

    res.json({
      payment,
      whatsapp: {
        message: whatsappText,
        shareUrl: whatsappUrl,
      },
      sms: {
        message: smsText,
        supported: false, // Informs user that direct SMS gateway is not configured
        note: 'Direct SMS gateway not configured. You can copy the message or use WhatsApp.',
      },
      email: {
        subject: emailSubject,
        body: emailBody,
        supported: false, // Informs user that SMTP email gateway is not configured
        note: 'Email provider not configured. You can copy the message or use WhatsApp.',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
