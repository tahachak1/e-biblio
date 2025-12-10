const {
  INVOICE_COMPANY_NAME = 'e-Biblio',
  INVOICE_COMPANY_ADDRESS = '123 Library Street, Montreal, QC',
  INVOICE_COMPANY_EMAIL = 'support@ebiblio.com',
  INVOICE_COMPANY_PHONE = '+1 (514) 555-0123',
  INVOICE_LOGO_URL = 'https://dummyimage.com/160x48/1d4ed8/ffffff&text=e-Biblio',
} = process.env;

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
});

const formatMoney = (value) => currencyFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const escapeHtml = (value = '') =>
  value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

module.exports = function generateInvoice(order = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price || item.book?.price || 0);
    const qty = Number(item.quantity || 1);
    return sum + price * qty;
  }, 0);

  const shipping = Number(order.shippingAmount || 0);
  const total = Number.isFinite(Number(order.totalAmount)) ? Number(order.totalAmount) : subtotal + shipping;
  const taxes = Math.max(0, Number((total - subtotal - shipping).toFixed(2)));

  const customerName = escapeHtml(order.shippingAddress?.name || 'Customer');
  const customerEmail = escapeHtml(order.shippingAddress?.email || order.customerEmail || '');
  const addressLines = [
    order.shippingAddress?.address,
    [order.shippingAddress?.city, order.shippingAddress?.postalCode].filter(Boolean).join(', '),
    order.shippingAddress?.country,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br/>');

  const rows =
    items
      .map((item) => {
        const title = escapeHtml(item.book?.title || item.title || 'Item');
        const qty = Number(item.quantity || 1);
        const unit = Number(item.price || item.book?.price || 0);
        const lineTotal = unit * qty;
        const isDigital = ['digital', 'ebook', 'digital-rent', 'location-numerique'].includes(item.type);
        const badge = isDigital ? '<span class="pill pill-blue">Numérique</span>' : '<span class="pill pill-gray">Physique</span>';
        return `
          <tr>
            <td class="item-name">${title} ${badge}</td>
            <td class="item-center">${qty}</td>
            <td class="item-right">${formatMoney(unit)}</td>
            <td class="item-right">${formatMoney(lineTotal)}</td>
          </tr>
        `;
      })
      .join('') ||
    `<tr><td class="item-empty" colspan="4">No items found</td></tr>`;

  const invoiceId = escapeHtml(order.orderNumber || order.numero || order._id || '');
  const paymentMethod = escapeHtml(order.paymentMethod || 'Paid');
  const status = escapeHtml(order.status || 'paid');
  const hasPhysical = items.some((it) => !['digital', 'ebook', 'digital-rent', 'location-numerique'].includes(it.type));
  const hasDigitalRent = items.some((it) => it.type === 'digital-rent' || it.type === 'location-numerique');
  const hasDigitalBuy = items.some((it) => it.type === 'digital' || it.type === 'ebook');

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f5f7fb;
          color: #0f172a;
        }
        .shell {
          width: 840px;
          margin: 32px auto;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid #e5e7eb;
        }
        .header {
          padding: 28px 32px;
          background: linear-gradient(120deg, #1d4ed8, #6366f1);
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand img {
          height: 50px;
          width: auto;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
        }
        .brand h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .invoice-meta {
          text-align: right;
        }
        .invoice-meta .label {
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1.2px;
          opacity: 0.85;
        }
        .invoice-meta .value {
          font-size: 20px;
          font-weight: 700;
        }
        .content {
          padding: 32px;
        }
        .section-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #475569;
          margin: 0 0 10px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 26px;
        }
        .info-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: linear-gradient(180deg, #f8fafc, #ffffff);
        }
        .info-card h3 {
          margin: 0 0 6px 0;
          font-size: 15px;
          color: #0f172a;
        }
        .info-card p {
          margin: 2px 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        thead {
          background: #0f172a;
          color: #ffffff;
        }
        th {
          padding: 14px 12px;
          text-align: left;
          font-size: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        td {
          padding: 12px 12px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
          color: #0f172a;
        }
        .item-name { font-weight: 600; }
        .item-center { text-align: center; color: #475569; }
        .item-right { text-align: right; color: #111827; }
        .item-empty { text-align: center; color: #94a3b8; padding: 18px 12px; }
        .totals {
          margin-top: 22px;
          width: 320px;
          margin-left: auto;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #f8fafc;
        }
        .totals table { margin: 0; }
        .totals td {
          padding: 10px 14px;
          border: none;
        }
        .totals .label { color: #475569; }
        .totals .grand {
          font-size: 18px;
          font-weight: 700;
          color: #1d4ed8;
          border-top: 1px solid #e5e7eb;
          background: #eef2ff;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 600;
          font-size: 12px;
        }
        .pill { display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:600; }
        .pill-blue { background:#e0e7ff;color:#1d4ed8; }
        .pill-gray { background:#e2e8f0;color:#475569; }
        .footer {
          margin-top: 32px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }
        .muted { color: #64748b; font-size: 14px; margin: 6px 0 0 0; }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="header">
          <div class="brand">
            <img src="${INVOICE_LOGO_URL}" alt="${INVOICE_COMPANY_NAME} logo" />
            <div>
              <h1>${escapeHtml(INVOICE_COMPANY_NAME)}</h1>
              <div class="muted">${escapeHtml(INVOICE_COMPANY_EMAIL)} • ${escapeHtml(INVOICE_COMPANY_PHONE)}</div>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="label">Invoice</div>
            <div class="value">#${invoiceId}</div>
            <div class="muted">Issued ${formatDate(order.createdAt || new Date())}</div>
            <div class="badge" style="margin-top:6px;">${status || 'paid'}</div>
          </div>
        </div>

        <div class="content">
          ${hasDigitalRent ? `
            <div style="margin:0 0 12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;color:#0f172a;font-size:13px;line-height:1.5;">
              <strong>Locations numériques :</strong> Retrouvez vos livres loués dans votre profil e-Biblio (section « Mes locations numériques »).
            </div>` : ''}
          ${hasDigitalBuy ? `
            <div style="margin:0 0 12px 0;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;color:#0f172a;font-size:13px;line-height:1.5;">
              <strong>Livres numériques achetés :</strong> Disponibles dans votre profil (section « Mes livres numériques »). Les liens de téléchargement sont indiqués dans l'email de paiement si fournis.
            </div>` : ''}
          ${!hasPhysical ? `
            <div style="margin:0 0 12px 0;padding:12px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.5;">
              Aucun article physique à livrer pour cette commande.
            </div>` : ''}
          <div class="info-grid">
            <div class="info-card">
              <p class="section-title" style="margin-bottom:4px;">Billed To</p>
              <h3>${customerName}</h3>
              <p>${addressLines || 'No address provided'}</p>
              ${customerEmail ? `<p>${customerEmail}</p>` : ''}
            </div>
            <div class="info-card">
              <p class="section-title" style="margin-bottom:4px;">Order</p>
              <p><strong>Order ID:</strong> ${invoiceId}</p>
              <p><strong>Payment:</strong> ${paymentMethod}</p>
              <p><strong>Date:</strong> ${formatDate(order.createdAt || new Date())}</p>
            </div>
          </div>

          <div>
            <p class="section-title">Items</p>
            <table>
              <thead>
                <tr>
                  <th style="width:50%;">Item</th>
                  <th style="width:10%;">Qty</th>
                  <th style="width:20%;">Price</th>
                  <th style="width:20%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td class="label">Subtotal</td>
                <td class="item-right">${formatMoney(subtotal)}</td>
              </tr>
              <tr>
                <td class="label">Taxes</td>
                <td class="item-right">${formatMoney(taxes)}</td>
              </tr>
              <tr>
                <td class="label">Shipping</td>
                <td class="item-right">${formatMoney(shipping)}</td>
              </tr>
              <tr class="grand">
                <td>Total</td>
                <td class="item-right">${formatMoney(total || subtotal)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            Thank you for your purchase. If you have any questions, contact ${escapeHtml(INVOICE_COMPANY_EMAIL)}.
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
};
