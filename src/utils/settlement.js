import { toPaise, fromPaise, generateUpiLink } from './splitMath.js';

/**
 * Optimized Settlement Engine using greedy min-transaction debt resolution.
 * Supports multiple payers, calculates net balances, guarantees net balance sum = 0.
 *
 * @param {Object} peopleShares - Result from calculateSplit: { [person]: { totalPaise, totalRupees, ... } }
 * @param {Object} paymentsMade - Record of who paid what amount in Rupees: { [person]: amountRupees }
 * @param {Object} upiDirectory - Record of UPI IDs: { [person]: upiId }
 */
export function calculateSettlement(peopleShares, paymentsMade = {}, upiDirectory = {}) {
  const people = Object.keys(peopleShares);
  if (people.length === 0) return { balances: {}, transactions: [], isBalanced: true };

  // 1. Calculate net balance for each person in integer paise
  // positive = is owed money (creditor)
  // negative = owes money (debtor)
  const balances = {};
  let totalBalanceSumPaise = 0;

  people.forEach((person) => {
    const owedPaise = peopleShares[person]?.totalPaise || 0;
    const paidRupees = paymentsMade[person] || 0;
    const paidPaise = toPaise(paidRupees);

    const netPaise = paidPaise - owedPaise;
    balances[person] = {
      name: person,
      owedPaise,
      owedRupees: fromPaise(owedPaise),
      paidPaise,
      paidRupees: fromPaise(paidPaise),
      netPaise,
      netRupees: fromPaise(netPaise),
      status: netPaise > 0 ? 'creditor' : netPaise < 0 ? 'debtor' : 'settled',
    };

    totalBalanceSumPaise += netPaise;
  });

  // Check zero-sum balance
  const isBalanced = Math.abs(totalBalanceSumPaise) === 0;

  // 2. Separate into debtors and creditors
  // Debtor list: positive debt amount in paise
  const debtors = [];
  const creditors = [];

  people.forEach((person) => {
    const net = balances[person].netPaise;
    if (net < 0) {
      debtors.push({ person, amountPaise: -net });
    } else if (net > 0) {
      creditors.push({ person, amountPaise: net });
    }
  });

  // 3. Greedy debt simplification algorithm (minimize transaction count)
  // Sort descending by amount
  debtors.sort((a, b) => b.amountPaise - a.amountPaise);
  creditors.sort((a, b) => b.amountPaise - a.amountPaise);

  const transactions = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settlePaise = Math.min(debtor.amountPaise, creditor.amountPaise);
    if (settlePaise > 0) {
      const amountRupees = fromPaise(settlePaise);
      const creditorUpi = upiDirectory[creditor.person] || `${creditor.person.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;
      const upiLink = generateUpiLink(creditorUpi, creditor.person, amountRupees, `JholFree Settlement from ${debtor.person}`);

      transactions.push({
        id: `tx_${debtor.person}_to_${creditor.person}_${dIdx}_${cIdx}`,
        from: debtor.person,
        to: creditor.person,
        amountPaise: settlePaise,
        amountRupees,
        creditorUpi,
        upiLink,
        isPaid: false,
      });

      debtor.amountPaise -= settlePaise;
      creditor.amountPaise -= settlePaise;
    }

    if (debtor.amountPaise === 0) dIdx++;
    if (creditor.amountPaise === 0) cIdx++;
  }

  return {
    balances,
    transactions,
    totalBalanceSumPaise,
    isBalanced,
  };
}

/**
 * WhatsApp Reminder message generators in 3 tones: Polite, Friendly, Roast
 */
export function generateWhatsAppReminder(transaction, tone = 'friendly', restaurantName = 'dinner') {
  const { from, to, amountRupees, upiLink } = transaction;
  const name = restaurantName || 'dinner';

  let text = '';
  switch (tone) {
    case 'polite':
      text = `Hey ${from}! Your share for ${name} comes to ₹${amountRupees.toFixed(2)}. Whenever convenient, you can settle it using this UPI link:\n${upiLink}\n\nThanks!`;
      break;
    case 'roast':
      text = `Oye ${from}! That food didn't eat itself 😂 Your share is ₹${amountRupees.toFixed(2)}. Settle up before interest starts kicking in!\nUPI: ${upiLink}\n\nNo jhol! 🚀`;
      break;
    case 'friendly':
    default:
      text = `Heyyy ${from}! Your share for ${name} is ₹${amountRupees.toFixed(2)}. Send it over when you get a chance 😄\nUPI link: ${upiLink}`;
      break;
  }

  const encodedUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return {
    tone,
    message: text,
    whatsappUrl: encodedUrl,
  };
}
