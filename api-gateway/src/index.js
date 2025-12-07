const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const axios = require('axios');
const jwt = require('jsonwebtoken');

dotenv.config();

const {
  PORT = 3001,
  JWT_SECRET = 'supersecretkey',
  AUTH_LOGIN_URL = 'http://localhost:4001',
  AUTH_REGISTER_URL = 'http://localhost:4002',
  OTP_SERVICE_URL = 'http://localhost:8001',
  USER_PROFILE_URL = 'http://localhost:4003',
  BOOK_CATALOG_URL = 'http://localhost:8002',
  ORDER_SERVICE_URL = 'http://localhost:4004',
  PAYMENT_SERVICE_URL = 'http://localhost:8003',
  ADMIN_SERVICE_URL = 'http://localhost:4005',
  CHATBOT_SERVICE_URL = 'http://localhost:8010',
  FRONT_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
} = process.env;

const allowedOrigins = FRONT_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Allow no origin (like mobile apps or curl) or any origin present in the list
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Simple in-memory cart to avoid 404 when cart microservice is absent
const memoryCart = new Map(); // userId -> { items: [], total: number }

const router = express.Router();

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

function adminRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  next();
}

async function proxyRequest(req, res, targetUrl) {
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': req.headers['content-type'] || 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error('Proxy error to', targetUrl, error.message);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}

// Auth
router.post('/auth/login', (req, res) => proxyRequest(req, res, `${AUTH_LOGIN_URL}/auth/login`));
router.post('/auth/register', (req, res) => proxyRequest(req, res, `${AUTH_REGISTER_URL}/auth/register`));
router.post('/auth/complete-first-login', (req, res) => proxyRequest(req, res, `${AUTH_REGISTER_URL}/auth/complete-first-login`));

// OTP
router.post('/otp/register', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/register`));
router.post('/otp/verify', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/verify`));
router.post('/otp/login', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/login`));
router.post('/otp/resend', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/resend`));
router.post('/otp/password-reset/request', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/password-reset/request`));
router.post('/otp/password-reset/verify', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/password-reset/verify`));
router.post('/otp/password-reset/complete', (req, res) => proxyRequest(req, res, `${OTP_SERVICE_URL}/otp/password-reset/complete`));

// User profile
router.get('/users/me', authRequired, (req, res) => proxyRequest(req, res, `${USER_PROFILE_URL}/users/me`));
router.patch('/users/me', authRequired, (req, res) => proxyRequest(req, res, `${USER_PROFILE_URL}/users/me`));
router.delete('/users/me', authRequired, (req, res) => proxyRequest(req, res, `${USER_PROFILE_URL}/users/me`));
router.patch('/users/me/password', authRequired, (req, res) => proxyRequest(req, res, `${USER_PROFILE_URL}/users/me/password`));

