import { store } from '../db/store.js';

export function getDashboardStats(req, res) {
  try {
    const user = store.getUser();
    const bills = store.getBills();
    const payments = store.getPayments();

    const userName = (user.name || 'Me').toLowerCase();

    // Total expenses recorded from all bills
    const totalExpenses = bills.reduce((sum, b) => sum + (parseFloat(b.calculatedTotal) || 0), 0);

    // Amount others owe the user (pending payments where to === user)
    const amountOthersOweUser = payments
      .filter((p) => p.to.toLowerCase() === userName && p.status === 'pending')
      .reduce((sum, p) => sum + (parseFloat(p.amountRupees) || 0), 0);

    // Amount the user owes others (pending payments where from === user)
    const amountUserOwesOthers = payments
      .filter((p) => p.from.toLowerCase() === userName && p.status === 'pending')
      .reduce((sum, p) => sum + (parseFloat(p.amountRupees) || 0), 0);

    // Recent bills (last 5)
    const recentBills = bills.slice(0, 5);

    // Recent payment requests (last 5)
    const recentPayments = payments.slice(0, 5);

    res.json({
      totalExpenses: Number(totalExpenses.toFixed(2)),
      billsCount: bills.length,
      amountOthersOweUser: Number(amountOthersOweUser.toFixed(2)),
      amountUserOwesOthers: Number(amountUserOwesOthers.toFixed(2)),
      recentBills,
      recentPayments,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
