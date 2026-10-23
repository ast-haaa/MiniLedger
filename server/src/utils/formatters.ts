import { Prisma } from '@prisma/client';

/**
 * Format a numeric value or Prisma Decimal to 2 decimal places.
 */
export function toDecimalString(val: number | string | Prisma.Decimal): string {
  const num = typeof val === 'number' ? val : parseFloat(val.toString());
  return num.toFixed(2);
}
