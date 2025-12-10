function formatStatus(type = 'general') {
  const map = {
    promo: { label: 'Offre spéciale', color: '#0ea5e9' },
    rappel: { label: 'Rappel', color: '#f59e0b' },
    urgent: { label: 'Urgent', color: '#ef4444' },
    general: { label: 'Information', color: '#6366f1' },
  };
  return map[type] || map.general;
}

function buildNotificationEmail({ title, message, type = 'general', ctaLabel, ctaUrl }) {
  const status = formatStatus(type);
  const safeMessage = message || '';
  const safeTitle = title || 'Notification';

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { margin:0; background:#f6f7fb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#0f172a; }
        .shell { max-width: 640px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 18px 45px rgba(15,23,42,0.12); border:1px solid #e5e7eb; }
        .hero { padding:24px 28px; background:linear-gradient(135deg, #1d4ed8, ${status.color}); color:#ffffff; }
        .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:999px; background:rgba(255,255,255,0.12); font-weight:600; font-size:12px; letter-spacing:0.4px; text-transform:uppercase; }
        .content { padding:28px; }
        .title { font-size:22px; margin:0 0 10px 0; }
        .text { font-size:15px; line-height:1.7; color:#334155; margin:0 0 18px 0; white-space:pre-line; }
        .card { padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; margin:16px 0; }
        .cta { display:inline-block; padding:12px 18px; background:${status.color}; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700; letter-spacing:0.2px; }
        .footer { padding:20px 28px 26px; border-top:1px solid #e2e8f0; font-size:13px; color:#64748b; text-align:center; background:#f8fafc; }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="hero">
          <div class="badge">${status.label}</div>
          <h1 class="title">${safeTitle}</h1>
          <div style="opacity:0.9;font-size:14px;">Merci de votre confiance. Voici les dernières informations importantes.</div>
        </div>
        <div class="content">
          <p class="text">${safeMessage}</p>
          ${ctaUrl ? `<div style="margin:18px 0;"><a class="cta" href="${ctaUrl}" target="_blank" rel="noreferrer">${ctaLabel || 'Voir les détails'}</a></div>` : ''}
          <div class="card">
            <div style="font-weight:600;color:#0f172a;margin-bottom:6px;">Pourquoi ce message ?</div>
            <div style="font-size:14px;color:#475569;">Vous recevez cette notification car vous avez une activité en cours sur e-Biblio.</div>
          </div>
        </div>
        <div class="footer">
          e-Biblio · Ne pas répondre à cet email. Pour toute question : support@ebiblio.com
        </div>
      </div>
    </body>
  </html>
  `;
}

module.exports = { buildNotificationEmail };
