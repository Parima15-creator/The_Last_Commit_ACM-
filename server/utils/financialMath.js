/**
 * Deterministic Financial Arithmetic Engine for JholFree (Server & Client)
 * All calculations use integer paise to eliminate floating-point rounding errors.
 * Uses Largest Remainder Method (Hamilton-Hare algorithm) for zero-drift distribution.
 */

export function toPaise(amount) {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function fromPaise(paise) {
  const p = typeof paise === 'number' ? paise : parseInt(paise, 10) || 0;
  return Number((p / 100).toFixed(2));
}

/**
 * Largest Remainder Method (Hare-Niemeyer / Hamilton algorithm)
 * Guarantees sum of distributed amounts equals EXACTLY `totalPaise`.
 */
export function distributePaise(totalPaise, weights) {
  if (!weights || weights.length === 0) return [];
  if (weights.length === 1) return [totalPaise];
  if (totalPaise === 0) return weights.map(() => 0);

  const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (totalWeight <= 0) {
    const baseShare = Math.floor(totalPaise / weights.length);
    const remainder = totalPaise - baseShare * weights.length;
    return weights.map((_, i) => baseShare + (i < remainder ? 1 : 0));
  }

  const allocations = [];
  let allocatedSum = 0;

  for (let i = 0; i < weights.length; i++) {
    const w = Math.max(0, weights[i]);
    const exact = (totalPaise * w) / totalWeight;
    const floor = Math.floor(exact);
    const remainder = exact - floor;
    allocations.push({
      index: i,
      floor,
      remainder,
      weight: w,
    });
    allocatedSum += floor;
  }

  const missingPaise = totalPaise - allocatedSum;

  allocations.sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 1e-9) {
      return b.remainder - a.remainder;
    }
    if (b.weight !== a.weight) {
      return b.weight - a.weight;
    }
    return a.index - b.index;
  });

  for (let i = 0; i < missingPaise && i < allocations.length; i++) {
    allocations[i].floor += 1;
  }

  allocations.sort((a, b) => a.index - b.index);

  return allocations.map((a) => a.floor);
}

/**
 * Validates the arithmetic of a bill.
 */
export function checkBillMath(bill) {
  if (!bill) {
    return {
      itemsTotal: 0,
      extrasTotal: 0,
      calculatedTotal: 0,
      printedTotal: 0,
      diffRupees: 0,
      diffPaise: 0,
      isMatch: false,
    };
  }

  const itemsTotalPaise = (bill.items || []).reduce((sum, item) => {
    // Treat item.price as the total line price for that item
    const pricePaise = toPaise(item.price);
    return sum + pricePaise;
  }, 0);

  const cgstPaise = toPaise(bill.cgst || 0);
  const sgstPaise = toPaise(bill.sgst || 0);
  const serviceChargePaise = toPaise(bill.serviceCharge || 0);
  const discountPaise = toPaise(bill.discount || 0);
  const roundOffPaise = toPaise(bill.roundOff || 0);

  const extrasTotalPaise = cgstPaise + sgstPaise + serviceChargePaise - discountPaise + roundOffPaise;
  const calculatedTotalPaise = itemsTotalPaise + extrasTotalPaise;
  const printedTotalPaise = toPaise(bill.printedTotal !== undefined ? bill.printedTotal : calculatedTotalPaise / 100);

  const diffPaise = calculatedTotalPaise - printedTotalPaise;
  const isMatch = Math.abs(diffPaise) <= 1; // 1 paisa tolerance

  return {
    itemsTotal: fromPaise(itemsTotalPaise),
    extrasTotal: fromPaise(extrasTotalPaise),
    calculatedTotal: fromPaise(calculatedTotalPaise),
    printedTotal: fromPaise(printedTotalPaise),
    itemsTotalPaise,
    extrasTotalPaise,
    calculatedTotalPaise,
    printedTotalPaise,
    diffRupees: fromPaise(diffPaise),
    diffPaise,
    isMatch,
  };
}

/**
 * Mode 1: Equal Split calculation with integer-paise precision
 */
export function calculateEqualSplit(bill, participants = []) {
  if (!participants || participants.length === 0) {
    return {
      shares: {},
      totalPaise: 0,
      totalRupees: 0,
      perPersonRupees: 0,
      isReconciled: true,
    };
  }

  const math = checkBillMath(bill);
  const totalPaise = math.calculatedTotalPaise;

  const weights = participants.map(() => 1);
  const allocatedShares = distributePaise(totalPaise, weights);

  const shares = {};
  participants.forEach((p, idx) => {
    const paise = allocatedShares[idx];
    shares[p] = {
      participant: p,
      totalPaise: paise,
      totalRupees: fromPaise(paise),
      assignedItems: [],
      foodSubtotalRupees: fromPaise(paise),
      taxShareRupees: 0,
      serviceChargeShareRupees: 0,
      discountShareRupees: 0,
    };
  });

  const sumPaise = Object.values(shares).reduce((sum, s) => sum + s.totalPaise, 0);

  return {
    shares,
    totalPaise,
    totalRupees: fromPaise(totalPaise),
    perPersonRupees: fromPaise(allocatedShares[0] || 0),
    isReconciled: sumPaise === totalPaise,
  };
}

