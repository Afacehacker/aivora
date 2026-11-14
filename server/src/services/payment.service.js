import crypto from 'crypto';

/**
 * Generate a unique manual payment reference
 */
export const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `AIV-${timestamp}-${random}`;
};
