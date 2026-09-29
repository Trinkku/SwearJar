import type { CurrencyCode } from './types';

interface CurrencyFormat {
  symbol: string;
  position: 'prefix' | 'suffix';
  label: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyFormat> = {
  EUR: { symbol: '€', position: 'suffix', label: 'Euro' },
  SEK: { symbol: 'kr', position: 'suffix', label: 'Ruotsin kruunu' },
  NOK: { symbol: 'kr', position: 'suffix', label: 'Norjan kruunu' },
  DKK: { symbol: 'kr', position: 'suffix', label: 'Tanskan kruunu' },
  GBP: { symbol: '£', position: 'prefix', label: 'Punta' },
  USD: { symbol: '$', position: 'prefix', label: 'Dollari' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

const NBSP = ' ';

function groupThousands(value: number): string {
  const digits = String(value);
  if (digits.length <= 4) return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function formatAmount(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const major = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, '0');
  return `${sign}${groupThousands(major)},${minor}`;
}

export function formatMoney(cents: number, currency: CurrencyCode): string {
  const format = CURRENCIES[currency] ?? CURRENCIES.EUR;
  const amount = formatAmount(cents);
  return format.position === 'suffix'
    ? `${amount}${NBSP}${format.symbol}`
    : `${format.symbol}${amount}`;
}

export function speakMoney(cents: number, currency: CurrencyCode): string {
  const abs = Math.abs(Math.round(cents));
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  const unit = currency === 'EUR' ? 'euroa' : CURRENCIES[currency].label.toLowerCase();
  const sub = currency === 'EUR' ? 'senttiä' : 'senttiä';
  if (minor === 0) return `${major} ${unit}`;
  return `${major} ${unit} ${minor} ${sub}`;
}

export function parseAmountToCents(input: string): number | null {
  const normalised = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d*\.?\d{0,2}$/.test(normalised) || normalised === '' || normalised === '.') {
    return null;
  }
  const cents = Math.round(Number(normalised) * 100);
  return Number.isFinite(cents) ? cents : null;
}
