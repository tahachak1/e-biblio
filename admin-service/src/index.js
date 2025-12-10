const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { buildNotificationEmail } = require('./utils/notificationTemplate');

dotenv.config();

const {
  PORT = 4005,
  MONGO_URI = 'mongodb://localhost:27017/ebiblio',
  JWT_SECRET = 'supersecretkey',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_HOST = 'smtp.gmail.com',
  EMAIL_PORT = 587,
  EMAIL_FROM = EMAIL_USER,
  FILE_BASE_URL,
  FRONT_URL = 'http://localhost:3000',
  CARRIER_WEBHOOK_SECRET,
} = process.env;

mongoose.connect(MONGO_URI).then(() => console.log('Admin-service connected to MongoDB')).catch((err) => console.error('Mongo error', err));

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'actif' },
  isActive: { type: Boolean, default: true },
  firstLoginCompleted: { type: Boolean, default: true },
  lastLogin: Date,
  stats: {
    totalCommandes: { type: Number, default: 0 },
    totalDepense: { type: Number, default: 0 },
    livresAchetes: { type: Number, default: 0 },
    livresLoues: { type: Number, default: 0 }
  }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  nom: String,
  slug: String,
  type: { type: String, default: 'general' }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  rentPrice: Number,
  image: String,
  pdfUrl: String,
  category: String,
  categorieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: String,
  isbn: String,
  publisher: String,
  publicationYear: Number,
  pages: Number,
  type: { type: String, default: 'papier' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: String,
  items: [
    {
      bookId: String,
      quantity: Number,
      type: String,
      bookType: { type: String, default: 'papier' },
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
        price: Number,
        rentPrice: Number,
      }
    }
  ],
  totalAmount: Number,
  paymentMethod: { type: String, default: 'stripe' },
  status: { type: String, default: 'pending' },
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    email: String,
  },
  shippingTracking: {
    number: String,
    carrier: { type: String, default: 'eBiblio Logistics' },
    status: String,
    eta: Date,
    history: [{
      status: String,
      message: String,
      updatedAt: { type: Date, default: Date.now }
    }]
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Book = mongoose.model('Book', bookSchema);
const Order = mongoose.model('Order', orderSchema);

// Fallbacks pour éviter un dashboard vide en l'absence de données réelles.
const DEFAULT_CATEGORIES = [
  { name: 'Littérature', value: 12 },
  { name: 'Sciences', value: 8 },
  { name: 'Histoire', value: 10 },
  { name: 'Jeunesse', value: 6 },
  { name: 'Technologie', value: 7 },
  { name: 'Arts', value: 5 },
];

function buildDefaultTrend() {
  const days = 6;
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - idx));
    const label = d.toISOString().slice(0, 10);
    return { label, total: 0, sales: 0, rentals: 0, orders: 0 };
  });
}

const app = express();
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const PDF_DIR = path.join(UPLOAD_ROOT, 'pdfs');
fs.mkdirSync(PDF_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT));

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

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  next();
}

function sanitize(user) {
  const payload = user.toObject();
  delete payload.password;
  return { ...payload, id: user._id };
}

