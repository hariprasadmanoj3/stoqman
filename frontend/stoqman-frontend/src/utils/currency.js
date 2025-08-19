export const formatCurrency = (amount, currency = 'INR') => {
  const number = Number(amount) || 0;
  
  if (currency === 'INR') {
    return `₹${number.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }
  
  return number.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const formatNumber = (number) => {
  return Number(number || 0).toLocaleString('en-IN');
};