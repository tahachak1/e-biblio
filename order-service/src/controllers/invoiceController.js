const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const generateInvoice = require('../utils/generateInvoice');

const invoicesDir = path.join(__dirname, '..', 'invoices');
fs.mkdirSync(invoicesDir, { recursive: true });

function asPlainOrder(orderDoc) {
  if (!orderDoc) return null;
  if (typeof orderDoc.toObject === 'function') {
    return orderDoc.toObject({ getters: false, virtuals: false });
  }
  return orderDoc;
}

async function generateInvoicePdf(req, res) {
  const { id } = req.params;
  try {
    const Order = mongoose.model('Order');
    const orderDoc = await Order.findById(id);
    if (!orderDoc) return res.status(404).json({ message: 'Commande introuvable' });

    const order = asPlainOrder(orderDoc);
    const ownerId = order.userId?.toString ? order.userId.toString() : String(order.userId || '');
    if (req.user?.role !== 'admin' && ownerId && ownerId !== req.user?.userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const html = generateInvoice(order);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (launchErr) {
      console.error('Puppeteer launch failed', launchErr);
      return res.status(500).json({ message: 'Génération PDF indisponible' });
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('screen');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '24mm', right: '16mm', bottom: '24mm', left: '16mm' },
      });

      const fileName = `order_${order._id}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      try {
        fs.writeFileSync(filePath, pdfBuffer);
      } catch (writeErr) {
        console.error('Failed to persist invoice file', writeErr);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(pdfBuffer);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (err) {
    console.error('Failed to generate invoice', err);
    return res.status(500).json({ message: 'Erreur lors de la génération de la facture' });
  }
}

module.exports = {
  generateInvoice: generateInvoicePdf,
};