// Cart (stubbed in-memory)
router.get('/cart', authRequired, (req, res) => {
  const cart = memoryCart.get(req.user.userId) || { items: [], total: 0 };
  res.json(cart);
});
router.post('/cart', authRequired, (req, res) => {
  const cart = memoryCart.get(req.user.userId) || { items: [], total: 0 };
  const { bookId, quantity = 1, price = 0, type = 'achat', rentPrice, bookType } = req.body || {};
  if (bookId) {
    const existing = cart.items.find((it) => it.bookId === bookId);
    if (existing) existing.quantity = Number(existing.quantity || 0) + Number(quantity || 1);
    else cart.items.push({ bookId, quantity, price, rentPrice, type, bookType });
  }
  cart.total = cart.items.reduce((sum, it) => sum + (Number(it.price || it.rentPrice || 0) * Number(it.quantity || 1)), 0);
  memoryCart.set(req.user.userId, cart);
  res.json(cart);
});
router.patch('/cart/:bookId', authRequired, (req, res) => {
  const cart = memoryCart.get(req.user.userId) || { items: [], total: 0 };
  const { bookId } = req.params;
  const qty = Number(req.body?.quantity || 0);
  cart.items = cart.items.map((it) => (it.bookId === bookId ? { ...it, quantity: qty } : it)).filter((it) => it.quantity > 0);
  cart.total = cart.items.reduce((sum, it) => sum + (Number(it.price || it.rentPrice || 0) * Number(it.quantity || 1)), 0);
  memoryCart.set(req.user.userId, cart);
  res.json(cart);
});
router.delete('/cart/:bookId', authRequired, (req, res) => {
  const cart = memoryCart.get(req.user.userId) || { items: [], total: 0 };
  cart.items = cart.items.filter((it) => it.bookId !== req.params.bookId);
  cart.total = cart.items.reduce((sum, it) => sum + (Number(it.price || it.rentPrice || 0) * Number(it.quantity || 1)), 0);
  memoryCart.set(req.user.userId, cart);
  res.json(cart);
});
router.delete('/cart', authRequired, (req, res) => {
  memoryCart.set(req.user.userId, { items: [], total: 0 });
  res.json({ items: [], total: 0 });
});

// Payment methods
router.get('/payment-methods', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payment-methods`));
router.post('/payment-methods', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payment-methods`));
router.delete('/payment-methods/:id?', authRequired, (req, res) => {
  const id = req.params.id ? `/${req.params.id}` : '';
  proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payment-methods${id}`);
});
router.patch('/payment-methods/:id/default', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payment-methods/${req.params.id}/default`));
router.post('/payments/intent', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payments/intent`));
router.get('/payments/intent/:id', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payments/intent/${req.params.id}`));
router.get('/payments/history', authRequired, (req, res) => proxyRequest(req, res, `${PAYMENT_SERVICE_URL}/payments/history`));

// Books
router.get('/books', (req, res) => proxyRequest(req, res, `${BOOK_CATALOG_URL}/books`));
router.get('/books/categories', (req, res) => proxyRequest(req, res, `${BOOK_CATALOG_URL}/books/categories`));
router.get('/books/:id', (req, res) => proxyRequest(req, res, `${BOOK_CATALOG_URL}/books/${req.params.id}`));
router.post('/books', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/books`));
router.post('/books/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/books/${req.params.id}`));
router.put('/books/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/books/${req.params.id}`));
router.delete('/books/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/books/${req.params.id}`));

// Orders
router.post('/orders', authRequired, (req, res) => proxyRequest(req, res, `${ORDER_SERVICE_URL}/orders`));
router.get('/orders', authRequired, (req, res) => proxyRequest(req, res, `${ORDER_SERVICE_URL}/orders`));
router.get('/orders/summary', authRequired, (req, res) => proxyRequest(req, res, `${ORDER_SERVICE_URL}/orders/summary`));
router.get('/orders/admin-summary', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ORDER_SERVICE_URL}/orders/admin-summary`));

// Chatbot
router.post('/chatbot', (req, res) => proxyRequest(req, res, `${CHATBOT_SERVICE_URL}/chat`));

// Admin routes
router.get('/admin/stats', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/stats`));
router.get('/admin/users', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/users`));
router.get('/admin/users/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/users/${req.params.id}`));
router.post('/admin/users', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/users`));
router.patch('/admin/users/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/users/${req.params.id}`));
router.delete('/admin/users/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/users/${req.params.id}`));

router.get('/admin/orders', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/orders`));
router.patch('/admin/orders/:id/status', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/admin/orders/${req.params.id}/status`));

router.get('/categories', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/categories`));
router.post('/categories', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/categories`));
router.patch('/categories/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/categories/${req.params.id}`));
router.delete('/categories/:id', authRequired, adminRequired, (req, res) => proxyRequest(req, res, `${ADMIN_SERVICE_URL}/categories/${req.params.id}`));

app.use('/api', router);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'e-Biblio API Gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
