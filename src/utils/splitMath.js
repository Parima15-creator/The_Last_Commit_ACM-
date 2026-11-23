/**
 * Financial Reconciliation Engine for JholFree
 * All calculations use integer paise to eliminate floating point rounding errors.
 * Uses Largest Remainder Method (Hamilton-Hare) for zero-drift distribution.
 */

/**
 * Converts a rupee amount (number or string) to integer paise.
 */
export function toPaise(amount) {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise back to a rupee float (2 decimals).
 */
export function fromPaise(paise) {
  const p = typeof paise === 'number' ? paise : parseInt(paise, 10) || 0;
  return Number((p / 100).toFixed(2));
}

/**
 * Validates the arithmetic of a bill.
 * itemsTotal = sum of item prices
 * extrasTotal = CGST + SGST + serviceCharge - discount + roundOff
 * calculatedTotal = itemsTotal + extrasTotal
 * Compares against printedTotal with a 1-paisa tolerance.
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
    return sum + toPaise(item.price);
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
 * Largest Remainder Method (Hare-Niemeyer / Hamilton algorithm)
 * Distributes `totalPaise` integer units proportionally among recipients according to `weights`.
 * Guarantees that the sum of distributed amounts equals EXACTLY `totalPaise`.
 * No paisa is lost, duplicated or drifted.
 *
 * @param {number} totalPaise - Integer total amount in paise to distribute
 * @param {number[]} weights - Non-negative weights for each recipient
 * @returns {number[]} Array of integer paise allocated to each recipient
 */
export function distributePaise(totalPaise, weights) {
  if (!weights || weights.length === 0) return [];
  if (weights.length === 1) return [totalPaise];
  if (totalPaise === 0) return weights.map(() => 0);

  const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (totalWeight <= 0) {
    // Distribute equally if all weights are zero
    const baseShare = Math.floor(totalPaise / weights.length);
    let remainder = totalPaise - baseShare * weights.length;
    return weights.map((_, i) => baseShare + (i < remainder ? 1 : 0));
  }

  // Step 1: Compute exact float allocations and integer floors
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

  // Step 2: Calculate missing paise due to floor truncation
  let missingPaise = totalPaise - allocatedSum;

  // Step 3: Sort by largest fractional remainder descending (tie break by larger weight, then index)
  allocations.sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 1e-9) {
      return b.remainder - a.remainder;
    }
    if (b.weight !== a.weight) {
      return b.weight - a.weight;
    }
    return a.index - b.index;
  });

  // Step 4: Award +1 paisa to the top `missingPaise` recipients
  for (let i = 0; i < missingPaise && i < allocations.length; i++) {
    allocations[i].floor += 1;
  }

  // Step 5: Restore original order
  allocations.sort((a, b) => a.index - b.index);

  return allocations.map((a) => a.floor);
}

/**
 * Core bill splitting calculation.
 * Distributes shared dishes, calculates individual food subtotal,
 * and proportionally (or equally) distributes taxes, service charges, discounts, and roundoff.
 * Reconciles every share down to the last paisa.
 *
 * @param {Object} bill - Receipt object with items, cgst, sgst, serviceCharge, discount, roundOff
 * @param {string[]} people - Array of person names
 * @param {string} [allocationPolicy='proportional'] - 'proportional' (by food subtotal) or 'equal'
 */
