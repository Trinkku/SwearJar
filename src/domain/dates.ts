import type { ISOTimestamp, PeriodKey } from './types';

const MONTHS_NOMINATIVE = [
  'Tammikuu',
  'Helmikuu',
  'Maaliskuu',
  'Huhtikuu',
  'Toukokuu',
  'Kesäkuu',
  'Heinäkuu',
  'Elokuu',
  'Syyskuu',
  'Lokakuu',
  'Marraskuu',
  'Joulukuu',
];

const WEEKDAYS = [
  'Sunnuntai',
  'Maanantai',
  'Tiistai',
  'Keskiviikko',
  'Torstai',
  'Perjantai',
  'Lauantai',
];

export function monthName(month: number): string {
  return MONTHS_NOMINATIVE[month - 1] ?? '';
}

export function monthNameGenitive(month: number): string {
  const name = monthName(month);
  return name ? `${name.toLowerCase()}n` : '';
}

export function periodKeyOf(date: Date): PeriodKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parsePeriodKey(key: PeriodKey): { year: number; month: number } {
  const [year, month] = key.split('-');
  return { year: Number(year), month: Number(month) };
}

export function formatPeriod(key: PeriodKey): string {
  const { year, month } = parsePeriodKey(key);
  return `${monthName(month)} ${year}`;
}

export function formatPeriodUpper(key: PeriodKey): string {
  return formatPeriod(key).toUpperCase();
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDate(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${formatDate(date)}`;
}

export function formatTime(date: Date): string {
  return `${date.getHours()}.${String(date.getMinutes()).padStart(2, '0')}`;
}

export function dayKeyOf(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function toDate(timestamp: ISOTimestamp): Date {
  return new Date(timestamp);
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKeyOf(a) === dayKeyOf(b);
}

export function settlementDateFor(year: number, month: number, day: number): Date {
  const clamped = Math.min(Math.max(day, 1), lastDayOfMonth(year, month));
  return new Date(year, month - 1, clamped, 23, 59, 59, 999);
}

export function nextSettlementDate(now: Date, settlementDay: number): Date {
  const thisMonth = settlementDateFor(now.getFullYear(), now.getMonth() + 1, settlementDay);
  if (now.getTime() <= thisMonth.getTime()) return thisMonth;

  const rollsOver = now.getMonth() === 11;
  const year = rollsOver ? now.getFullYear() + 1 : now.getFullYear();
  const month = rollsOver ? 1 : now.getMonth() + 2;
  return settlementDateFor(year, month, settlementDay);
}
