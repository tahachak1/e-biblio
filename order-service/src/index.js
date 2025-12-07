const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

dotenv.config();

const {
  PORT = 4004,
  MONGO_URI = 'mongodb://localhost:27017/ebiblio',
  JWT_SECRET = 'supersecretkey',
  BOOK_SERVICE_URL = 'http://localhost:8002',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_HOST = 'smtp.gmail.com',
  EMAIL_PORT = 587,
  EMAIL_FROM = EMAIL_USER
} = process.env;

mongoose.connect(MONGO_URI).then(() => console.log('Order-service connected to MongoDB')).catch((err) => console.error('Mongo error', err));

const orderItemSchema = new mongoose.Schema({
  bookId: String,
  quantity: Number,
  type: String, // purchase | rent
  bookType: { type: String, default: 'papier' }, // papier | numerique
  rentalDurationDays: Number,
  rentalStartAt: Date,
  rentalEndAt: Date,
  deliveryEta: Date,
  returnDueAt: Date,
  price: Number,
  book: {
    title: String,
    author: String,
    image: String,
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, required: true, default: () => uuidv4().split('-')[0].toUpperCase() },
  numero: { type: String, required: true, unique: true, default: () => uuidv4().split('-')[0].toUpperCase() },
  customerEmail: String,
  items: { type: [orderItemSchema], default: [] },
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    email: String,
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

const app = express();
app.use(cors());
app.use(express.json());

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  next();
}

const mailer = EMAIL_USER && EMAIL_PASS ? nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: Number(EMAIL_PORT) === 465,
  auth: {
    user: EMAIL_USER,
    pass: (EMAIL_PASS || '').replace(/\s+/g, ''),
  },
}) : null;