function sanitizeFilename(name = '') {
  return name.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function savePdfFromBase64(pdfBase64, originalName) {
  if (!pdfBase64) return null;
  const matches = pdfBase64.match(/^data:application\/pdf;base64,(.+)$/);
  const base64Data = matches ? matches[1] : pdfBase64;
  const fileName = `${Date.now()}-${sanitizeFilename(originalName || 'document')}.pdf`;
  const filePath = path.join(PDF_DIR, fileName);
  fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
  const baseUrl = FILE_BASE_URL || `http://localhost:${PORT}`;
  return `${baseUrl}/uploads/pdfs/${fileName}`;
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `TMP-${out}`;
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

async function sendTemporaryPasswordEmail(to, tempPassword, createdBy) {
  if (!mailer) {
    console.warn('[Admin][Email] EMAIL_USER/PASS missing, skipping email send');
    return;
  }
  const adminName = createdBy || 'Administrateur e-Biblio';
  const text = [
    `Bonjour,`,
    ``,
    `${adminName} a créé un compte e-Biblio pour vous.`,
    `Mot de passe provisoire (une seule utilisation) : ${tempPassword}`,
    ``,
    `Étapes :`,
    `1) Connectez-vous avec ce mot de passe provisoire.`,
    `2) Suivez l'invite pour le changer immédiatement.`,
    ``,
    `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    ``,
    `e-Biblio`,
  ].join('\n');

  await mailer.sendMail({
    from: EMAIL_FROM || EMAIL_USER,
    to,
    subject: 'Votre compte e-Biblio - mot de passe provisoire',
    text,
  });
  console.log(`[Admin][Email] Sent temp password to ${to}`);
}

function generateTrackingNumber() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = 'TRK-';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

async function collectRecipients(recipient, specificEmail) {
  if (recipient === 'specific' && specificEmail) {
    return [specificEmail.trim()];
  }
  const query = { email: { $exists: true, $ne: null } };
  if (recipient === 'users') {
    query.role = { $ne: 'admin' };
  }
  const users = await User.find(query).select('email').lean();
  const emails = (users || []).map((u) => u.email).filter(Boolean);
  return Array.from(new Set(emails));
}

async function sendNotificationEmails({ recipients, subject, title, message, type = 'general', ctaLabel, ctaUrl }) {
  if (!mailer) {
    console.warn('[Admin][Email] EMAIL_USER/PASS missing, skipping notification send');
    return { sent: 0 };
  }
  const toList = Array.isArray(recipients) ? recipients.filter(Boolean) : [];
  if (!toList.length) return { sent: 0 };

  const html = buildNotificationEmail({ title, message, type, ctaLabel, ctaUrl });
  const text = [
    title || 'Notification',
    '',
    message || '',
    '',
    ctaUrl ? `Détail: ${ctaUrl}` : ''
  ].join('\n');

  // Use bcc to avoid leaking recipient emails when broadcasting
  const mailOptions = toList.length > 1
    ? { from: EMAIL_FROM || EMAIL_USER, to: EMAIL_FROM || EMAIL_USER, bcc: toList, subject, html, text }
    : { from: EMAIL_FROM || EMAIL_USER, to: toList[0], subject, html, text };

  await mailer.sendMail(mailOptions);
  console.log(`[Admin][Email] Notification sent to ${toList.length} recipient(s)`);
  return { sent: toList.length };
}

function slugify(text = '') {
  return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

app.get('/admin/stats', authRequired, adminRequired, async (req, res) => {
  try {
    const [usersCount, orders, books, categories] = await Promise.all([
      User.countDocuments({}),
      Order.find({}).sort({ createdAt: 1 }).lean(),
      Book.find({}),
      Category.find({})
    ]);

    // Totaux de base
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const orderStatuses = orders.reduce((acc, order) => {
      const key = order.status || 'pending';
      acc[key] = acc[key] || { count: 0, revenue: 0 };
      acc[key].count += 1;
      acc[key].revenue += order.totalAmount || 0;
      return acc;
    }, { retours: { count: 0, revenue: 0 } });

    // Répartition catégories (livres par catégorie)
    let categoryDistribution = categories.map((cat) => ({
      name: cat.nom,
      value: books.filter((b) => b.categorieId?.toString() === cat._id.toString()).length
    }));
    if (!categoryDistribution.length) categoryDistribution = DEFAULT_CATEGORIES;

    // Top produits (à partir des commandes)
    const productMap = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const title = item.book?.title || 'Produit';
        const author = item.book?.author || '';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        if (!productMap[title]) {
          productMap[title] = { title, author, sales: 0, revenue: 0 };
        }
        productMap[title].sales += quantity;
        productMap[title].revenue += quantity * price;
      });
    });
    let topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
      .slice(0, 5);
    if (!topProducts.length) {
      topProducts = books.slice(0, 5).map((book) => ({
        title: book.title,
        author: book.author,
        sales: 0,
        revenue: 0
      }));
    }

    // Tendances 7 derniers jours
    const daysBack = 7;
    const now = new Date();
    const trendMap = {};
    for (let i = daysBack - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      trendMap[label] = { label, total: 0, sales: 0, rentals: 0, orders: 0 };
    }
    orders.forEach((order) => {
      const label = order.createdAt?.toISOString().slice(0, 10);
      if (label && trendMap[label]) {
        trendMap[label].total += order.totalAmount || 0;
        trendMap[label].sales += order.totalAmount || 0;
        trendMap[label].orders += 1;
        (order.items || []).forEach((item) => {
          const t = (item.type || '').toLowerCase();
          const isRental = t.includes('loc') || t === 'rent';
          if (isRental) {
            trendMap[label].rentals += item.quantity || 1;
          }
        });
      }
    });
    const revenueTrend = Object.values(trendMap);
    const finalRevenueTrend = revenueTrend.length ? revenueTrend : buildDefaultTrend();

    // Dernières commandes
    const recentOrders = orders.slice(-5).reverse().map((order) => ({
      id: order._id,
      number: order.orderNumber || order.numero,
      total: order.totalAmount || 0,
      customer: order.shippingAddress?.name || 'Client',
      status: order.status,
      createdAt: order.createdAt
    }));

    const notifications = recentOrders.map((order) => ({
      id: order.id,
      title: 'Nouvelle commande',
      message: `Commande #${order.number || order.id}`,
      type: 'order',
      date: order.createdAt,
      isRead: false,
      user: order.customer
    }));

    // Locations actives / retards / commandes du jour
    const nowTs = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    let locationsActives = 0;
    let retards = 0;
    let ordersToday = 0;
    orders.forEach((order) => {
      const createdLabel = order.createdAt?.toISOString().slice(0, 10);
      if (createdLabel === todayStr) ordersToday += 1;
      (order.items || []).forEach((item) => {
        const t = (item.type || '').toLowerCase();
        const isRental = t.includes('loc') || t === 'rent';
        if (!isRental) return;
        const endTs = item.rentalEndAt ? new Date(item.rentalEndAt).getTime() : null;
        if (!endTs) return;
        if (endTs >= nowTs) locationsActives += 1;
        else retards += 1;
      });
    });

    res.json({
      totals: {
        books: books.length,
        users: usersCount,
        verifiedUsers: usersCount,
        unverifiedUsers: 0,
        orders: orders.length,
      revenue
    },
    orderStatuses,
    revenueTrend: finalRevenueTrend,
    categoryDistribution,
    topProducts,
    recentOrders,
    notifications,
    locationsActives,
    retards,
    ordersToday
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques' });
  }
});

