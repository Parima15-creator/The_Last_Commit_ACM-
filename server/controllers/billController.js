import { store } from '../db/store.js';
import {
  checkBillMath,
  calculateEqualSplit,
  calculateItemSplit,
  generateUpiUri,
  fromPaise,
} from '../utils/financialMath.js';

export function getAllBills(req, res) {
  try {
    const bills = store.getBills();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getBillById(req, res) {
  try {
    const { id } = req.params;
    const bill = store.getBillById(id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    const payments = store.getPaymentsByBill(id);
    const math = checkBillMath(bill);

    res.json({
      ...bill,
      mathCheck: math,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function createBill(req, res) {
  try {
    const billData = req.body;
    if (!billData.title || !billData.title.trim()) {
      return res.status(400).json({ error: 'Bill or Restaurant name is required' });
    }

    const math = checkBillMath(billData);
    const newBill = store.addBill({
      ...billData,
      calculatedTotal: math.calculatedTotal,
      printedTotal: billData.printedTotal !== undefined ? parseFloat(billData.printedTotal) : math.calculatedTotal,
    });

    res.status(201).json(newBill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateBill(req, res) {
  try {
    const { id } = req.params;
    const existing = store.getBillById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const math = checkBillMath({ ...existing, ...req.body });
    const updated = store.updateBill(id, {
      ...req.body,
      calculatedTotal: math.calculatedTotal,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function deleteBill(req, res) {
  try {
    const { id } = req.params;
    const deleted = store.deleteBill(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Calculates and persists bill split (Mode 1: Equal, Mode 2: Item-based)
 * Generates payment requests for participants
 */
export function splitBill(req, res) {
  try {
    const { id } = req.params;
    const { splitMode = 'equal', participants, items } = req.body;

    const bill = store.getBillById(id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const activeParticipants = Array.isArray(participants) && participants.length > 0
      ? participants
      : bill.participants || [store.getUser().name];

    const currentItems = Array.isArray(items) ? items : bill.items || [];
    const billToSplit = {
      ...bill,
      items: currentItems,
    };

    let splitResult;
    if (splitMode === 'equal') {
      splitResult = calculateEqualSplit(billToSplit, activeParticipants);
    } else {
      splitResult = calculateItemSplit(billToSplit, activeParticipants);
    }

    const payer = bill.paidBy || store.getUser().name;
    const user = store.getUser();
    const contacts = store.getContacts();

    // Look up payer's UPI ID
    let payerUpi = user.upiId || 'user@upi';
    const payerContact = contacts.find((c) => c.name.toLowerCase() === payer.toLowerCase());
    if (payerContact && payerContact.upiId) {
      payerUpi = payerContact.upiId;
    }

    // Generate payment instructions for participants who owe the payer
    const paymentRequests = [];
    Object.keys(splitResult.shares).forEach((person) => {
      if (person !== payer) {
        const share = splitResult.shares[person];
        if (share.totalPaise > 0) {
          const upiUri = generateUpiUri(
            payerUpi,
            payer,
            share.totalRupees,
            `${bill.title} share from ${person}`
          );

          paymentRequests.push({
            from: person,
            to: payer,
            amountRupees: share.totalRupees,
            amountPaise: share.totalPaise,
            billTitle: bill.title,
            upiUri,
            status: 'pending',
          });
        }
      }
    });

    // Save payment requests in store
    const savedPayments = store.setPaymentsForBill(bill.id, paymentRequests);

    // Update bill with split information
    const updatedBill = store.updateBill(bill.id, {
      splitMode,
      participants: activeParticipants,
      items: currentItems,
      shares: splitResult.shares,
      status: paymentRequests.length === 0 ? 'settled' : 'pending',
    });

    res.json({
      bill: updatedBill,
      splitResult,
      payments: savedPayments,
    });
  } catch (err) {
    console.error('Split Bill Error:', err);
    res.status(500).json({ error: err.message });
  }
}
