// Vercel serverless function (Node.js runtime, CommonJS — no build step needed).
// Receives a contact-form submission and relays it to kai@k2istudio.com via Resend.
// The Resend API key lives only in the RESEND_API_KEY Vercel env var, never client-side.

const TO_EMAIL = 'kai@k2istudio.com';
const FROM_EMAIL = 'K2I Studio <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 5000;

const escapeHtml = (value) =>
  String(value || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: "Service d'envoi non configuré." });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body && typeof body === 'object' ? body : {};

  // Honeypot: bots that fill this hidden field get a fake success, no email sent.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const {
    prenom, nom, email, entreprise, tel, ville,
    service, budget, message, source,
  } = body;

  if (!prenom || !nom || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (typeof message !== 'string' || message.length > MAX_LEN) {
    return res.status(400).json({ error: 'Message invalide.' });
  }

  const rows = [
    ['Prénom', prenom], ['Nom', nom], ['Email', email],
    ['Entreprise', entreprise], ['Téléphone', tel], ['Ville', ville],
    ['Service', service], ['Budget', budget],
  ].filter(([, v]) => v);

  const html = `
    <div style="font-family: sans-serif; font-size: 15px; color: #16151a;">
      <h2 style="margin: 0 0 1rem;">Nouvelle demande — ${escapeHtml(source || 'site K2I Studio')}</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="font-weight: 600; padding-right: 1rem; vertical-align: top;">${escapeHtml(k)}</td>
            <td>${escapeHtml(v)}</td>
          </tr>`).join('')}
      </table>
      <p style="font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.25rem;">Message</p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Nouvelle demande — ${prenom} ${nom}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error', resendRes.status, errText);
      return res.status(502).json({ error: "Échec de l'envoi. Réessayez plus tard." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend request failed', err);
    return res.status(502).json({ error: "Échec de l'envoi. Réessayez plus tard." });
  }
};
