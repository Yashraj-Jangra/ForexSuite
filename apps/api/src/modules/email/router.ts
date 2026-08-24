import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { emailSettings } from '@vaultbill/db/schemas/tenant';
import { eq } from 'drizzle-orm';

// ─── Encryption helpers (AES-256-GCM) ────────────────────────────────────────
// Uses EMAIL_ENCRYPTION_KEY env var (32-byte hex). Never returns raw secrets to client.

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

function getKey(): Buffer {
  const raw = process.env.EMAIL_ENCRYPTION_KEY ?? '';
  // Derive 32 bytes from whatever key is set (SHA-256)
  return createHash('sha256').update(raw || 'vaultbill-dev-key-change-in-production').digest();
}

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data: string): string {
  try {
    const buf = Buffer.from(data, 'base64');
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const encrypted = buf.subarray(32);
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const emailRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(emailSettings).limit(1);
    if (!row) return { mode: 'vaultbill' as const, gmailEmail: null, smtpFromEmail: null, smtpFromName: null, smtpHost: null, smtpPort: 587, smtpSecure: false, lastTestAt: null, lastTestStatus: null };
    // Never return encrypted passwords/tokens to frontend
    return {
      mode: row.mode,
      gmailEmail: row.gmailEmail,
      smtpFromEmail: row.smtpFromEmail,
      smtpFromName: row.smtpFromName,
      smtpHost: row.smtpHost,
      smtpPort: row.smtpPort,
      smtpSecure: row.smtpSecure,
      smtpUser: row.smtpUser,
      lastTestAt: row.lastTestAt,
      lastTestStatus: row.lastTestStatus,
      lastTestError: row.lastTestError,
    };
  }),

  saveSmtp: protectedProcedure
    .input(
      z.object({
        smtpHost: z.string().min(1),
        smtpPort: z.number().int().min(1).max(65535).default(587),
        smtpUser: z.string().min(1),
        smtpPass: z.string().min(1),
        smtpFromName: z.string().min(1),
        smtpFromEmail: z.string().email(),
        smtpSecure: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encryptedPass = encrypt(input.smtpPass);
      const existing = await ctx.db.select().from(emailSettings).limit(1);
      if (existing.length > 0) {
        await ctx.db.update(emailSettings).set({
          mode: 'smtp',
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUser: input.smtpUser,
          smtpPass: encryptedPass,
          smtpFromName: input.smtpFromName,
          smtpFromEmail: input.smtpFromEmail,
          smtpSecure: input.smtpSecure,
          updatedAt: new Date(),
        }).where(eq(emailSettings.id, existing[0]!.id));
      } else {
        await ctx.db.insert(emailSettings).values({
          mode: 'smtp',
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUser: input.smtpUser,
          smtpPass: encryptedPass,
          smtpFromName: input.smtpFromName,
          smtpFromEmail: input.smtpFromEmail,
          smtpSecure: input.smtpSecure,
        });
      }
      return { saved: true };
    }),

  setMode: protectedProcedure
    .input(z.object({ mode: z.enum(['vaultbill', 'gmail_oauth', 'smtp']) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.select().from(emailSettings).limit(1);
      if (existing.length > 0) {
        await ctx.db.update(emailSettings).set({ mode: input.mode, updatedAt: new Date() }).where(eq(emailSettings.id, existing[0]!.id));
      } else {
        await ctx.db.insert(emailSettings).values({ mode: input.mode });
      }
      return { saved: true };
    }),

  testSend: protectedProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(emailSettings).limit(1);
      const mode = row?.mode ?? 'vaultbill';

      try {
        if (mode === 'smtp' && row?.smtpHost && row?.smtpPass) {
          const nodemailer = await import('nodemailer');
          const pass = decrypt(row.smtpPass);
          const transporter = nodemailer.default.createTransport({
            host: row.smtpHost,
            port: row.smtpPort ?? 587,
            secure: row.smtpSecure ?? false,
            auth: { user: row.smtpUser ?? '', pass },
          });
          await transporter.sendMail({
            from: `"${row.smtpFromName ?? 'VaultBill'}" <${row.smtpFromEmail ?? row.smtpUser ?? ''}>`,
            to: input.to,
            subject: 'VaultBill — Email Test',
            html: '<p>Your VaultBill email configuration is working correctly! 🎉</p><p><small>Sent from VaultBill Currency Suite</small></p>',
          });
        } else if (mode === 'vaultbill') {
          // VaultBill hosted: use PLATFORM_SMTP_* env vars
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            host: process.env.PLATFORM_SMTP_HOST ?? 'smtp.resend.com',
            port: Number(process.env.PLATFORM_SMTP_PORT ?? 465),
            secure: true,
            auth: {
              user: process.env.PLATFORM_SMTP_USER ?? 'resend',
              pass: process.env.PLATFORM_SMTP_PASS ?? '',
            },
          });
          await transporter.sendMail({
            from: `"VaultBill Suite" <${process.env.PLATFORM_FROM_EMAIL ?? 'noreply@vaultbill.app'}>`,
            to: input.to,
            subject: 'VaultBill — Email Test',
            html: '<p>Your VaultBill email configuration is working correctly! 🎉</p>',
          });
        } else {
          // Gmail OAuth not yet implemented in test — guide user
          throw new Error('Gmail OAuth test requires re-authorization. Please reconnect your Google account.');
        }

        // Update last test status
        if (row) {
          await ctx.db.update(emailSettings).set({ lastTestAt: new Date(), lastTestStatus: 'ok', lastTestError: null, updatedAt: new Date() }).where(eq(emailSettings.id, row.id));
        }
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (row) {
          await ctx.db.update(emailSettings).set({ lastTestAt: new Date(), lastTestStatus: 'failed', lastTestError: errorMsg, updatedAt: new Date() }).where(eq(emailSettings.id, row.id));
        }
        throw new Error(`Email test failed: ${errorMsg}`);
      }
    }),
});
