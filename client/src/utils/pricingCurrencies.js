// Verified USD-base snapshot, preserving the existing NGN -> USD -> display
// conversion approach. Estimates only; every package is charged in NGN.
export const RATE_DATE = '2026-11-23'
export const RATE_SOURCE = 'https://www.exchangerate-api.com'
export const CURRENCIES = Object.freeze({
  USD: { symbol: '$', rate: 1, label: 'USD ($) - United States Dollar' },
  EUR: { symbol: 'EUR ', rate: 0.911134, label: 'EUR - Euro' },
  GBP: { symbol: 'GBP ', rate: 0.763577, label: 'GBP - British Pound' },
  NGN: { symbol: 'NGN ', rate: 1367.642612, label: 'NGN - Nigerian Naira (checkout currency)' },
  GHS: { symbol: 'GHS ', rate: 11.802194, label: 'GHS - Ghanaian Cedi' },
  KES: { symbol: 'KSh', rate: 129.915267, label: 'KES (KSh) - Kenyan Shilling' },
  ZAR: { symbol: 'R', rate: 17.513472, label: 'ZAR (R) - South African Rand' },
  CAD: { symbol: 'C$', rate: 1.433241, label: 'CAD (C$) - Canadian Dollar' },
  AUD: { symbol: 'A$', rate: 1.507013, label: 'AUD (A$) - Australian Dollar' },
})
export function formatNgnPrice(amount, currency = 'NGN') {
  const config = CURRENCIES[currency] || CURRENCIES.NGN
  if (config === CURRENCIES.NGN) return `NGN ${amount.toLocaleString('en-NG')}`
  return `${config.symbol}${(amount / CURRENCIES.NGN.rate * config.rate).toFixed(2)}`
}
