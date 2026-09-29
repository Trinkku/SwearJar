import { dayKeyOf, periodKeyOf, toDate } from './dates';
import { createId } from './id';
import type { Entry, ISOTimestamp, Member, PeriodKey, Settings } from './types';

export function isActive(entry: Entry): boolean {
  return entry.deletedAt === null;
}

export function isOpen(entry: Entry): boolean {
  return entry.deletedAt === null && entry.settlementId === null;
}

export function openEntries(entries: Entry[]): Entry[] {
  return entries.filter(isOpen);
}

export function entriesOfSettlement(entries: Entry[], settlementId: string): Entry[] {
  return entries.filter((entry) => isActive(entry) && entry.settlementId === settlementId);
}

export function entriesOfPeriod(entries: Entry[], periodKey: PeriodKey): Entry[] {
  return entries.filter((entry) => isActive(entry) && entry.periodKey === periodKey);
}

export function sumCents(entries: Entry[]): number {
  return entries.reduce((total, entry) => total + entry.amountCents, 0);
}

export function balanceCents(entries: Entry[]): number {
  return sumCents(openEntries(entries));
}

export function countInPeriod(entries: Entry[], periodKey: PeriodKey): number {
  return openEntries(entries).filter((entry) => entry.periodKey === periodKey).length;
}

export function sortNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function lastUndoableEntry(entries: Entry[]): Entry | null {
  return sortNewestFirst(openEntries(entries))[0] ?? null;
}

export function findUndoableEntry(entries: Entry[], id: string): Entry | null {
  return entries.find((entry) => entry.id === id && isOpen(entry)) ?? null;
}

export function createEntry(
  settings: Settings,
  purseId: string,
  userId: string,
  now: Date,
): Entry {
  return {
    id: createId(),
    purseId,
    userId,
    amountCents: settings.priceCents,
    currency: settings.currency,
    createdAt: now.toISOString(),
    deletedAt: null,
    settlementId: null,
    periodKey: periodKeyOf(now),
  };
}

export function markDeleted(entry: Entry, deletedAt: ISOTimestamp): Entry {
  return { ...entry, deletedAt };
}

export interface MemberTotal {
  member: Member;
  totalCents: number;
  count: number;
}

export function totalsByMember(entries: Entry[], members: Member[]): MemberTotal[] {
  const open = openEntries(entries);

  return members.map((member) => {
    const own = open.filter((entry) => entry.userId === member.id);
    return { member, totalCents: sumCents(own), count: own.length };
  });
}

export function memberNameOf(members: Member[], userId: string): string | null {
  return members.find((member) => member.id === userId)?.name ?? null;
}

export interface EntryDayGroup {
  dayKey: string;
  date: Date;
  totalCents: number;
  entries: Entry[];
}

export function groupEntriesByDay(entries: Entry[]): EntryDayGroup[] {
  const groups = new Map<string, Entry[]>();

  for (const entry of sortNewestFirst(entries)) {
    const key = dayKeyOf(toDate(entry.createdAt));
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dayKey, dayEntries]) => ({
      dayKey,
      date: toDate(dayEntries[0].createdAt),
      totalCents: sumCents(dayEntries),
      entries: dayEntries,
    }));
}
