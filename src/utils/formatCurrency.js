/**
 * Currency formatting utility for Indian Rupee (INR)
 */

export function formatRupees(amount, includeDecimals = true) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  if (!includeDecimals && Number.isInteger(num)) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPaise(paise) {
  const p = typeof paise === 'number' ? paise : parseInt(paise, 10) || 0;
  return formatRupees(p / 100);
}
