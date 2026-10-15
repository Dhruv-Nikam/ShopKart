require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const { seedProducts } = require('./scripts/seedProducts');

const app = express();
const frontendDist = path.resolve(__dirname, '../frontend/dist');
const frontendIndex = path.join(frontendDist, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndex);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), 
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopKart API is running',
  });
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDist));
}

app.get('*', (req, res, next) => {
  const acceptsHtml = req.get('accept')?.includes('text/html');

  if (!hasFrontendBuild || req.path === '/health' || !acceptsHtml) {
    return next();
  }

  return res.sendFile(frontendIndex);
});

// API Routes
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => {
  if (hasFrontendBuild) {
    return res.sendFile(frontendIndex);
  }

  return res.status(200).json({
    success: true,
    message: 'ShopKart Customer Authentication Service API is running',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

const startServer = async () => {
  let connectionUri = MONGO_URI;

  try {
    // Attempt connecting to the configured MONGO_URI with a 2-second timeout
    await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 2000 });
    console.log('[MongoDB] Connected successfully.');
  } catch (error) {
    console.warn('[MongoDB] Configured database connection failed; using development fallback.');
    console.log('[MongoDB] Starting built-in in-memory MongoDB server for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      connectionUri = memoryServer.getUri();
      await mongoose.connect(connectionUri);
      console.log(`[MongoDB] In-memory MongoDB connected successfully!`);
    } catch (memError) {
      console.error('[MongoDB] Failed to start in-memory database:', memError.message);
      process.exit(1);
    }
  }

  // Seed sample products if database is empty
  await seedProducts();

  app.listen(PORT, () => {
    console.log(`[Server] ShopKart Authentication Service running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
// Server reloaded for fresh database session
