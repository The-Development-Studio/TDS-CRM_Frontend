const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const compactInrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1
});

export const formatINR = (amount: number) => inrFormatter.format(amount);

export const formatCompactINR = (amount: number) => compactInrFormatter.format(amount);