import { nextSettlementDate, periodKeyOf, settlementDateFor } from './dates';
import { createId } from './id';
import { openEntries, sumCents } from './ledger';
import type { Entry, PeriodKey, Settings, Settlement } from './types';

export function isSettlementDue(
  entries: Entry[],
  settings: Settings,
  now: Date,
): boolean {
  const open = openEntries(entries);
  if (open.length === 0) return false;

  const dueThisMonth = settlementDateFor(
    now.getFullYear(),
    now.getMonth() + 1,
    settings.settlementDay,
  );
  if (now.getTime() > dueThisMonth.getTime()) return true;

  const currentPeriod = periodKeyOf(now);
  return open.some((entry) => entry.periodKey < currentPeriod);
}

export function upcomingSettlementDate(settings: Settings, now: Date): Date {
  return nextSettlementDate(now, settings.settlementDay);
}

export interface SettlementPreview {
  periodKey: PeriodKey;
  totalCents: number;
  entryCount: number;
  entryIds: string[];
}

export function previewSettlement(entries: Entry[], now: Date): SettlementPreview {
  const open = openEntries(entries);
  const periods = open.map((entry) => entry.periodKey).sort();

  return {
    periodKey: periods[0] ?? periodKeyOf(now),
    totalCents: sumCents(open),
    entryCount: open.length,
    entryIds: open.map((entry) => entry.id),
  };
}

export interface SettlementResult {
  settlement: Settlement;
  closedEntries: Entry[];
}

export function settle(
  state: { entries: Entry[]; purseId: string; userId: string; settings: Settings },
  now: Date,
): SettlementResult | null {
  const preview = previewSettlement(state.entries, now);
  if (preview.entryCount === 0) return null;

  const settlement: Settlement = {
    id: createId(),
    purseId: state.purseId,
    periodKey: preview.periodKey,
    totalCents: preview.totalCents,
    entryCount: preview.entryCount,
    currency: state.settings.currency,
    settledAt: now.toISOString(),
    settledByUserId: state.userId,
  };

  const closing = new Set(preview.entryIds);
  const closedEntries = state.entries
    .filter((entry) => closing.has(entry.id))
    .map((entry) => ({ ...entry, settlementId: settlement.id }));

  return { settlement, closedEntries };
}

export function sortSettlementsNewestFirst(settlements: Settlement[]): Settlement[] {
  return [...settlements].sort((a, b) => (a.settledAt < b.settledAt ? 1 : -1));
}
