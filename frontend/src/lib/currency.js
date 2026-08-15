// Exchange rate: 1 USD = 1650 NGN (approximate)
export const NGN_TO_USD = 1650;

export function ngnToUsd(ngn) {
  return (ngn / NGN_TO_USD).toFixed(0);
}

export function dualPrice(ngn) {
  return `₦${Number(ngn).toLocaleString()} (~$${ngnToUsd(ngn)})`;
}