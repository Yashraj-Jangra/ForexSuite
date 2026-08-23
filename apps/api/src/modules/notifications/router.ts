import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { sendNotification } from './queue';

export const notificationRouter = router({
  sendInvoice: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email().optional(),
      total: z.string(),
      currency: z.string(),
      dueAt: z.string().optional(),
      channel: z.enum(['email', 'whatsapp', 'telegram']),
      recipient: z.string(),
    }))
    .mutation(async ({ input }) => {
      await sendNotification('send_invoice', {
        to: input.recipient, channel: input.channel,
        data: { invoiceNumber: input.invoiceNumber, customerName: input.customerName, total: input.total, currency: input.currency, dueAt: input.dueAt, customerEmail: input.customerEmail },
      });
      return { queued: true, channel: input.channel };
    }),

  sendReminder: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string(), customerName: z.string(), customerEmail: z.string().email().optional(),
      total: z.string(), currency: z.string(), daysOverdue: z.number(),
      channel: z.enum(['email', 'telegram']), recipient: z.string(),
    }))
    .mutation(async ({ input }) => {
      await sendNotification('send_reminder', { to: input.recipient, channel: input.channel, data: input });
      return { queued: true };
    }),

  femaAlert: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string(), customerName: z.string(), customerEmail: z.string().email().optional(),
      daysSince: z.number(), status: z.enum(['warning', 'critical']),
      channel: z.enum(['email', 'telegram']), recipient: z.string(),
    }))
    .mutation(async ({ input }) => {
      await sendNotification('fema_alert', { to: input.recipient, channel: input.channel, data: input });
      return { queued: true };
    }),
});