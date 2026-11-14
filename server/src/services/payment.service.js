import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';
const FLW_BASE = 'https://api.flutterwave.com/v3';

/**
 * Generate a unique payment reference
 */
export const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `AIV-${timestamp}-${random}`;
};

/**
 * Initialize a Paystack payment
 */
export const initializePaystack = async (email, amount, ref, metadata = {}) => {
  const response = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference: ref,
      callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      metadata,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data;
};

/**
 * Verify a Paystack payment
 */
export const verifyPaystackPayment = async (reference) => {
  const response = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  return response.data.data;
};

/**
 * Verify Paystack webhook HMAC-SHA512 signature
 */
export const verifyPaystackWebhook = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
};

/**
 * Initialize a Flutterwave payment (optional second provider)
 */
export const initializeFlutterwave = async (email, amount, ref, name, metadata = {}) => {
  const response = await axios.post(
    `${FLW_BASE}/payments`,
    {
      tx_ref: ref,
      amount,
      currency: 'NGN',
      redirect_url: `${process.env.CLIENT_URL}/payment/verify`,
      customer: { email, name },
      meta: metadata,
      customizations: {
        title: 'AIVORA',
        description: 'Course Payment',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data;
};

/**
 * Verify a Flutterwave payment
 */
export const verifyFlutterwavePayment = async (transactionId) => {
  const response = await axios.get(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    },
  });

  return response.data.data;
};
