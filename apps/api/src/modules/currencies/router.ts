import { router, protectedProcedure } from '../../trpc/context';
import { currencies } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';

export const currencyRouter = router({
  list: protectedProcedure.query(() =>
    db.select().from(currencies).orderBy(currencies.code),
  ),
});