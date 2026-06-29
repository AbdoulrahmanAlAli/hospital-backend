import { nanoid } from 'nanoid';

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-${y}${m}${d}-${nanoid(8).toUpperCase()}`;
};
