import { router } from '../../trpc/context';
import { adminTenantsRouter } from './tenants';
import { adminUsersRouter } from './users';
import { adminSmtpRouter } from './smtp';
import { adminBackupsRouter } from './backups';
import { adminFlagsRouter } from './flags';
import { adminHealthRouter } from './health';
import { adminAuditRouter } from './audit';

export const adminRouter = router({
  tenants: adminTenantsRouter,
  users: adminUsersRouter,
  smtp: adminSmtpRouter,
  backups: adminBackupsRouter,
  flags: adminFlagsRouter,
  health: adminHealthRouter,
  audit: adminAuditRouter,
});
