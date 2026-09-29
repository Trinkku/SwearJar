export type ISOTimestamp = string;

export type PeriodKey = string;

export type CurrencyCode = 'EUR' | 'SEK' | 'NOK' | 'DKK' | 'GBP' | 'USD';

export interface Entry {
  id: string;
  purseId: string;
  userId: string;
  amountCents: number;
  currency: CurrencyCode;
  createdAt: ISOTimestamp;
  deletedAt: ISOTimestamp | null;
  settlementId: string | null;
  periodKey: PeriodKey;
}

export interface Settlement {
  id: string;
  purseId: string;
  periodKey: PeriodKey;
  totalCents: number;
  entryCount: number;
  currency: CurrencyCode;
  settledAt: ISOTimestamp;
  settledByUserId: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface Settings {
  priceCents: number;
  currency: CurrencyCode;
  settlementDay: number;
  appName: string;
}

export interface LedgerState {
  purseId: string;
  userId: string;
  members: Member[];
  entries: Entry[];
  settlements: Settlement[];
  settings: Settings;
}

export const LOCAL_PURSE_ID = 'local';
export const LOCAL_USER_ID = 'me';

export const DEFAULT_SETTINGS: Settings = {
  priceCents: 20,
  currency: 'EUR',
  settlementDay: 30,
  appName: 'Kiroilukassa',
};

export const MAX_MEMBERS = 4;

export function emptyLedgerState(): LedgerState {
  return {
    purseId: LOCAL_PURSE_ID,
    userId: LOCAL_USER_ID,
    members: [],
    entries: [],
    settlements: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
