import { sendEmail, sendTelegram, sendWhatsApp } from './sender';
import { invoiceEmailHtml, reminderEmailHtml, femaAlertEmailHtml } from '@vaultbill/pdf/email';

export type SendInvoicePayload = { type: 'send_invoice'; to: string; channel: 'email' | 'whatsapp' | 'telegram'; data: { invoiceNumber: string; customerName: string; total: string; currency: string; dueAt?: string; customerEmail?: string; chatId?: string } };
export type SendReminderPayload = { type: 'send_reminder'; to: string; channel: 'email' | 'telegram'; data: { invoiceNumber: string; customerName: string; total: string; currency: string; daysOverdue: number; customerEmail?: string; chatId?: string } };
export type FemaAlertPayload = { type: 'fema_alert'; to: string; channel: 'email' | 'telegram'; data: { invoiceNumber: string; customerName: string; daysSince: number; status: string; customerEmail?: string; chatId?: string } };
export type NotificationPayload = SendInvoicePayload | SendReminderPayload | FemaAlertPayload;

export async function sendNotification(payload: NotificationPayload) {
  switch (payload.type) {
    case 'send_invoice': {
      const html = invoiceEmailHtml(payload.data);
      if (payload.channel === 'email') return sendEmail({ to: payload.to, subject: `Invoice ${payload.data.invoiceNumber} from VaultBill`, html });
      if (payload.channel === 'whatsapp') return sendWhatsApp({ to: payload.to, templateName: 'invoice_ready', variables: { invoiceNumber: payload.data.invoiceNumber, total: `${payload.data.currency} ${payload.data.total}` } });
      if (payload.channel === 'telegram') return sendTelegram({ chatId: payload.to, text: `🧾 Invoice *${payload.data.invoiceNumber}*\nTotal: ${payload.data.currency} ${payload.data.total}\nCustomer: ${payload.data.customerName}` });
      break;
    }
    case 'send_reminder': {
      const html = reminderEmailHtml(payload.data);
      if (payload.channel === 'email') return sendEmail({ to: payload.to, subject: `Payment reminder — ${payload.data.invoiceNumber}`, html });
      if (payload.channel === 'telegram') return sendTelegram({ chatId: payload.to, text: `⚠️ *Payment Reminder*\nInvoice ${payload.data.invoiceNumber} is ${payload.data.daysOverdue} days overdue.\nTotal: ${payload.data.currency} ${payload.data.total}` });
      break;
    }
    case 'fema_alert': {
      const html = femaAlertEmailHtml(payload.data);
      if (payload.channel === 'email') return sendEmail({ to: payload.to, subject: `FEMA Alert — ${payload.data.invoiceNumber} at ${payload.data.daysSince} days`, html });
      if (payload.channel === 'telegram') return sendTelegram({ chatId: payload.to, text: `🚨 *FEMA Alert*\nInvoice ${payload.data.invoiceNumber} for ${payload.data.customerName}\n${payload.data.daysSince} days since export — ${payload.data.status.toUpperCase()}` });
      break;
    }
  }
}