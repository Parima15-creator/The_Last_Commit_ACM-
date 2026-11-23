/**
 * Demo bill dataset representing ₹966 Spice Garden bill.
 * Used for instant zero-config testing and demonstrations.
 */

export const DEMO_BILL = {
  restaurantName: "Spice Garden",
  receiptDate: "2026-11-23",
  items: [
    {
      id: "item_1",
      name: "Chicken Biryani",
      qty: 1,
      price: 320,
      confidence: "high",
      assignedTo: ["Me"],
    },
    {
      id: "item_2",
      name: "Paneer Tikka",
      qty: 1,
      price: 280,
      confidence: "low", // Displays amber "Check OCR" badge
      assignedTo: ["Me", "Rohan"],
    },
    {
      id: "item_3",
      name: "Cold Coffee",
      qty: 1,
      price: 150,
      confidence: "high",
      assignedTo: ["Priya"],
    },
    {
      id: "item_4",
      name: "Fresh Lime Soda",
      qty: 1,
      price: 90,
      confidence: "high",
      assignedTo: ["Kabir"],
    },
  ],
  cgst: 21,
  sgst: 21,
  serviceCharge: 84,
  discount: 0,
  roundOff: 0,
  printedTotal: 966,
};

export const DEMO_PEOPLE = ["Me", "Rohan", "Priya", "Kabir"];

export const DEMO_PAYMENTS = {
  "Me": 966, // "Me" paid the full restaurant bill initially
};

export const DEMO_UPI_IDS = {
  "Me": "me.jholfree@okaxis",
  "Rohan": "rohan@icici",
  "Priya": "priya@okhdfcbank",
  "Kabir": "kabir@paytm",
};