async function sendReceipt(order, toEmail) {
  if (!mailer || !toEmail) return;
  const total = (order.totalAmount || 0).toFixed(2);
  const items = (order.items || []).map((item) => ({
    title: item.book?.title || 'Article',
    qty: item.quantity || 1,
    price: (item.price || 0).toFixed(2),
  }));
  const text = [
    `Bonjour,`,
    ``,
    `Merci pour votre commande #${order.orderNumber || order.numero}.`,
    ``,
    `Détail :`,
    ...items.map((i) => `- ${i.title} x${i.qty} : ${i.price} CAD`),
    ``,
    `Total : ${total} CAD`,
    ``,
    `Statut : ${order.status || 'pending'}`,
    ``,
    `e-Biblio`,
  ].join('\n');

  const itemsRows = items.map((i) => `
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#111827;">${i.title}</td>
      <td style="padding:8px 12px;font-size:14px;color:#111827;text-align:center;">${i.qty}</td>
      <td style="padding:8px 12px;font-size:14px;color:#111827;text-align:right;">${i.price} CAD</td>
    </tr>
  `).join('');

  const html = `
  <div style="background:#f3f4f6;padding:24px;font-family:'Inter',system-ui,-apple-system,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#10b981);color:white;padding:20px 24px;">
        <div style="font-size:13px;letter-spacing:1px;opacity:0.9;text-transform:uppercase;">e-Biblio</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">Merci pour votre commande</div>
        <div style="font-size:14px;opacity:0.9;margin-top:4px;">Commande #${order.orderNumber || order.numero}</div>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 12px 0;color:#111827;font-size:15px;">Bonjour,</p>
        <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
          Nous avons bien reçu votre paiement. Voici le récapitulatif de votre commande.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:12px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#edf2ff;">
                <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4b5563;text-align:left;">Article</th>
                <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4b5563;text-align:center;">Qté</th>
                <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4b5563;text-align:right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center;">Aucun article</td></tr>'}
              <tr>
                <td colspan="2" style="padding:12px;font-size:14px;font-weight:700;color:#111827;text-align:right;border-top:1px solid #e5e7eb;">Total</td>
                <td style="padding:12px;font-size:14px;font-weight:700;color:#111827;text-align:right;border-top:1px solid #e5e7eb;">${total} CAD</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">Statut : ${statusLabel[order.status] || order.status || 'pending'}</p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
        e-Biblio — Merci pour votre confiance.
      </div>
    </div>
  </div>
  `;

  await mailer.sendMail({
    to: toEmail,
    from: EMAIL_FROM || EMAIL_USER,
    subject: `Votre commande e-Biblio #${order.orderNumber || order.numero}`,
    text,
    html,
  });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Token manquant' });
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

async function fetchBook(bookId) {
  try {
    const response = await axios.get(`${BOOK_SERVICE_URL}/books/${bookId}`);
    return response.data;
  } catch (err) {
    return null;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

app.post('/orders', authRequired, async (req, res) => {
  let { items = [], shippingAddress = {}, totalAmount } = req.body;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (err) {
      return res.status(400).json({ message: 'Format des articles invalide' });
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Aucun article dans la commande' });
  }
  try {
    const enrichedItems = [];
    const customerEmail = shippingAddress.email || req.user?.email || null;
    let computedTotal = 0;
    for (const item of items) {
      const book = await fetchBook(item.bookId);
      const price = item.type === 'rent' ? (book?.rentPrice || book?.price || 0) : (book?.price || 0);
      computedTotal += price * (item.quantity || 1);
      const bookType = book?.type === 'numerique' ? 'numerique' : 'papier';
      const rentalDurationDays = item.rentalDurationDays || (bookType === 'numerique' ? 7 : 14);
      const now = new Date();
      const rentalStartAt = now;
      const deliveryEta = bookType === 'numerique' ? now : new Date(now.getTime() + 3 * DAY_MS);
      const rentalEndAt = new Date(now.getTime() + rentalDurationDays * DAY_MS);
      const returnDueAt = bookType === 'numerique'
        ? rentalEndAt
        : new Date(deliveryEta.getTime() + rentalDurationDays * DAY_MS);
      enrichedItems.push({
        bookId: item.bookId,
        quantity: item.quantity || 1,
        type: item.type || 'purchase',
        bookType,
        rentalDurationDays,
        rentalStartAt,
        rentalEndAt,
        deliveryEta,
        returnDueAt,
        price,
        book: {
          title: book?.title || 'Livre',
          author: book?.author || 'Auteur inconnu',
          image: book?.image || '',
        }
      });
    }

    const orderNumber = uuidv4().split('-')[0].toUpperCase();
    const order = await Order.create({
      userId: req.user.userId,
      items: enrichedItems,
      orderNumber,
      numero: orderNumber,
      customerEmail,
      totalAmount: typeof totalAmount === 'number' ? totalAmount : computedTotal,
      status: 'pending',
      shippingAddress
    });

    // Mettre à jour les stats utilisateur (best effort)
    try {
      const purchases = enrichedItems.reduce((sum, it) => sum + (it.type === 'rent' || it.type === 'location' ? 0 : (it.quantity || 1)), 0);
      const rentals = enrichedItems.reduce((sum, it) => sum + ((it.type === 'rent' || it.type === 'location') ? (it.quantity || 1) : 0), 0);
      const inc = {
        'stats.totalCommandes': 1,
        'stats.totalDepense': typeof totalAmount === 'number' ? totalAmount : computedTotal,
        'stats.livresAchetes': purchases,
        'stats.livresLoues': rentals,
      };
      const uid = req.user.userId;
      const usersCollection = mongoose.connection.collection('users');
      const filter = ObjectId.isValid(uid) ? { _id: new mongoose.Types.ObjectId(uid) } : { _id: uid };
      await usersCollection.updateOne(filter, { $inc: inc });
    } catch (err) {
      console.error('Failed to update user stats', err);
    }

    // Envoi du reçu (best-effort)
    try {
      await sendReceipt(order, customerEmail);
    } catch (errMail) {
      console.error('Email receipt failed', errMail);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
});

app.get('/orders', authRequired, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
});

app.get('/orders/admin-summary', authRequired, adminRequired, async (req, res) => {
  try {
    const orders = await Order.find({});
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const summary = orders.reduce((acc, order) => {
      acc.totalOrders += 1;
      acc.totalAmount += Number(order.totalAmount || 0);
      if (order.createdAt && order.createdAt >= startOfDay) {
        acc.ordersToday += 1;
        acc.amountToday += Number(order.totalAmount || 0);
      }
      (order.items || []).forEach((item) => {
        if (item.type === 'rent' || item.type === 'location') acc.booksRented += Number(item.quantity || 1);
        else acc.booksBought += Number(item.quantity || 1);
      });
      return acc;
    }, { totalOrders: 0, totalAmount: 0, booksBought: 0, booksRented: 0, ordersToday: 0, amountToday: 0 });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du résumé des commandes (admin)' });
  }
});

app.get('/orders/summary', authRequired, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    let totalAmount = 0;
    let totalOrders = orders.length;
    let booksBought = 0;
    let booksRented = 0;

    orders.forEach((order) => {
      totalAmount += Number(order.totalAmount || 0);
      (order.items || []).forEach((item) => {
        if (item.type === 'rent' || item.type === 'location') {
          booksRented += Number(item.quantity || 1);
        } else {
          booksBought += Number(item.quantity || 1);
        }
      });
    });

    res.json({
      totalOrders,
      totalAmount,
      booksBought,
      booksRented,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération du résumé des commandes' });
  }
});

app.get('/', (req, res) => res.json({ status: 'order-service ok' }));

app.listen(PORT, () => console.log(`order-service running on ${PORT}`));
