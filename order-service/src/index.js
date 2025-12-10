const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const generateInvoice = require('./utils/generateInvoice');
const invoiceRoute = require('./routes/invoiceRoute');

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
  EMAIL_FROM = EMAIL_USER,
  FRONT_URL = 'http://localhost:3000'
} = process.env;

const invoicesDir = path.join(__dirname, 'invoices');
fs.mkdirSync(invoicesDir, { recursive: true });

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
    price: Number,
    rentPrice: Number,
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, required: true, default: () => uuidv4().split('-')[0].toUpperCase() },
  numero: { type: String, required: true, unique: true, default: () => uuidv4().split('-')[0].toUpperCase() },
  customerEmail: String,
  items: { type: [orderItemSchema], default: [] },
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

const statusLabel = {
  pending: 'En attente',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  canceled: 'Annulée',
  paid: 'Payée',
};

function isDigitalItem(item = {}) {
  const type = (item.type || '').toString().toLowerCase();
  const bookType = (item.bookType || '').toString().toLowerCase();
  const format = (item.book?.format || '').toString().toLowerCase();
  const digitalTypes = ['digital', 'ebook', 'e-book', 'digital-rent', 'location-numerique', 'numerique', 'numerique-rent'];
  const isRent = type.includes('rent') || type.includes('location');
  const isDigitalType = digitalTypes.includes(type);
  const isDigitalBookType = ['numerique', 'digital', 'ebook', 'e-book'].includes(bookType);
  const isDigitalFormat = ['digital', 'numerique', 'ebook', 'e-book'].includes(format);
  const isBookFlag = Boolean(item.book?.isDigital);
  return isDigitalType || isDigitalFormat || isDigitalBookType || isBookFlag || (isRent && (isDigitalFormat || isDigitalBookType));
}

// Auto progression cadence: stagger each email/status by ~10s (configurable via DEMO_STEP_MS).
const AUTO_STEP_MS = Number(process.env.DEMO_STEP_MS || 10000);
const SHIP_AFTER_MS = AUTO_STEP_MS * 2; // ~20s
const DELIVER_AFTER_MS = AUTO_STEP_MS * 3; // ~30s

function generateTrackingNumber() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = 'TRK-';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

function scheduleAutoProgress(orderId) {
  setTimeout(async () => {
    try {
      const now = new Date();
      const orderCurrent = await Order.findById(orderId);
      const hasPhysical = orderCurrent && (orderCurrent.items || []).some((it) => !isDigitalItem(it));
      if (!hasPhysical) return; // pas d'auto progression pour les commandes 100% numériques
      const order = await Order.findByIdAndUpdate(orderId, {
        status: 'shipped',
        $set: {
          'shippingTracking.status': 'shipped',
          'shippingTracking.eta': new Date(now.getTime() + (DELIVER_AFTER_MS - SHIP_AFTER_MS)),
        },
        $push: { 'shippingTracking.history': { status: 'shipped', message: 'Colis expédié (auto)', updatedAt: now } },
      }, { new: true });
      if (order) {
        await sendStatusEmail(order, 'shipped', 'Votre colis vient d’être expédié.');
      }
    } catch (err) {
      console.error('Auto-progress to shipped failed', err);
    }
  }, SHIP_AFTER_MS);

  setTimeout(async () => {
    try {
      const now = new Date();
      const orderCurrent = await Order.findById(orderId);
      const hasPhysical = orderCurrent && (orderCurrent.items || []).some((it) => !isDigitalItem(it));
      if (!hasPhysical) return;
      const order = await Order.findByIdAndUpdate(orderId, {
        status: 'delivered',
        $set: {
          'shippingTracking.status': 'delivered',
          'shippingTracking.eta': now,
        },
        $push: { 'shippingTracking.history': { status: 'delivered', message: 'Livrée (auto)', updatedAt: now } },
      }, { new: true });
      if (order) {
        await sendStatusEmail(order, 'delivered', 'Votre commande est livrée.');
      }
    } catch (err) {
      console.error('Auto-progress to delivered failed', err);
    }
  }, DELIVER_AFTER_MS);
}

