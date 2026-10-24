/**
 * Finance configuration (not data). Payment method ids must match the
 * payment_method / method check constraints in database/schema.sql.
 * Edit account numbers and fees to match your real merchant accounts.
 */
export const PAYMENT_METHODS = [
  {
    id: 'CASH',
    name: 'Cash',
    accountNumber: 'Front Desk',
    feePercent: 0,
    type: 'Cash',
    color: '#10B981',
    description: 'Over-the-counter cash received at gym reception',
  },
  {
    id: 'bKASH',
    name: 'bKash',
    accountNumber: 'Merchant account',
    feePercent: 1.2,
    type: 'Mobile Financial Service (MFS)',
    color: '#D12053',
    description: 'bKash QR code and merchant payment',
  },
  {
    id: 'NAGAD',
    name: 'Nagad',
    accountNumber: 'Merchant account',
    feePercent: 1.0,
    type: 'Mobile Financial Service (MFS)',
    color: '#F7931E',
    description: 'Nagad digital wallet collection',
  },
  {
    id: 'ROCKET',
    name: 'Rocket (DBBL)',
    accountNumber: 'Merchant account',
    feePercent: 1.1,
    type: 'Mobile Financial Service (MFS)',
    color: '#8C3494',
    description: 'Dutch-Bangla Bank Rocket mobile payment',
  },
  {
    id: 'CARD',
    name: 'Card (POS)',
    accountNumber: 'POS terminal',
    feePercent: 1.5,
    type: 'POS Terminal',
    color: '#0EA5E9',
    description: 'Front desk VISA / Mastercard swipe',
  },
  {
    id: 'BANK',
    name: 'Bank Transfer',
    accountNumber: 'Bank account',
    feePercent: 0,
    type: 'Direct Bank Transfer',
    color: '#2563EB',
    description: 'Direct bank wire transfer',
  },
];

export const EXPENSE_CATEGORIES = [
  'Rent & Facility Lease',
  'Salaries & Trainer Payouts',
  'Electricity & Utilities',
  'Equipment & Maintenance',
  'Cleaning & Sanitation',
  'Marketing & Advertising',
  'Supplements & Inventory',
  'Miscellaneous & Administration',
];
