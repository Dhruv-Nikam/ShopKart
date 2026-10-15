# 🛒 ShopKart — Full-Stack MERN E-Commerce Platform

> **Engineering Lab Suite (Labs 01 — 06) • Complete Purchase Journey**
> 
> A robust, full-stack e-commerce web application featuring custom JWT authentication, product catalog discovery, persistent wishlist, server-validated cart, and an end-to-end checkout pipeline powered by **Razorpay Test Mode** payment gateway and order lifecycle tracking.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [System Architecture & Purchase Flow](#-system-architecture--purchase-flow)
- [Key Features](#-key-features)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#1-prerequisites)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
- [Environment Configuration (`.env`)](#-environment-configuration)
- [Razorpay Test Payment Guide](#-razorpay-test-payment-guide)
- [API Reference Contract](#-api-reference-contract)
- [Business Rules & Security Design](#-business-rules--security-design)
- [Testing & Validation (33/33 Passing)](#-testing--validation)
- [Viva & Technical Evaluation Q&A](#-viva--technical-evaluation-qa)

---

## 🌟 Overview

ShopKart connects every layer of modern full-stack web development:
- **Lab 01**: Secure Customer Authentication (Custom JWT in HttpOnly cookies, bcrypt hashing, MVC structure).
- **Lab 02**: Product Catalog with dynamic filters, categories, search, and stock status.
- **Lab 03**: Dynamic Product Details & review snapshots.
- **Lab 04**: Persistent Wishlist with toggle operations and count badges.
- **Lab 05**: Server-managed Shopping Cart with stock bounds and derived subtotals.
- **Lab 06**: End-to-end Checkout, Server-side Pricing & Stock Revalidation, Razorpay Orders API, HMAC-SHA256 Signature Verification, Post-Payment Cart Invalidation, and Order Status Tracking (`PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`).

---

## 🛠 Tech Stack

| Domain | Technology | Details / Role |
|---|---|---|
| **Frontend** | React 18, Vite | Single Page Application (SPA), React Router DOM v6 |
| **Styling** | Tailwind CSS, Lucide React | Modern glassmorphic & accessible component design |
| **Backend** | Node.js, Express.js | REST API server with custom middleware & MVC pattern |
| **Database** | MongoDB & Mongoose | Document modeling, in-memory fallback server support |
| **Authentication**| JWT (`jsonwebtoken`) | Secure, cross-site HttpOnly cookie-based sessions |
| **Security** | `bcryptjs`, Node `crypto` | Salted password hashing & HMAC-SHA256 signature verification |
| **Payments** | Razorpay Node SDK | Test-mode order generation & secure standard checkout modal |
| **Testing** | Supertest, MongoMemoryServer | End-to-end automated test suites for all labs |

---

## 🔄 System Architecture & Purchase Flow

```text
[ Browse Catalog ] 
       ↓
[ Add to Cart ] 
       ↓
[ Proceed to Checkout (/checkout) ] 
       ↓
[ Enter & Validate Shipping Address ] 
       ↓
[ POST /orders/create-payment-order ]
   ├── Server verifies stock for each product
   ├── Server calculates total independently (rejects frontend tampering)
   ├── ShopKart Order created (paymentStatus: 'PENDING', orderStatus: 'PLACED')
   └── Razorpay Order generated in paise (100x INR)
       ↓
[ Razorpay Checkout Modal Opens ]
   ├── User enters Test Card / UPI details
   └── Razorpay issues payment_id + order_id + signature
       ↓
[ POST /orders/verify-payment ]
   ├── Server validates HMAC-SHA256 signature using Secret Key
   ├── Order updated to paymentStatus: 'PAID', orderStatus: 'CONFIRMED'
   ├── Product inventory stock deducted
   └── Customer cart cleared in MongoDB
       ↓
[ Frontend CartContext resets to Cart(0) ]
       ↓
[ Order Success & Stepper Tracking (/orders/:id) ]
```

---

## ✨ Key Features

1. **Custom Auth & Session Management**:
   - 100% custom implementation (no third-party auth services like Firebase or Auth0).
   - JWT stored in secure `HttpOnly` cookies preventing XSS attacks.
2. **Product Price & Metadata Snapshotting**:
   - Order items snapshot `name`, `price`, and `image` at the exact moment of purchase.
   - Future product price modifications do **not** affect historical order records.
3. **Strict Server-Side Validation**:
   - Frontend totals are completely ignored to avoid client-side tampering.
   - Stock availability is double-checked during payment initiation to prevent race conditions.
4. **Razorpay Standard Checkout & Fallback Simulator**:
   - Real Razorpay Test Mode checkout popup when test keys are supplied.
   - Integrated testing simulator modal with Card/UPI tabs when operating in automated test environments.
5. **HMAC-SHA256 Signature Verification**:
   - Payment signatures are cryptographically checked using Node's native `crypto` module before order confirmation or inventory deduction.
6. **Order History & Real-Time Stepper**:
   - Dedicated `/orders` page with loading skeletons, empty state, and detailed status badges.
   - Order tracking progression (`PLACED` ➔ `CONFIRMED` ➔ `SHIPPED` ➔ `DELIVERED`).

---

## 📁 Project Directory Structure

```text
c:\Engineering Lab\
├── backend/
│   ├── config/
│   │   └── razorpay.js              # Razorpay SDK instance & HMAC verification
│   ├── controllers/
│   │   ├── cart.controller.js       # Add, update quantity, remove, clear cart
│   │   ├── customer.controller.js   # Register, login, profile, logout
│   │   ├── order.controller.js      # Checkout, verify payment, get orders, status update
│   │   ├── product.controller.js    # Products query & filters
│   │   └── wishlist.controller.js   # Wishlist toggle and retrieve
│   ├── middlewares/
│   │   └── auth.middleware.js       # Protect routes with JWT verification
│   ├── models/
│   │   ├── customer.model.js        # User model with embedded cart & wishlist
│   │   ├── order.model.js           # Order schema with snapshot items & address
│   │   └── product.model.js         # Product schema with stock & categories
│   ├── routes/
│   │   ├── cart.routes.js
│   │   ├── customer.routes.js
│   │   ├── order.routes.js
│   │   ├── product.routes.js
│   │   └── wishlist.routes.js
│   ├── scripts/
│   │   └── seedProducts.js          # Auto-seed catalogue if database is empty
│   ├── test/
│   │   ├── customer.test.js
│   │   ├── order.test.js            # Lab 06 Checkout & Order test suite (33 tests)
│   │   └── product.test.js
│   ├── .env                         # Server environment variables
│   ├── index.js                     # Express server & MongoDB connection
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CartItem.jsx
│   │   │   ├── Navbar.jsx           # Dynamic Cart count & auth badges
│   │   │   └── Logo.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx      # Global cart state & derived subtotals
│   │   ├── pages/
│   │   │   ├── Cart.jsx             # Shopping cart view & checkout trigger
│   │   │   ├── Checkout.jsx         # Shipping form & Razorpay modal trigger
│   │   │   ├── Orders.jsx           # Order history list view
│   │   │   ├── OrderDetails.jsx     # Order confirmation & status stepper
│   │   │   ├── Products.jsx         # Catalogue & search filters
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios client instance withCredentials: true
│   │   ├── App.jsx                  # Main routing configuration
│   │   └── main.jsx
│   ├── vite.config.js               # Dev server port 5173 & API proxy to port 5001
│   └── package.json
│
└── README.md                        # Master Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Web Browser**: Chrome, Edge, or Firefox

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd "c:\Engineering Lab\backend"

# Install dependencies
npm install

# Start development server with auto-reload
npm run dev
```

*Server starts on `http://localhost:5001` (with automatic in-memory MongoDB fallback if Atlas is offline).*

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd "c:\Engineering Lab\frontend"

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

*Frontend will be running on `http://localhost:5173`.*

---

## ⚙️ Environment Configuration


> ⚠️ **Note**: No spaces around `=` in `.env` files. `RAZORPAY_KEY_SECRET` is kept strictly on the backend and **never** exposed to the frontend bundle.

---

## 💳 Razorpay Test Payment Guide

When testing on `http://localhost:5173/checkout`, click **Pay with Razorpay** and use official Razorpay test credentials:

### 1. Test Card (Success)
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date (e.g., `12/26`)
- **CVV**: Any 3 digits (e.g., `123`)
- **OTP**: Any 4 or 6-digit code (e.g., `1234`)

### 2. Test UPI (Success)
- **VPA / ID**: `success@razorpay`

---

## 🔌 API Reference Contract

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/customers/register` | ❌ | Create new customer account |
| `POST` | `/customers/login` | ❌ | Authenticate and issue JWT cookie |
| `POST` | `/customers/logout` | ❌ | Clear session cookie |
| `GET` | `/customers/me` | ✅ | Fetch active user profile |
| `GET` | `/products` | ❌ | List products with search/category/sort filters |
| `GET` | `/cart` | ✅ | Fetch customer's current cart with populate |
| `POST` | `/cart/:productId` | ✅ | Add product to cart or increment quantity |
| `PUT` | `/cart/:productId` | ✅ | Update item quantity with stock boundary validation |
| `DELETE` | `/cart/:productId` | ✅ | Remove line item from cart |
| `DELETE` | `/cart` | ✅ | Clear customer cart |
| `POST` | `/orders/create-payment-order` | ✅ | Re-check stock, calculate total, create pending Order & Razorpay order |
| `POST` | `/orders/verify-payment` | ✅ | Verify HMAC-SHA256 signature, mark PAID, deduct stock & clear cart |
| `GET` | `/orders` | ✅ | Retrieve authenticated user's order history (isolated) |
| `GET` | `/orders/:id` | ✅ | Retrieve details for a single owned order |
| `PATCH` | `/orders/:id/status` | ✅ | *(Bonus)* Progress order status (`SHIPPED`, `DELIVERED`, etc.) |

---

## 🛡️ Business Rules & Security Design

1. **Why calculate `totalAmount` on the server?**  
   Client-side values sent over HTTP requests can be intercepted and manipulated (e.g., changing ₹7,497 to ₹1 in DevTools). The server reads current prices from the database and calculates `Σ(price × quantity)`.

2. **Why snapshot `name`, `price`, and `image` in Order items?**  
   Product prices and descriptions change over time or may be deleted. The Order must preserve an immutable financial and audit trail of what was agreed upon at the checkout timestamp.

3. **Why verify payment signature using HMAC-SHA256?**  
   If the client simply returned `{ paymentSuccess: true }`, any user could forge fake payment receipts. Generating `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id)` guarantees authenticity.

4. **Why keep cart intact until signature verification?**  
   If the user abandons the Razorpay modal or their card gets declined, their cart remains intact so they do not lose selected items.

5. **Cross-User Isolation**:  
   Queries for `GET /orders` and `GET /orders/:id` always enforce `{ customer: req.user._id }`. Guessing another user's order ID returns `404 Not Found`.

---

## 🧪 Testing & Validation

All **33 automated test cases** for Lab 06 pass with 100% coverage:

```bash
cd "c:\Engineering Lab\backend"
npm run test:orders
```

### Test Suite Output:
```text
====================================================
  ShopKart Checkout & Orders (Lab 06) — Test Suite
====================================================

--- Task 1: Order Model Schema & Validation ---
  ✅ PASS: Order schema contains customer ref
  ✅ PASS: Order schema contains items array with required snapshots
  ✅ PASS: Order schema contains shippingAddress
  ✅ PASS: Order schema defaults paymentStatus to PENDING
  ✅ PASS: Order schema defaults orderStatus to PLACED

--- Task 2: Create Payment Order API ---
  ✅ PASS: Unauthenticated POST /orders/create-payment-order returns 401
  ✅ PASS: Missing shipping address returns 400
  ✅ PASS: Incomplete address fields return 400
  ✅ PASS: Checkout with empty cart returns 400
  ✅ PASS: Valid checkout order returns status 201 with success: true
  ✅ PASS: Response includes razorpayOrderId, amount in paise, and keyId
  ✅ PASS: Checkout test response includes Razorpay order details
  ✅ PASS: Order total calculated strictly on server matches item subtotal sum
  ✅ PASS: Razorpay amount is in paise (100x)
  ✅ PASS: Cart is NOT cleared upon order initiation (remains intact until payment)

--- Task 3: Payment Verification API ---
  ✅ PASS: Unauthenticated POST /orders/verify-payment returns 401
  ✅ PASS: Missing payment parameters returns 400
  ✅ PASS: Forged/invalid signature returns 400
  ✅ PASS: Failed payment verification updates status to FAILED
  ✅ PASS: User 2 attempting to verify User 1 order returns 403 or 404
  ✅ PASS: Valid payment verification returns 200 with success: true
  ✅ PASS: Order paymentStatus updated to PAID and orderStatus to CONFIRMED
  ✅ PASS: Product inventory stock is properly deducted after payment confirmation
  ✅ PASS: Customer cart is cleared after verified payment

--- Task 4: Get Order History (GET /orders) ---
  ✅ PASS: GET /orders returns 200 with orders array
  ✅ PASS: GET /orders returns at least 1 order for user 1
  ✅ PASS: User 2 orders list is empty (proper user isolation)

--- Task 5: Get Single Order Details (GET /orders/:id) ---
  ✅ PASS: Invalid order ID returns 400
  ✅ PASS: Non-existent order returns 404
  ✅ PASS: User 2 cannot access User 1 order (returns 404)
  ✅ PASS: Owner can retrieve their order details with status 200

--- Bonus Challenge: Update Order Status ---
  ✅ PASS: PATCH /orders/:id/status updates status to SHIPPED with 200
  ✅ PASS: Invalid status transition returns 400

====================================================
  🎉 ALL CHECKOUT & ORDER TESTS PASSED! (33/33)
  ShopKart Lab 06 Backend 100% Complete & Verified!
====================================================
```

---
<div align="center">
  <b>Developed for Engineering Lab 06 — ShopKart Sequence</b><br/>
  <i>All rights reserved &copy; 2026 ShopKart Team</i>
</div>

---

## Deploying Both Apps as One Railway Service

The repository root is an npm workspace for both apps. Deploy the repository root as a single Railway service:

1. Set the service Root Directory to `/` (the repository root).
2. Use `npm run build` as the build command and `npm start` as the start command.
3. Add the backend environment variables in Railway: `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`. Set `NODE_ENV` to `production`; Railway supplies `PORT`.
4. Do not set `VITE_API_URL`: the frontend uses relative API paths, so it calls the backend on the same domain.

The build produces `frontend/dist`, and the Express backend serves those files alongside the API. The `/health` endpoint is available for health checks. Keep real credentials only in Railway Variables and rotate credentials that have been shared publicly.

---

## Deploying Both Apps as One Railway Service

The repository root is an npm workspace for both apps. Deploy the repository root as a single Railway service:

1. Set the service Root Directory to `/` (the repository root).
2. Use `npm run build` as the build command and `npm start` as the start command.
3. Add the backend environment variables in Railway: `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`. Set `NODE_ENV` to `production`; Railway supplies `PORT`.
4. Do not set `VITE_API_URL`: the frontend uses relative API paths, so it calls the backend on the same domain.

The build produces `frontend/dist`, and the Express backend serves those files alongside the API. The `/health` endpoint is available for health checks. Keep real credentials only in Railway Variables and rotate credentials that have been shared publicly.