app.get('/admin/users', authRequired, adminRequired, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ users: users.map(sanitize) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

app.get('/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

app.post('/admin/users', authRequired, adminRequired, async (req, res) => {
  const { firstName, lastName, email, role = 'user', status = 'actif' } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Utilisateur déjà existant' });
    const tempPasswordPlain = generateTemporaryPassword();
    const hashed = await bcrypt.hash(tempPasswordPlain, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      role,
      status,
      password: hashed,
      isActive: true,
      firstLoginCompleted: false,
    });

    try {
      await sendTemporaryPasswordEmail(email, tempPasswordPlain, req.user?.email);
    } catch (err) {
      console.error('[Admin][Email] Send failed', err);
      return res.status(500).json({ message: 'Utilisateur créé, mais envoi du mot de passe provisoire impossible' });
    }

    res.status(201).json({
      user: sanitize(user),
      message: 'Utilisateur créé et mot de passe provisoire envoyé par email',
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

app.patch('/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

app.delete('/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// Categories
app.get('/categories', authRequired, adminRequired, async (req, res) => {
  const categories = await Category.find({}).sort({ createdAt: -1 });
  res.json({ categories });
});

app.post('/categories', authRequired, adminRequired, async (req, res) => {
  const { nom, type } = req.body;
  if (!nom) return res.status(400).json({ message: 'Nom requis' });
  const category = await Category.create({ nom, slug: slugify(nom), type });
  res.status(201).json(category);
});

app.patch('/categories/:id', authRequired, adminRequired, async (req, res) => {
  const { nom, type } = req.body;
  const category = await Category.findByIdAndUpdate(req.params.id, { nom, type, slug: nom ? slugify(nom) : undefined }, { new: true });
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  res.json(category);
});

app.delete('/categories/:id', authRequired, adminRequired, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Catégorie supprimée' });
});

// Books
app.post('/books', authRequired, adminRequired, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.type === 'numerique') {
      if (payload.pdfBase64) {
        payload.pdfUrl = savePdfFromBase64(payload.pdfBase64, payload.pdfFileName || payload.title);
      }
      if (!payload.pdfUrl) {
        return res.status(400).json({ message: 'Fichier PDF requis pour un livre numérique' });
      }
    } else {
      payload.pdfUrl = undefined;
    }
    delete payload.pdfBase64;
    delete payload.pdfFileName;
    const book = await Book.create(payload);
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création du livre' });
  }
});

app.post('/books/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const payload = { ...req.body, _id: req.params.id };
    if (payload.type === 'numerique') {
      if (payload.pdfBase64) {
        payload.pdfUrl = savePdfFromBase64(payload.pdfBase64, payload.pdfFileName || payload.title);
      }
      if (!payload.pdfUrl) {
        return res.status(400).json({ message: 'Fichier PDF requis pour un livre numérique' });
      }
    } else {
      payload.pdfUrl = undefined;
    }
    delete payload.pdfBase64;
    delete payload.pdfFileName;
    const book = await Book.create(payload);
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création du livre' });
  }
});

app.put('/books/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.type === 'numerique') {
      if (payload.pdfBase64) {
        payload.pdfUrl = savePdfFromBase64(payload.pdfBase64, payload.pdfFileName || payload.title);
      }
      if (!payload.pdfUrl) {
        return res.status(400).json({ message: 'Fichier PDF requis pour un livre numérique' });
      }
    } else {
      payload.pdfUrl = undefined;
    }
    delete payload.pdfBase64;
    delete payload.pdfFileName;
    const book = await Book.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du livre' });
  }
});

