import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  X,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';

/* ─────────────────────────────────────────────
   Built-in Razorpay Test Payment Simulator Modal
   Shows when real Razorpay keys are not configured.
   Mimics the Razorpay checkout UX.
───────────────────────────────────────────── */
const PaymentSimulatorModal = ({ orderInfo, onSuccess, onFailure, onClose, userName, userEmail, userPhone }) => {
  const [tab, setTab] = useState('card'); // card | upi | netbanking | wallet
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/26');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(userName || '');
  const [upi, setUpi] = useState('success@razorpay');
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState('');

  const amountInRupees = orderInfo?.amount ? (orderInfo.amount / 100).toLocaleString('en-IN') : '0';

  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handlePay = async () => {
    setCardError('');
    if (tab === 'card') {
      if (!cardCvv || cardCvv.length < 3) {
        setCardError('Please enter a valid CVV.');
        return;
      }
      if (!cardName.trim()) {
        setCardError('Please enter the cardholder name.');
        return;
      }
    }
    setPaying(true);
    // Simulate network delay like real payment processing
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await onSuccess(orderInfo);
    } catch {
      setPaying(false);
    }
  };

  const tabs = [
    { id: 'card', label: 'Card', Icon: CreditCard },
    { id: 'upi', label: 'UPI', Icon: Smartphone },
    { id: 'netbanking', label: 'Net Banking', Icon: Building2 },
    { id: 'wallet', label: 'Wallet', Icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Razorpay-style header */}
        <div className="bg-[#072654] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Razorpay logo-ish */}
            <div className="w-8 h-8 rounded-lg bg-[#3395FF] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                <path d="M14.5 2L6 14h6l-2 8 10-12h-6l2.5-8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">ShopKart</p>
              <p className="text-blue-200 text-xs mt-0.5">{userEmail || 'checkout@shopkart.com'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Total Amount</p>
            <p className="text-white font-extrabold text-lg">₹{amountInRupees}</p>
          </div>
        </div>

        {/* Test mode banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-semibold">
            Test Mode — No real money will be charged
          </p>
        </div>

        {/* Payment method tabs */}
        <div className="flex border-b border-slate-100">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition border-b-2 ${
                tab === id
                  ? 'border-[#3395FF] text-[#3395FF]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 space-y-4">
          {tab === 'card' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Number</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  maxLength={19}
                  placeholder="4111 1111 1111 1111"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono tracking-widest"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expiry (MM/YY)</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">CVV</label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    placeholder="•••"
                    type="password"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name on Card</label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              {cardError && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {cardError}
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                Test card: <span className="font-mono font-bold text-slate-600">4111 1111 1111 1111</span> · Any future expiry · Any CVV
              </p>
            </>
          )}

          {tab === 'upi' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">UPI ID</label>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Test UPI: <span className="font-mono font-bold text-slate-600">success@razorpay</span>
              </p>
            </>
          )}

          {(tab === 'netbanking' || tab === 'wallet') && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                {tab === 'netbanking' ? <Building2 className="w-6 h-6 text-blue-500" /> : <Wallet className="w-6 h-6 text-blue-500" />}
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {tab === 'netbanking' ? 'Net Banking' : 'Wallet'} (Test Mode)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click Pay to simulate a successful {tab === 'netbanking' ? 'net banking' : 'wallet'} payment.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-[#3395FF] hover:bg-[#1a7ee0] disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-400/30"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{amountInRupees} Securely</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={paying}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition py-1"
          >
            Cancel & go back to checkout
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 pt-1">
            <Lock className="w-3 h-3" />
            <span>Powered by</span>
            <span className="font-bold text-[#072654]">Razorpay</span>
            <span>· 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Checkout Component
───────────────────────────────────────────── */
const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, subtotal, totalUnits, refreshCart } = useCart();

  // Shipping Address Form State
  const [address, setAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const errorRef = useRef(null);

  // Auto-scroll to error banner whenever an error is set
  useEffect(() => {
    if (errorMsg && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMsg]);

  // Sync user details if loaded later
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Load Razorpay Checkout script dynamically (for when real keys are configured)
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setErrorMsg('');
  };

  const validateForm = () => {
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = 'Full name is required';
    if (!address.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (address.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!address.addressLine.trim()) errors.addressLine = 'Street address is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.state.trim()) errors.state = 'State is required';
    if (!address.postalCode.trim()) {
      errors.postalCode = 'PIN / Postal code is required';
    } else if (address.postalCode.replace(/\D/g, '').length < 6) {
      errors.postalCode = 'Enter a valid 6-digit PIN code';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Verify the payment callback with the backend before placing the order.
  const finalizePayment = async (orderInfo, paymentId, razorpayOrderId, signature) => {
    const verifyRes = await verifyPayment({
      orderId: orderInfo.orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
    if (verifyRes.success) {
      await refreshCart();
      navigate(`/orders/${orderInfo.orderId}?success=true`);
    } else {
      throw new Error('Payment verification failed. Please contact support.');
    }
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (!cart || cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Check your connection and try again.');
      }

      // Step 1: Create a real Razorpay order on the server.
      const paymentOrderData = await createPaymentOrder(address);
      const { orderId, razorpayOrderId, amount, currency, keyId } = paymentOrderData;

      // Step 2: Open the official Razorpay Checkout modal.
      const hasRealKey = keyId && keyId.startsWith('rzp_') && keyId !== 'rzp_test_YOUR_KEY_ID_HERE';
      if (hasRealKey) {
        const options = {
          key: keyId,
          amount,
          currency: currency || 'INR',
          name: 'ShopKart',
          description: `Order #${orderId.toString().slice(-6).toUpperCase()}`,
          order_id: razorpayOrderId,
          image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
          prefill: {
            name: address.fullName,
            email: user?.email || '',
            contact: address.phone,
          },
          theme: { color: '#3395FF' },
          handler: async function (response) {
            try {
              await finalizePayment(
                paymentOrderData,
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature
              );
            } catch (vErr) {
              setErrorMsg(vErr.message || 'Payment verification failed on server.');
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => setIsSubmitting(false),
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setErrorMsg(`Payment failed: ${response.error.description || 'Transaction declined'}`);
          setIsSubmitting(false);
        });
        rzp.open();
        return;
      }

      throw new Error('A valid Razorpay Key ID is not configured. Add Razorpay Test Mode keys to backend/.env.');
    } catch (err) {
      console.error('Error initiating checkout:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to initialize payment. Please check your cart and address.'
      );
      setIsSubmitting(false);
    }
  };

  if (!cartLoading && (!cart || cart.length === 0)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          Add some items to your cart before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/cart" className="hover:text-indigo-600 flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <span>/</span>
        <span className="text-indigo-600 font-semibold">Checkout &amp; Payment</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout &amp; Shipping
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete your shipping address and pay securely via Razorpay.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Razorpay Test Mode</span>
        </div>
      </div>

      {errorMsg && (
        <div
          ref={errorRef}
          className="mb-6 p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3 text-rose-700 animate-fade-in"
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-base">Payment Error</p>
            <p className="text-sm text-rose-700 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping Address Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delivery Address</h2>
                <p className="text-xs text-slate-500">Where should we deliver your order?</p>
              </div>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.fullName
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.phone
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Line / Street / Flat *
                </label>
                <input
                  type="text"
                  name="addressLine"
                  value={address.addressLine}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Sunset Heights, MG Road"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                    formErrors.addressLine
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.addressLine && (
                  <p className="text-rose-600 text-xs mt-1">{formErrors.addressLine}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.city
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.state
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.state && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleChange}
                    placeholder="e.g. 560001"
                    maxLength={6}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.postalCode
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.postalCode && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>256-bit SSL encrypted &amp; secure</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Review & Pay Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3.5 mb-4 flex items-center justify-between">
              <span>Order Review</span>
              <span className="text-xs font-medium text-slate-400">{cart.length} item(s)</span>
            </h2>

            {/* Item Previews */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 mb-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product?._id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product?.image}
                    alt={item.product?.name}
                    className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200/60"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800 truncate">
                      {item.product?.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span>Total Items ({totalUnits} units):</span>
                <span className="font-semibold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Shipping &amp; Handling:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                  FREE
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{subtotal.toLocaleString('en-IN')} with Razorpay</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>Free Express Delivery Across India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
