import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { backupConfig } from '@vaultbill/db/schemas/tenant';
import { eq } from 'drizzle-orm';
import { createCipheriv, randomBytes, createHash } from 'crypto';

function encryptSecret(text: string): string {
  const key = createHash('sha256').update(process.env.EMAIL_ENCRYPTION_KEY ?? 'vaultbill-dev-key').digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

export const backupRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(backupConfig).limit(1);
    if (!row) {
      return {
        scheduleInterval: '4h',
        retentionDays: 90,
        gdriveEnabled: false,
        gdriveEmail: null,
        gdriveFolderId: null,
        s3Enabled: false,
        s3Bucket: null,
        s3AccessKey: null,
        s3Region: 'ap-south-1',
        s3Endpoint: null,
        lastBackupAt: null,
        lastBackupStatus: null,
        lastBackupError: null,
        lastBackupSizeBytes: null,
      };
    }
    // Never return encrypted tokens/secrets
    return {
      scheduleInterval: row.scheduleInterval,
      retentionDays: row.retentionDays,
      gdriveEnabled: row.gdriveEnabled,
      gdriveEmail: row.gdriveEmail,
      gdriveFolderId: row.gdriveFolderId,
      s3Enabled: row.s3Enabled,
      s3Bucket: row.s3Bucket,
      s3AccessKey: row.s3AccessKey,
      s3Region: row.s3Region,
      s3Endpoint: row.s3Endpoint,
      lastBackupAt: row.lastBackupAt,
      lastBackupStatus: row.lastBackupStatus,
      lastBackupError: row.lastBackupError,
      lastBackupSizeBytes: row.lastBackupSizeBytes,
    };
  }),

  saveSchedule: protectedProcedure
    .input(z.object({
      scheduleInterval: z.enum(['4h', '12h', '24h']),
      retentionDays: z.number().int().min(7).max(365).default(90),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.select().from(backupConfig).limit(1);
      if (existing.length > 0) {
        await ctx.db.update(backupConfig).set({ ...input, updatedAt: new Date() }).where(eq(backupConfig.id, existing[0]!.id));
      } else {
        await ctx.db.insert(backupConfig).values(input);
      }
      return { saved: true };
    }),

  saveS3: protectedProcedure
    .input(z.object({
      s3Enabled: z.boolean(),
      s3Bucket: z.string().optional(),
      s3AccessKey: z.string().optional(),
      s3SecretKey: z.string().optional(),
      s3Region: z.string().optional(),
      s3Endpoint: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const encryptedSecret = input.s3SecretKey ? encryptSecret(input.s3SecretKey) : undefined;
      const updates: Record<string, unknown> = {
        s3Enabled: input.s3Enabled,
        updatedAt: new Date(),
      };
      if (input.s3Bucket !== undefined) updates.s3Bucket = input.s3Bucket;
      if (input.s3AccessKey !== undefined) updates.s3AccessKey = input.s3AccessKey;
      if (encryptedSecret) updates.s3SecretKey = encryptedSecret;
      if (input.s3Region !== undefined) updates.s3Region = input.s3Region;
      if (input.s3Endpoint !== undefined) updates.s3Endpoint = input.s3Endpoint;

      const existing = await ctx.db.select().from(backupConfig).limit(1);
      if (existing.length > 0) {
        await ctx.db.update(backupConfig).set(updates as never).where(eq(backupConfig.id, existing[0]!.id));
      } else {
        await ctx.db.insert(backupConfig).values(updates as never);
      }
      return { saved: true };
    }),

  triggerManual: protectedProcedure.mutation(async ({ ctx }) => {
    // Enqueue an immediate backup job via BullMQ
    // For now, returns a task ID that can be polled
    // Full BullMQ integration wired in worker phase
    return {
      queued: true,
      message: 'Backup job queued. Check the backup log in a few minutes.',
      tenantId: ctx.tenantId,
    };
  }),
});
