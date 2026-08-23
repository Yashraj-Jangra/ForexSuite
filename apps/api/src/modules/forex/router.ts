import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { forexTransactions } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const PURCHASE_CATEGORIES = ['public', 'franchisee', 'ffmc_ad'] as const;
const SALE_CATEGORIES = ['btq', 'business', 'ffmc_ad'] as const;

async function getStatement(year: number, month: number) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const transactions = await db
    .select()
    .from(forexTransactions)
    .where(and(gte(forexTransactions.transactionDate, monthStart), lt(forexTransactions.transactionDate, nextMonth)))
    .orderBy(forexTransactions.transactionDate);

  const purchases = transactions.filter((t) => t.transactionType === 'purchase');
  const sales = transactions.filter((t) => t.transactionType === 'sale');

  const totalPurchase = purchases.reduce((s, t) => s + Number(t.amount), 0);
  const totalSale = sales.reduce((s, t) => s + Number(t.amount), 0);

  const categoryPurchases = PURCHASE_CATEGORIES.map((cat) => {
    const filtered = purchases.filter((t) => t.category === cat);
    return { category: cat, amount: filtered.reduce((s, t) => s + Number(t.amount), 0), count: filtered.length };
  });

  const categorySales = SALE_CATEGORIES.map((cat) => {
    const filtered = sales.filter((t) => t.category === cat);
    return { category: cat, amount: filtered.reduce((s, t) => s + Number(t.amount), 0), count: filtered.length };
  });

  const openingBalance = 0;
  const closingBalance = Math.round((openingBalance + totalPurchase - totalSale) * 100) / 100;

  return { month, year, openingBalance, purchases: { total: Math.round(totalPurchase * 100) / 100, byCategory: categoryPurchases, transactions: purchases }, sales: { total: Math.round(totalSale * 100) / 100, byCategory: categorySales, transactions: sales }, closingBalance, balanceEquation: { opening: openingBalance, purchases: Math.round(totalPurchase * 100) / 100, sales: Math.round(totalSale * 100) / 100, closing: closingBalance, isValid: true }, totalTransactions: transactions.length };
}

export const forexRouter = router({
  list: protectedProcedure.query(() =>
    db.select().from(forexTransactions).orderBy(desc(forexTransactions.transactionDate)),
  ),

  create: protectedProcedure
    .input(z.object({
      transactionDate: z.string(),
      currency: z.string().length(3),
      transactionType: z.enum(['purchase', 'sale']),
      category: z.string().min(1),
      amount: z.coerce.number().positive(),
      conversionRate: z.coerce.number().optional(),
      customerName: z.string().optional(),
      customerPassportKyc: z.string().optional(),
    }))
    .mutation(({ input }) =>
      db.insert(forexTransactions).values({
        transactionDate: input.transactionDate,
        currency: input.currency,
        transactionType: input.transactionType,
        category: input.category,
        amount: String(input.amount),
        conversionRate: input.conversionRate ? String(input.conversionRate) : null,
        customerName: input.customerName ?? null,
        customerPassportKyc: input.customerPassportKyc ?? null,
      }).returning().then((r) => r[0]),
    ),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ input }) =>
    db.delete(forexTransactions).where(eq(forexTransactions.id, input)),
  ),

  statement: protectedProcedure
    .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .query(async ({ input }) => getStatement(input.year, input.month)),

  exportExcel: protectedProcedure
    .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .query(async ({ input }) => {
      const data = await getStatement(input.year, input.month);

      const wb = XLSX.utils.book_new();
      const summaryRows = [
        ['FLM-8 Monthly Statement', `${input.year}-${String(input.month).padStart(2, '0')}`],
        [],
        ['Opening Balance', data.openingBalance],
        [],
        ['PURCHASES'],
        ['Category', 'Amount'],
        ...data.purchases.byCategory.map((c) => [c.category, c.amount]),
        ['Total Purchases', data.purchases.total],
        [],
        ['SALES'],
        ['Category', 'Amount'],
        ...data.sales.byCategory.map((c) => [c.category, c.amount]),
        ['Total Sales', data.sales.total],
        [],
        ['Closing Balance', data.closingBalance],
        ['Valid', data.balanceEquation.isValid ? 'YES' : 'NO'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, ws, 'FLM-8 Summary');

      const allTxs = [...data.purchases.transactions, ...data.sales.transactions];
      if (allTxs.length > 0) {
        const txRows = [
          ['Date', 'Type', 'Currency', 'Category', 'Amount', 'Rate', 'Customer'],
          ...allTxs.map((t) => [
            t.transactionDate, t.transactionType, t.currency, t.category,
            Number(t.amount).toFixed(2), t.conversionRate ?? '-', t.customerName ?? '-',
          ]),
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), 'Transactions');
      }

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { data: Buffer.from(buf).toString('base64'), filename: `FLM8_${input.year}_${String(input.month).padStart(2, '0')}.xlsx` };
    }),
});