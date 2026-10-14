const Razorpay = require('razorpay');
const crypto = require('crypto');

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Keys are "real" only when they look like actual Razorpay keys (rzp_test_ or rzp_live_)
const hasRealKeys =
  KEY_ID &&
  KEY_SECRET &&
  KEY_ID.startsWith('rzp_') &&
  KEY_ID !== 'rzp_test_YOUR_KEY_ID_HERE' &&
  KEY_SECRET !== 'YOUR_KEY_SECRET_HERE';

// Mock orders are permitted only for automated tests, never for local or live checkout.
const IS_MOCK_MODE = process.env.NODE_ENV === 'test';

let instance = null;

if (hasRealKeys) {
  try {
    instance = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });
  } catch (error) {
    console.error('[Razorpay] Failed to initialize:', error.message);
  }
} else if (process.env.NODE_ENV !== 'test') {
  console.error(
    '\n[Razorpay] ⚠️  Real Razorpay test keys are NOT configured.\n' +
    '           The Razorpay checkout modal will NOT open.\n' +
    '           To fix this:\n' +
    '             1. Go to https://dashboard.razorpay.com → Settings → API Keys\n' +
    '             2. Enable Test Mode and generate keys\n' +
    '             3. Add to backend/.env:\n' +
    '                RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx\n' +
    '                RAZORPAY_KEY_SECRET=your_actual_secret\n' +
    '             4. Restart the backend server\n'
  );
}

/**
 * Creates a Razorpay order.
 * - With real keys: calls Razorpay API → real order_id → modal works.
 * - Automated tests use a locally generated order.
 */
const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  if (IS_MOCK_MODE) {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return {
      id: `order_${Date.now()}_${randomSuffix}`,
      entity: 'order',
      amount: Math.round(amount),
      amount_paid: 0,
      amount_due: Math.round(amount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  if (!hasRealKeys || !instance) {
    const error = new Error(
      'Razorpay is not configured. Add a valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Razorpay Test Mode to backend/.env, then restart the backend.'
    );
    error.code = 'RAZORPAY_NOT_CONFIGURED';
    throw error;
  }

  try {
    const order = await instance.orders.create({
      amount, // in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });
    return order;
  } catch (err) {
    // Razorpay API rejected the request — most likely wrong Key Secret
    const isAuthError =
      err?.statusCode === 401 ||
      err?.error?.code === 'BAD_REQUEST_ERROR' ||
      (err?.message && err.message.toLowerCase().includes('authentication'));

    if (isAuthError) {
      throw new Error(
        'Razorpay authentication failed. Your RAZORPAY_KEY_SECRET in .env is incorrect. ' +
        'Go to https://dashboard.razorpay.com → Settings → API Keys, ' +
        'regenerate your Test Mode keys, and update backend/.env then restart the server.'
      );
    }
    throw err;
  }
};

/**
 * Verifies Razorpay HMAC-SHA256 payment signature.
 * Automated tests accept 'mock_sandbox_signature'.
 */
const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const secret =
    !IS_MOCK_MODE && hasRealKeys && KEY_SECRET
      ? KEY_SECRET
      : 'shopkart_test_secret_67890';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // Accept test signatures only in the automated test environment.
  const isMockSandboxSig =
    IS_MOCK_MODE && razorpay_signature === 'mock_sandbox_signature';

  return expectedSignature === razorpay_signature || isMockSandboxSig;
};

/**
 * Generates a valid HMAC signature — used by the automated test suite.
 */
const generateTestSignature = (razorpay_order_id, razorpay_payment_id) => {
  const secret =
    !IS_MOCK_MODE && hasRealKeys && KEY_SECRET
      ? KEY_SECRET
      : 'shopkart_test_secret_67890';
  return crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
};

module.exports = {
  instance,
  KEY_ID,
  KEY_SECRET,
  hasRealKeys,
  IS_MOCK_MODE,
  createRazorpayOrder,
  verifyRazorpaySignature,
  generateTestSignature,
};
