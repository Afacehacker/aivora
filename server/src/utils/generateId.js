import crypto from 'crypto';

/**
 * Generate a unique certificate ID
 * Format: AIVORA-YYYYMMDD-XXXXXXXXXXXX (12 random hex chars)
 * @returns {string} unique certificate ID
 */
const generateCertificateId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `AIVORA-${year}${month}${day}-${randomPart}`;
};

export default generateCertificateId;
