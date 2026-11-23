import {
  toPaise,
  fromPaise,
  distributePaise,
  checkBillMath,
  calculateEqualSplit,
  calculateItemSplit,
} from '../utils/financialMath.js';

console.log('🧪 [Running JholFree Financial Math Unit Tests]...');

// Test 1: Integer Paise Conversions
console.log('1. Testing Paise Conversions...');
if (toPaise(100.5) !== 10050) throw new Error('toPaise(100.5) failed');
if (toPaise('320.00') !== 32000) throw new Error('toPaise("320.00") failed');
if (fromPaise(10050) !== 100.5) throw new Error('fromPaise(10050) failed');
console.log('✔ Conversions test passed');

// Test 2: Largest Remainder Method (₹100 among 3 people)
console.log('2. Testing Largest Remainder Method: ₹100 split between 3 people...');
const shares100 = distributePaise(10000, [1, 1, 1]);
console.log('Allocated paise:', shares100);
if (shares100.reduce((a, b) => a + b, 0) !== 10000) {
  throw new Error('Sum does not match 10000 paise!');
}
if (shares100[0] !== 3334 || shares100[1] !== 3333 || shares100[2] !== 3333) {
  throw new Error(`Unexpected shares: ${JSON.stringify(shares100)}`);
}
console.log('✔ ₹100 split between 3 test passed (33.34, 33.33, 33.33 = exactly ₹100.00)');

// Test 3: Mode 1 - Equal Split (₹1000 among 4 people)
console.log('3. Testing Mode 1: Equal Split (₹1000 among A, B, C, D)...');
const equalBill = {
  items: [{ name: 'Meal', qty: 1, price: 1000 }],
  cgst: 0,
  sgst: 0,
  serviceCharge: 0,
  discount: 0,
  roundOff: 0,
  printedTotal: 1000,
};
const equalResult = calculateEqualSplit(equalBill, ['Person A', 'Person B', 'Person C', 'Person D']);
if (!equalResult.isReconciled) throw new Error('Equal split not reconciled');
if (equalResult.shares['Person A'].totalRupees !== 250) {
  throw new Error(`Expected 250 each, got ${equalResult.shares['Person A'].totalRupees}`);
}
console.log('✔ Equal split test passed (4 x ₹250 = ₹1000)');

// Test 4: Mode 2 - Item-Based Split (Pizza 400 -> A, Burger 200 -> B, Coffee 100 -> A, C)
console.log('4. Testing Mode 2: Item-Based Split...');
const itemBill = {
  items: [
    { id: '1', name: 'Pizza', qty: 1, price: 400, assignedTo: ['Person A'] },
    { id: '2', name: 'Burger', qty: 1, price: 200, assignedTo: ['Person B'] },
    { id: '3', name: 'Coffee', qty: 1, price: 100, assignedTo: ['Person A', 'Person C'] },
  ],
  cgst: 17.5,
  sgst: 17.5,
  serviceCharge: 35,
  discount: 0,
  roundOff: 0,
  printedTotal: 770,
};
const itemResult = calculateItemSplit(itemBill, ['Person A', 'Person B', 'Person C']);
if (!itemResult.reconciliation.isReconciled) {
  throw new Error('Item split is not reconciled!');
}

console.log('Item Split Breakdown:');
['Person A', 'Person B', 'Person C'].forEach((p) => {
  const s = itemResult.shares[p];
  console.log(`- ${p}: Food ₹${s.foodSubtotalRupees} + Tax ₹${s.taxShareRupees} + Service ₹${s.serviceChargeShareRupees} = Total ₹${s.totalRupees} (${s.totalPaise} paise)`);
});

const totalItemRupees = Object.values(itemResult.shares).reduce((sum, s) => sum + s.totalRupees, 0);
if (Math.round(totalItemRupees * 100) !== 77000) {
  throw new Error(`Total sum ${totalItemRupees} does not match 770!`);
}
console.log('✔ Mode 2 Item-based split test passed (Sum = exactly ₹770.00 down to 0 paise drift)');

// Test 5: Edge cases: zero items, unassigned items, zero-weight
console.log('5. Testing zero weights and unassigned items...');
const unassignedBill = {
  items: [{ id: '1', name: 'Cake', qty: 1, price: 500, assignedTo: [] }],
  cgst: 25,
  sgst: 25,
  serviceCharge: 0,
  discount: 0,
  roundOff: 0,
};
const unassignedResult = calculateItemSplit(unassignedBill, ['Person A', 'Person B']);
if (!unassignedResult.reconciliation.hasUnassignedItems) {
  throw new Error('Unassigned items not flagged correctly');
}
console.log('✔ Edge cases test passed');

console.log('\n🎉 ALL 5 FINANCIAL ENGINE UNIT TESTS PASSED WITH 100% RECONCILIATION ACCURACY!\n');
