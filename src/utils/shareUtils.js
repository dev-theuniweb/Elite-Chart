// Utility functions for share URL encoding/decoding

/**
 * Encode win data into a short Base64 string
 * @param {Object} data - Win data object
 * @returns {string} - Base64 encoded string
 */
export const encodeShareData = (data) => {
  const { amount, s1, s2, s3, trend, time } = data;
  const dataString = `${amount}|${s1}|${s2}|${s3}|${trend}|${time}`;
  return btoa(dataString);
};

/**
 * Decode Base64 string back to win data object
 * @param {string} encodedData - Base64 encoded string
 * @returns {Object|null} - Decoded win data or null if invalid
 */
export const decodeShareData = (encodedData) => {
  try {
    const dataString = atob(encodedData);
    const [amount, s1, s2, s3, trend, time] = dataString.split('|');
    
    if (!amount || !s1 || !s2 || !s3) {
      return null;
    }
    
    return {
      amount: parseFloat(amount),
      s1,
      s2,
      s3,
      trend: trend || 'Rollercoaster',
      time: time || Date.now()
    };
  } catch (error) {
    console.error('Error decoding share data:', error);
    return null;
  }
};

/**
 * Generate a short share URL
 * @param {Object} winData - Win data object with amount, results, trend, etc.
 * @returns {string} - Short share URL
 */
export const generateShareUrl = (winData) => {
  const encoded = encodeShareData({
    amount: winData.amount,
    s1: winData.round1Result || 'up',
    s2: winData.round2Result || 'down',
    s3: winData.round3Result || 'up',
    trend: winData.trendName || 'Rollercoaster',
    time: Date.now()
  });
  
  return `${window.location.protocol}//${window.location.host}/win?d=${encoded}`;
};