async function generateInvoicePdf(order) {
  const html = generateInvoice(order);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '24mm', right: '16mm', bottom: '24mm', left: '16mm' },
    });
    const fileName = `order_${order._id || order.orderNumber || Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    return { pdfBuffer, filePath };
  } finally {
    if (browser) await browser.close();
  }
}

async function sendStatusEmail(order, status, customMessage) {
  if (!mailer) return;
  const toEmail = order?.shippingAddress?.email || order?.customerEmail;
  if (!toEmail) return;
  const label = statusLabel[status] || status || 'Mise à jour';
  const tracking = order?.shippingTracking;
  const orderId = order.orderNumber || order.numero || order._id;
  const link = `${FRONT_URL.replace(/\/$/, '')}/orders/${order._id}`;
  const physicalItems = (order.items || []).filter((it) => !isDigitalItem(it));
  // Ne pas envoyer d'email de statut pour les commandes 100% numériques
  if (!physicalItems.length) return;
  const lines = [
    `Bonjour,`,
    ``,
    `Votre commande #${orderId} a été mise à jour.`,
    `Statut : ${label}.`,
  ];
  if (tracking?.number) {
    lines.push(`Numéro de suivi : ${tracking.number}`);
    if (tracking.carrier) lines.push(`Transporteur : ${tracking.carrier}`);
  }
  if (customMessage) {
    lines.push('', customMessage);
  }
  if (physicalItems.length) {
    lines.push('', 'Articles à livrer :');
    physicalItems.slice(0, 5).forEach((it) => {
      lines.push(`- ${(it.book && it.book.title) || 'Article'} x${it.quantity || 1}`);
    });
    if (physicalItems.length > 5) lines.push(`... +${physicalItems.length - 5} autres`);
  } else {
    lines.push('', 'Aucun article physique à livrer (commande numérique uniquement).');
  }
  lines.push('', `Suivre ma commande : ${link}`, '', `Merci pour votre confiance.`, `e-Biblio`);

  const text = lines.join('\n');
  const html = `
    <div style="font-family:'Inter',system-ui,-apple-system,sans-serif;background:#f8fafc;padding:20px;">
      <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#6366f1);color:white;padding:18px 20px;font-weight:700;">
          Mise à jour : ${label}
        </div>
        <div style="padding:20px;color:#0f172a;">
          <p style="margin:0 0 10px 0;">Bonjour,</p>
          <p style="margin:0 0 12px 0;">Votre commande <strong>#${orderId}</strong> a été mise à jour.</p>
          <p style="margin:0 0 12px 0;">Statut : <strong>${label}</strong></p>
          ${tracking?.number ? `<p style="margin:0 0 6px 0;">Numéro de suivi : <strong>${tracking.number}</strong></p>` : ''}
          ${tracking?.carrier ? `<p style="margin:0 0 12px 0;">Transporteur : <strong>${tracking.carrier}</strong></p>` : ''}
          ${customMessage ? `<p style="margin:0 0 12px 0;color:#334155;">${customMessage}</p>` : ''}
          ${physicalItems.length ? `
            <div style="margin:10px 0;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
              <div style="font-weight:600;color:#0f172a;margin-bottom:6px;">Articles à livrer :</div>
              <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.5;">
                ${physicalItems.slice(0,5).map(it => `<li>${(it.book && it.book.title) || 'Article'} x${it.quantity || 1}</li>`).join('')}
                ${physicalItems.length > 5 ? `<li>... +${physicalItems.length - 5} autres</li>` : ''}
              </ul>
            </div>
          ` : `
            <div style="margin:10px 0;padding:10px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#92400e;font-size:13px;">
              Aucun article physique à livrer (commande numérique uniquement).
            </div>
          `}
          <a href="${link}" style="display:inline-block;margin-top:12px;padding:10px 14px;background:#1d4ed8;color:white;border-radius:10px;text-decoration:none;font-weight:600;">Suivre ma commande</a>
        </div>
        <div style="background:#f8fafc;padding:14px 20px;color:#64748b;font-size:13px;text-align:center;">
          Merci pour votre confiance.
        </div>
      </div>
    </div>
  `;

  await mailer.sendMail({
    to: toEmail,
    from: EMAIL_FROM || EMAIL_USER,
    subject: `Commande #${orderId} – ${label}`,
    text,
    html,
  });
}

