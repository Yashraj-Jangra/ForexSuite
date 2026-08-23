import { router, protectedProcedure } from '../../trpc/context';
import { currencies } from '@vaultbill/db/schemas/tenant';

export const currencyRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.select().from(currencies).orderBy(currencies.code),
  ),
});
