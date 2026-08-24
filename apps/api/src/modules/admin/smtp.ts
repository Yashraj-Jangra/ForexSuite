import { z } from 'zod';
import { router, superAdminProcedure } from '../../trpc/context';
import { platformSmtp } from '@vaultbill/db/schemas/public';
import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

function getKey(): Buffer {
  const raw = process.env.EMAIL_ENCRYPTION_KEY ?? '';
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

export const adminSmtpRouter = router({
  get: superAdminProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.publicDb.select().from(platformSmtp).limit(1);

    if (!row) {
      return {
        configured: false,
        host: process.env.PLATFORM_SMTP_HOST ?? 'smtp.resend.com',
        port: Number(process.env.PLATFORM_SMTP_PORT ?? 465),
        secure: true,
        username: process.env.PLATFORM_SMTP_USER ?? 'resend',
        fromName: 'VaultBill Suite',
        fromEmail: process.env.PLATFORM_FROM_EMAIL ?? 'noreply@vaultbill.app',
        provider: 'resend',
        isActive: true,
        lastTestAt: null,
        lastTestStatus: null,
        lastTestError: null,
      };
    }

    return {
      configured: true,
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      provider: row.provider,
      isActive: row.isActive,
      lastTestAt: row.lastTestAt,
      lastTestStatus: row.lastTestStatus,
      lastTestError: row.lastTestError,
    };
  }),

  save: superAdminProcedure
    .input(
      z.object({
        host: z.string().min(1, 'Host is required'),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean().default(false),
        username: z.string().optional().nullable(),
        password: z.string().optional().nullable(),
        fromName: z.string().min(1, 'Sender name is required'),
        fromEmail: z.string().email('Valid sender email required'),
        provider: z.enum(['custom', 'resend', 'postmark', 'sendgrid', 'ses']).default('custom'),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.publicDb.select().from(platformSmtp).limit(1);

      let encryptedPass: string | undefined = undefined;
      if (input.password) {
        encryptedPass = encrypt(input.password);
      }

      const updates: any = {
        host: input.host,
        port: input.port,
        secure: input.secure,
        username: input.username ?? null,
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        provider: input.provider,
        isActive: input.isActive,
        updatedAt: new Date(),
      };

      if (encryptedPass !== undefined) {
        updates.password = encryptedPass;
      }

      let savedRecord;
      if (existing.length > 0) {
        const [updated] = await ctx.publicDb
          .update(platformSmtp)
          .set(updates)
          .where(eq(platformSmtp.id, existing[0]!.id))
          .returning();
        savedRecord = updated;
      } else {
        const [created] = await ctx.publicDb
          .insert(platformSmtp)
          .values({
            ...updates,
            password: encryptedPass ?? '',
          })
          .returning();
        savedRecord = created;
      }

      await ctx.logAdminAction('platform_smtp.save', 'smtp', savedRecord?.id, {
        host: input.host,
        port: input.port,
        fromEmail: input.fromEmail,
        provider: input.provider,
      });

      return { success: true };
    }),

  test: superAdminProcedure
    .input(z.object({ to: z.string().email('Valid recipient email required') }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.publicDb.select().from(platformSmtp).limit(1);

      const startTime = Date.now();

      try {
        const nodemailer = await import('nodemailer');
        let transporter;

        if (row && row.host) {
          const pass = row.password ? decrypt(row.password) : (process.env.PLATFORM_SMTP_PASS ?? '');
          transporter = nodemailer.default.createTransport({
            host: row.host,
            port: row.port,
            secure: row.secure,
            auth: row.username ? { user: row.username, pass } : undefined,
          });

          await transporter.sendMail({
            from: `"${row.fromName}" <${row.fromEmail}>`,
            to: input.to,
            subject: '👑 VaultBill — Super Admin SMTP Diagnostic Test',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a; margin-top: 0;">Super Admin SMTP Verification</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  This is an automated test from the <strong>VaultBill Platform Super Admin Control Plane</strong>.
                </p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; font-family: monospace; color: #334155; margin: 16px 0;">
                  <div>Host: ${row.host}:${row.port}</div>
                  <div>Provider: ${row.provider}</div>
                  <div>Sender: ${row.fromEmail}</div>
                  <div>Timestamp: ${new Date().toISOString()}</div>
                </div>
                <p style="color: #10b981; font-weight: bold; font-size: 14px;">
                  ✓ Platform default email delivery is operating nominally.
                </p>
              </div>
            `,
          });
        } else {
          // Fallback to env platform settings
          transporter = nodemailer.default.createTransport({
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
            subject: '👑 VaultBill — Super Admin SMTP Diagnostic Test',
            html: '<p>Platform SMTP test from env configuration succeeded!</p>',
          });
        }

        const durationMs = Date.now() - startTime;

        if (row) {
          await ctx.publicDb
            .update(platformSmtp)
            .set({
              lastTestAt: new Date(),
              lastTestStatus: 'ok',
              lastTestError: null,
              updatedAt: new Date(),
            })
            .where(eq(platformSmtp.id, row.id));
        }

        await ctx.logAdminAction('platform_smtp.test_send', 'smtp', row?.id, {
          recipient: input.to,
          status: 'success',
          latencyMs: durationMs,
        });

        return {
          success: true,
          latencyMs: durationMs,
          message: `Test email sent to ${input.to} in ${durationMs}ms`,
        };
      } catch (err: any) {
        const errorMsg = err?.message || String(err);

        if (row) {
          await ctx.publicDb
            .update(platformSmtp)
            .set({
              lastTestAt: new Date(),
              lastTestStatus: 'failed',
              lastTestError: errorMsg,
              updatedAt: new Date(),
            })
            .where(eq(platformSmtp.id, row.id));
        }

        await ctx.logAdminAction('platform_smtp.test_send', 'smtp', row?.id, {
          recipient: input.to,
          status: 'failed',
          error: errorMsg,
        });

        throw new Error(`SMTP Test Failed: ${errorMsg}`);
      }
    }),
});
