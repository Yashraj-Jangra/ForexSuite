import { z } from 'zod';

export const currencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  symbol: z.string(),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
});

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(2),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

export type Currency = z.infer<typeof currencySchema>;
export type Customer = z.infer<typeof customerSchema>;