/**
 * Mode 2: Item-Based Split calculation with proportional tax/discount distribution
 */
export function calculateItemSplit(bill, participants = []) {
  if (!participants || participants.length === 0) {
    return {
      shares: {},
      reconciliation: {
        totalPaise: 0,
        sumOfSharesPaise: 0,
        isReconciled: true,
      },
      unassignedItems: [],
    };
  }

  const items = bill.items || [];
  const math = checkBillMath(bill);

  const shares = {};
  participants.forEach((p) => {
    shares[p] = {
      participant: p,
      assignedItems: [],
      foodPaise: 0,
      foodSubtotalRupees: 0,
      taxPaise: 0,
      taxShareRupees: 0,
      serviceChargePaise: 0,
      serviceChargeShareRupees: 0,
      discountPaise: 0,
      discountShareRupees: 0,
      roundOffPaise: 0,
      extraPaise: 0,
      totalPaise: 0,
      totalRupees: 0,
    };
  });

  const unassignedItems = [];
  let totalAssignedFoodPaise = 0;

  // 1. Distribute each item among its assigned participants
  items.forEach((item) => {
    // Treat item.price as the total line price for that item
    const itemTotalPaise = toPaise(item.price);

    const assigned = (item.assignedTo || []).filter((p) => participants.includes(p));

    if (assigned.length === 0) {
      unassignedItems.push({
        ...item,
        itemTotalPaise,
      });
      return;
    }

    const itemWeights = assigned.map(() => 1);
    const itemShares = distributePaise(itemTotalPaise, itemWeights);

    assigned.forEach((p, idx) => {
      const sharePaise = itemShares[idx];
      shares[p].foodPaise += sharePaise;
      shares[p].assignedItems.push({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        fullPrice: fromPaise(itemTotalPaise),
        shareRupees: fromPaise(sharePaise),
        sharersCount: assigned.length,
      });
    });

    totalAssignedFoodPaise += itemTotalPaise;
  });

  // 2. Distribute extras (taxes, service charge, discounts, roundoff) proportionally based on food subtotal
  const cgstPaise = toPaise(bill.cgst || 0);
  const sgstPaise = toPaise(bill.sgst || 0);
  const totalTaxPaise = cgstPaise + sgstPaise;
  const serviceChargePaise = toPaise(bill.serviceCharge || 0);
  const discountPaise = toPaise(bill.discount || 0);
  const roundOffPaise = toPaise(bill.roundOff || 0);

  const foodWeights = participants.map((p) => shares[p].foodPaise);
  const sumFood = foodWeights.reduce((a, b) => a + b, 0);

  // If nobody ate anything, split extras equally
  const finalWeights = sumFood > 0 ? foodWeights : participants.map(() => 1);

  const taxShares = distributePaise(totalTaxPaise, finalWeights);
  const serviceShares = distributePaise(serviceChargePaise, finalWeights);
  const discountShares = distributePaise(discountPaise, finalWeights);
  const roundOffShares = distributePaise(roundOffPaise, finalWeights);

  participants.forEach((p, idx) => {
    const taxP = taxShares[idx];
    const serviceP = serviceShares[idx];
    const discP = discountShares[idx];
    const roP = roundOffShares[idx];

    shares[p].taxPaise = taxP;
    shares[p].taxShareRupees = fromPaise(taxP);

    shares[p].serviceChargePaise = serviceP;
    shares[p].serviceChargeShareRupees = fromPaise(serviceP);

    shares[p].discountPaise = discP;
    shares[p].discountShareRupees = fromPaise(discP);

    shares[p].roundOffPaise = roP;

    shares[p].extraPaise = taxP + serviceP - discP + roP;
    shares[p].totalPaise = shares[p].foodPaise + shares[p].extraPaise;

    shares[p].foodSubtotalRupees = fromPaise(shares[p].foodPaise);
    shares[p].totalRupees = fromPaise(shares[p].totalPaise);
  });

  const sumOfSharesPaise = participants.reduce((sum, p) => sum + shares[p].totalPaise, 0);
  const netExtrasPaise = totalTaxPaise + serviceChargePaise - discountPaise + roundOffPaise;
  const targetPaise = totalAssignedFoodPaise + netExtrasPaise;
  const isReconciled = sumOfSharesPaise === targetPaise;

  return {
    shares,
    reconciliation: {
      totalAssignedFoodPaise,
      netExtrasPaise,
      sumOfSharesPaise,
      sumOfSharesRupees: fromPaise(sumOfSharesPaise),
      calculatedTotalPaise: math.calculatedTotalPaise,
      isReconciled,
      hasUnassignedItems: unassignedItems.length > 0,
    },
    unassignedItems,
  };
}

/**
 * Standard UPI payment URI generator
 */
export function generateUpiUri(upiId, payeeName, amountRupees, note = 'JholFree Bill Split') {
  const pa = encodeURIComponent((upiId || 'user@upi').trim());
  const pn = encodeURIComponent((payeeName || 'User').trim());
  const am = parseFloat(amountRupees || 0).toFixed(2);
  const tn = encodeURIComponent((note || 'Bill Split').trim());
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}