async function sendReceipt(order, toEmail) {
  if (!mailer || !toEmail) return;
  const total = (order.totalAmount || 0).toFixed(2);
  const items = (order.items || []).map((item) => ({
    title: item.book?.title || 'Article',
    qty: item.quantity || 1,
    price: (item.price || 0).toFixed(2),
    type: item.type || 'physique',
    downloadLink: item.downloadLink,
  }));
  const digitalRentals = items.filter((i) => i.type === 'digital-rent' || i.type === 'location-numerique');
  const digitalPurchases = items.filter((i) => i.type === 'digital' || i.type === 'ebook');
  const physicalItems = items.filter((i) => !digitalRentals.includes(i) && !digitalPurchases.includes(i));

  const text = [
    `Bonjour,`,
    ``,
    `Merci pour votre paiement. Votre commande #${order.orderNumber || order.numero} est confirmée.`,
    ``,
    `Détail :`,
    ...items.map((i) => `- ${i.title} x${i.qty} : ${i.price} CAD`),
    ``,
    `Total : ${total} CAD`,
    ``,
    `Statut : ${order.status || 'paid'}`,
    digitalRentals.length
      ? `Accès location numérique : consultez vos livres loués dans votre profil e-Biblio (section Mes locations numériques).`
      : null,
    digitalPurchases.length
      ? `Livres numériques achetés : retrouvez-les dans votre profil e-Biblio (section Mes livres numériques)${digitalPurchases.some((d) => d.downloadLink) ? ' et dans les pièces jointes si disponibles.' : '.'}`
      : null,
    physicalItems.length === 0
      ? `Aucun article physique à livrer.`
      : `Articles à livrer : ${physicalItems.length}`,
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
          Nous avons bien reçu votre paiement. Voici votre reçu et la facture en pièce jointe.
        </p>
        ${digitalRentals.length ? `
          <div style="margin:12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;color:#111827;font-size:13px;line-height:1.5;">
            <strong>Locations numériques :</strong><br/>
            Accédez à vos livres loués dans votre profil e-Biblio (section « Mes locations numériques »).
          </div>` : ''}
        ${digitalPurchases.length ? `
          <div style="margin:12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;color:#111827;font-size:13px;line-height:1.5;">
            <strong>Livres numériques achetés :</strong><br/>
            Disponibles dans votre profil (section « Mes livres numériques »).${digitalPurchases.some(d => d.downloadLink) ? '<br/>Téléchargements en pièce jointe si fournis.' : ''}
          </div>` : ''}
        ${physicalItems.length === 0 ? `
          <div style="margin:12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fdf8f3;color:#7c2d12;font-size:13px;line-height:1.5;">
            Aucun article physique à livrer.
          </div>` : ''}
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
        <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">Statut : ${statusLabel[order.status] || order.status || 'payée'}</p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;">
        e-Biblio — Merci pour votre confiance.
      </div>
    </div>
  </div>
  `;

  let attachments = [];
  try {
    const pdf = await generateInvoicePdf(order);
    attachments.push({ filename: `facture_${order.orderNumber || order._id}.pdf`, path: pdf.filePath });
  } catch (err) {
    console.error('Invoice PDF generation failed (email fallback without PDF)', err);
  }

  // Ajouter les fichiers numériques achetés s'ils sont fournis via downloadLink (supposé chemin local ou URL)
  digitalPurchases.forEach((d) => {
    if (d.downloadLink) {
      attachments.push({
        filename: `${(d.title || 'ebook').replace(/\s+/g, '_')}.pdf`,
        path: d.downloadLink,
      });
    }
  });

  await mailer.sendMail({
    to: toEmail,
    from: EMAIL_FROM || EMAIL_USER,
    subject: `Votre commande e-Biblio #${order.orderNumber || order.numero} – Reçu`,
    text,
    html,
    attachments: attachments.length ? attachments : undefined,
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

app.use('/orders', invoiceRoute(authRequired));

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
  let { items = [], shippingAddress = {}, totalAmount, paymentMethod } = req.body;
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
          price: book?.price,
          rentPrice: book?.rentPrice,
        }
      });
    }

    const orderNumber = uuidv4().split('-')[0].toUpperCase();
    const now = new Date();
    const trackingNumber = generateTrackingNumber();
    const hasPhysical = enrichedItems.some((it) => !isDigitalItem(it));
    const eta = hasPhysical ? new Date(now.getTime() + DELIVER_AFTER_MS) : undefined;
    const order = await Order.create({
      userId: req.user.userId,
      items: enrichedItems,
      orderNumber,
      numero: orderNumber,
      customerEmail,
      totalAmount: typeof totalAmount === 'number' ? totalAmount : computedTotal,
      status: 'processing',
      paymentMethod: paymentMethod || 'stripe',
      shippingAddress,
      shippingTracking: {
        number: trackingNumber,
        carrier: hasPhysical ? 'eBiblio Logistics' : 'Digital',
        status: hasPhysical ? 'processing' : 'digital',
        eta,
        history: [
          { status: hasPhysical ? 'processing' : 'digital', message: 'Commande enregistrée', updatedAt: now }
        ]
      }
    });
    if (hasPhysical) {
      scheduleAutoProgress(order._id);
    }

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
      // Décaler l'email de statut de ~10s pour éviter l'envoi simultané avec la facture
      if (hasPhysical) {
        setTimeout(() => {
          sendStatusEmail(order, 'processing', 'Votre commande est en cours de traitement.').catch((errMail) =>
            console.error('Processing status email failed', errMail)
          );
        }, AUTO_STEP_MS);
      }
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

app.get('/orders/:id', authRequired, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    const isOwner = order.userId && order.userId.toString() === req.user.userId;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande' });
  }
});

app.get('/', (req, res) => res.json({ status: 'order-service ok' }));

app.listen(PORT, () => console.log(`order-service running on ${PORT}`));
