import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  bigint,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'deleted'
  plan: text('plan').notNull().default('pro'), // 'free' | 'starter' | 'pro' | 'enterprise'
  planExpiresAt: timestamp('plan_expires_at'),
  notes: text('notes'),
  suspendedAt: timestamp('suspended_at'),
  suspendedReason: text('suspended_reason'),
  deletedAt: timestamp('deleted_at'),
  customDomain: text('custom_domain'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('tenants_status_idx').on(table.status),
  slugIdx: index('tenants_slug_idx').on(table.slug),
}));

export const tenantMembers = pgTable('tenant_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id')
    .notNull(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  inviteStatus: text('invite_status').default('active'), // 'pending' | 'active' | 'revoked'
  inviteToken: text('invite_token'),
  inviteEmail: text('invite_email'),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantUserIdx: index('public_tenant_members_user_idx').on(table.tenantId, table.userId),
}));

// ─── Super Admin Platform Audit Log ──────────────────────────────────────────
export const platformAuditLog = pgTable('platform_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminUserId: text('admin_user_id').references(() => user.id),
  adminEmail: text('admin_email'),
  action: text('action').notNull(), // 'tenant.suspend' | 'tenant.activate' | 'tenant.impersonate' | 'user.ban' | 'flag.toggle' | 'smtp.save' | 'backup.trigger' | 'tenant.delete' | etc.
  targetType: text('target_type').notNull(), // 'tenant' | 'user' | 'system' | 'flag' | 'smtp' | 'backup'
  targetId: text('target_id'),
  payload: jsonb('payload'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  actionIdx: index('platform_audit_action_idx').on(table.action),
  targetIdx: index('platform_audit_target_idx').on(table.targetType, table.targetId),
  createdAtIdx: index('platform_audit_created_at_idx').on(table.createdAt),
}));

// ─── Feature Flags & Kill Switches ────────────────────────────────────────────
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  enabled: boolean('enabled').default(true).notNull(),
  isKillSwitch: boolean('is_kill_switch').default(false).notNull(),
  category: text('category').default('release').notNull(), // 'release' | 'kill_switch' | 'entitlement' | 'experiment'
  enabledTenants: jsonb('enabled_tenants').default([]).notNull(), // string[] of tenant IDs
  disabledTenants: jsonb('disabled_tenants').default([]).notNull(), // string[] of tenant IDs
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('feature_flags_key_idx').on(table.key),
}));

// ─── Platform Default SMTP Configuration ─────────────────────────────────────
export const platformSmtp = pgTable('platform_smtp', {
  id: uuid('id').primaryKey().defaultRandom(),
  host: text('host').notNull(),
  port: integer('port').default(587).notNull(),
  secure: boolean('secure').default(false).notNull(),
  username: text('username'),
  password: text('password'), // Encrypted AES-256-GCM
  fromName: text('from_name').notNull().default('VaultBill Suite'),
  fromEmail: text('from_email').notNull().default('noreply@vaultbill.app'),
  provider: text('provider').default('custom').notNull(), // 'custom' | 'resend' | 'postmark' | 'sendgrid' | 'ses'
  isActive: boolean('is_active').default(true).notNull(),
  lastTestAt: timestamp('last_test_at'),
  lastTestStatus: text('last_test_status'), // 'ok' | 'failed'
  lastTestError: text('last_test_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Platform Global Backup Orchestration ────────────────────────────────────
export const platformBackups = pgTable('platform_backups', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleInterval: text('schedule_interval').default('4h').notNull(),
  retentionDays: integer('retention_days').default(90).notNull(),
  storageProvider: text('storage_provider').default('local').notNull(), // 'local' | 's3' | 'gdrive'
  s3Bucket: text('s3_bucket'),
  s3Region: text('s3_region').default('ap-south-1'),
  s3Endpoint: text('s3_endpoint'),
  s3AccessKey: text('s3_access_key'),
  s3SecretKey: text('s3_secret_key'), // Encrypted AES-256-GCM
  gdriveFolderId: text('gdrive_folder_id'),
  gdriveEmail: text('gdrive_email'),
  gdriveTokens: text('gdrive_tokens'), // Encrypted AES-256-GCM
  lastBackupAt: timestamp('last_backup_at'),
  lastBackupStatus: text('last_backup_status'), // 'success' | 'failed'
  lastBackupError: text('last_backup_error'),
  lastBackupSizeBytes: bigint('last_backup_size_bytes', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});