export function calculateSplit(bill, people = [], allocationPolicy = 'proportional') {
  if (!bill || !people || people.length === 0) {
    return {
      peopleShares: {},
      reconciliation: {
        totalPaise: 0,
        assignedFoodPaise: 0,
        unassignedFoodPaise: 0,
        extrasPaise: 0,
        sumOfSharesPaise: 0,
        isReconciled: true,
      },
      unassignedItems: [],
    };
  }

  const items = bill.items || [];
  const mathCheck = checkBillMath(bill);

  // Initialize shares for all people
  const personMap = {};
  people.forEach((person) => {
    personMap[person] = {
      name: person,
      foodPaise: 0,
      extraPaise: 0,
      totalPaise: 0,
      foodRupees: 0,
      extraRupees: 0,
      totalRupees: 0,
      items: [], // [{ name, priceRupees, sharePaise, shareRupees, totalSharers }]
    };
  });

  const unassignedItems = [];
  let totalAssignedFoodPaise = 0;
  let totalUnassignedFoodPaise = 0;

  // Distribute each item among assigned consumers
  items.forEach((item) => {
    const itemPricePaise = toPaise(item.price);
    const assigned = (item.assignedTo || []).filter((p) => people.includes(p));

    if (assigned.length === 0) {
      unassignedItems.push({
        ...item,
        pricePaise: itemPricePaise,
      });
      totalUnassignedFoodPaise += itemPricePaise;
      return;
    }

    // Split item price among assigned people using Largest Remainder Method
    const weights = assigned.map(() => 1);
    const itemShares = distributePaise(itemPricePaise, weights);

    assigned.forEach((person, idx) => {
      const sharePaise = itemShares[idx];
      personMap[person].foodPaise += sharePaise;
      personMap[person].items.push({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        fullPrice: fromPaise(itemPricePaise),
        sharePaise,
        shareRupees: fromPaise(sharePaise),
        sharersCount: assigned.length,
      });
    });

    totalAssignedFoodPaise += itemPricePaise;
  });

  // Calculate extras: CGST + SGST + serviceCharge - discount + roundOff
  const cgstPaise = toPaise(bill.cgst || 0);
  const sgstPaise = toPaise(bill.sgst || 0);
  const serviceChargePaise = toPaise(bill.serviceCharge || 0);
  const discountPaise = toPaise(bill.discount || 0);
  const roundOffPaise = toPaise(bill.roundOff || 0);

  const totalExtrasPaise = cgstPaise + sgstPaise + serviceChargePaise - discountPaise + roundOffPaise;

  // Decide how to distribute extras:
  // If unassigned items exist, we scale the extras allocated to people proportional to assigned food vs total food
  // Or distribute totalExtrasPaise across the active consumers.
  // When all items are assigned, assignedFoodPaise === itemsTotalPaise.
  const peopleList = Object.keys(personMap);
  let extraWeights = [];

  if (allocationPolicy === 'equal') {
    // Equal distribution among all people
    extraWeights = peopleList.map(() => 1);
  } else {
    // Proportional to food consumption
    extraWeights = peopleList.map((p) => personMap[p].foodPaise);
    const sumFoodWeights = extraWeights.reduce((a, b) => a + b, 0);
    // If no one ate anything yet, distribute equally
    if (sumFoodWeights === 0) {
      extraWeights = peopleList.map(() => 1);
    }
  }

  // Allocate extras proportionally with paise precision
  const extrasShares = distributePaise(totalExtrasPaise, extraWeights);

  peopleList.forEach((person, idx) => {
    const extraPaise = extrasShares[idx];
    personMap[person].extraPaise = extraPaise;
    personMap[person].totalPaise = personMap[person].foodPaise + extraPaise;

    personMap[person].foodRupees = fromPaise(personMap[person].foodPaise);
    personMap[person].extraRupees = fromPaise(personMap[person].extraPaise);
    personMap[person].totalRupees = fromPaise(personMap[person].totalPaise);
  });

  const sumOfSharesPaise = peopleList.reduce((sum, p) => sum + personMap[p].totalPaise, 0);
  const totalTargetPaise = totalAssignedFoodPaise + totalExtrasPaise;
  const isReconciled = sumOfSharesPaise === totalTargetPaise;

  return {
    peopleShares: personMap,
    reconciliation: {
      itemsTotalPaise: mathCheck.itemsTotalPaise,
      extrasTotalPaise: totalExtrasPaise,
      calculatedTotalPaise: mathCheck.calculatedTotalPaise,
      printedTotalPaise: mathCheck.printedTotalPaise,
      assignedFoodPaise: totalAssignedFoodPaise,
      unassignedFoodPaise: totalUnassignedFoodPaise,
      sumOfSharesPaise,
      sumOfSharesRupees: fromPaise(sumOfSharesPaise),
      isReconciled,
      hasUnassignedItems: unassignedItems.length > 0,
      diffWithBillPaise: sumOfSharesPaise - mathCheck.calculatedTotalPaise,
    },
    unassignedItems,
  };
}

/**
 * Generates an Indian UPI deep link
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export function generateUpiLink(upiId = 'jholfree@upi', payeeName = 'JholFree', amount = 0, note = 'Restaurant Bill Split') {
  const cleanUpi = (upiId || 'jholfree@upi').trim();
  const cleanName = (payeeName || 'Recipient').trim();
  const cleanAmount = typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount).toFixed(2);
  const cleanNote = (note || 'JholFree Bill Split').trim();

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
}