app.delete('/books/:id', authRequired, adminRequired, async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: 'Livre supprimé' });
});

app.post('/admin/notifications', authRequired, adminRequired, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'general',
      recipient = 'users',
      recipientEmail,
      ctaLabel,
      ctaUrl,
    } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ message: 'Titre et message requis' });
    }

    const recipients = await collectRecipients(recipient, recipientEmail);
    if (!recipients.length) {
      return res.status(400).json({ message: 'Aucun destinataire trouvé' });
    }

    const subject = `[${type.toUpperCase()}] ${title}`;
    const result = await sendNotificationEmails({
      recipients,
      subject,
      title,
      message,
      type,
      ctaLabel,
      ctaUrl,
    });

    return res.json({ sent: result.sent, recipients });
  } catch (err) {
    console.error('Failed to send notification', err);
    res.status(500).json({ message: 'Erreur lors de l’envoi de la notification' });
  }
});

// Admin orders
app.get('/admin/orders', authRequired, adminRequired, async (req, res) => {
  try {
    // Utiliser lean() pour renvoyer les articles complets (les documents hydratés
    // masquaient le champ items).
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
});

app.patch('/admin/orders/:id/status', authRequired, adminRequired, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Statut requis' });
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });

    const now = new Date();
    if (status === 'shipped' && !order.shippingTracking?.number) {
      order.shippingTracking = {
        number: generateTrackingNumber(),
        carrier: order.shippingTracking?.carrier || 'eBiblio Logistics',
        status: 'shipped',
        eta: order.shippingTracking?.eta || new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        history: [
          ...(order.shippingTracking?.history || []),
          { status: 'shipped', message: 'Colis expédié', updatedAt: now }
        ]
      };
    } else {
      order.shippingTracking = order.shippingTracking || {};
      order.shippingTracking.status = status;
      order.shippingTracking.history = [
        ...(order.shippingTracking.history || []),
        { status, message: `Statut mis à jour: ${status}`, updatedAt: now }
      ];
    }

    order.status = status;
    await order.save();

    const toEmail = order.customerEmail || order.shippingAddress?.email || null;
    if (toEmail) {
      const subject = `Mise à jour de votre commande #${order.orderNumber || order._id}`;
      const title = `Statut mis à jour : ${status}`;
      const trackingLine = order.shippingTracking?.number ? `\nNuméro de suivi : ${order.shippingTracking.number}\nTransporteur : ${order.shippingTracking.carrier || 'eBiblio Logistics'}` : '';
      const message = `Bonjour,\n\nVotre commande #${order.orderNumber || order._id} a été mise à jour.\nNouveau statut : ${status}.${trackingLine}\n\nMerci pour votre confiance.\n`;
      const orderUrl = `${FRONT_URL.replace(/\/$/, '')}/orders/${order._id}`;
      try {
        await sendNotificationEmails({
          recipients: [toEmail],
          subject,
          title,
          message,
          type: 'general',
          ctaLabel: 'Suivre ma commande',
          ctaUrl: orderUrl,
        });
      } catch (emailErr) {
        console.error('Order status email failed', emailErr);
      }
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

app.post('/carrier/webhook', async (req, res) => {
  if (CARRIER_WEBHOOK_SECRET) {
    const token = req.headers['x-webhook-secret'];
    if (token !== CARRIER_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Secret invalide' });
    }
  }
  const { trackingNumber, status, message, eta } = req.body || {};
  if (!trackingNumber || !status) {
    return res.status(400).json({ message: 'trackingNumber et status requis' });
  }
  try {
    const order = await Order.findOne({ 'shippingTracking.number': trackingNumber });
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    const now = new Date();
    order.status = status;
    order.shippingTracking = order.shippingTracking || {};
    order.shippingTracking.status = status;
    if (eta) order.shippingTracking.eta = new Date(eta);
    order.shippingTracking.history = [
      ...(order.shippingTracking.history || []),
      { status, message: message || `Statut mis à jour: ${status}`, updatedAt: now }
    ];
    await order.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Carrier webhook update failed', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du suivi' });
  }
});

app.get('/', (req, res) => res.json({ status: 'admin-service ok' }));

app.listen(PORT, () => console.log(`admin-service running on ${PORT}`));
