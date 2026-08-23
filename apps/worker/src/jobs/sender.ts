import { Resend } from 'resend';

let resend: Resend | null = null;

export function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    resend = new Resend(key);
  }
  return resend;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const client = getResend();
  if (!client) {
    console.warn('Resend not configured — skipping email');
    return { sent: false, reason: 'no_api_key' };
  }
  const { data, error } = await client.emails.send({
    from: process.env.EMAIL_FROM ?? 'VaultBill <notifications@vaultbill.app>',
    to,
    subject,
    html,
  });
  if (error) throw error;
  return { sent: true, id: data?.id };
}

export async function sendTelegram({ chatId, text }: { chatId: string; text: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('Telegram bot not configured — skipping');
    return { sent: false, reason: 'no_bot_token' };
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const json = await res.json() as { ok?: boolean; description?: string };
  if (!json.ok) throw new Error(json.description);
  return { sent: true };
}

export async function sendWhatsApp({ to, templateName, variables }: { to: string; templateName: string; variables: Record<string, string> }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn('WhatsApp not configured — skipping');
    return { sent: false, reason: 'not_configured' };
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to,
      type: 'template',
      template: { name: templateName, language: { code: 'en' }, components: [{ type: 'body', parameters: Object.entries(variables).map(([, v]) => ({ type: 'text', text: v })) }] },
    }),
  });
  const json = await res.json() as { error?: { message?: string }; messages?: { id?: string }[] };
  if (json.error) throw new Error(json.error.message);
}