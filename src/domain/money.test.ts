import { describe, expect, it } from 'vitest';

import {
  formatAmount,
  formatMoney,
  parseAmountToCents,
  speakMoney,
} from './money';

const NBSP = '\u00a0';

describe('formatAmount', () => {
  it('näyttää aina kaksi desimaalia', () => {
    expect(formatAmount(0)).toBe('0,00');
    expect(formatAmount(5)).toBe('0,05');
    expect(formatAmount(50)).toBe('0,50');
    expect(formatAmount(880)).toBe('8,80');
  });

  it('käyttää pilkkua desimaalierottimena', () => {
    expect(formatAmount(1234)).toBe('12,34');
  });

  it('säilyttää miinusmerkin', () => {
    expect(formatAmount(-880)).toBe('-8,80');
  });

  it('ryhmittelee vasta viisinumeroiset kokonaisosat', () => {
    expect(formatAmount(123400)).toBe('1234,00');
    expect(formatAmount(1234500)).toBe(`12${NBSP}345,00`);
    expect(formatAmount(123456700)).toBe(`1${NBSP}234${NBSP}567,00`);
  });

  it('pyöristää murto-osasentit kokonaisiksi', () => {
    expect(formatAmount(880.4)).toBe('8,80');
    expect(formatAmount(880.5)).toBe('8,81');
  });
});

describe('formatMoney', () => {
  it('asettaa pohjoismaiset symbolit perään sitovalla välilyönnillä', () => {
    expect(formatMoney(880, 'EUR')).toBe(`8,80${NBSP}€`);
    expect(formatMoney(880, 'SEK')).toBe(`8,80${NBSP}kr`);
  });

  it('asettaa punnan ja dollarin eteen ilman välilyöntiä', () => {
    expect(formatMoney(880, 'GBP')).toBe('£8,80');
    expect(formatMoney(880, 'USD')).toBe('$8,80');
  });
});

describe('speakMoney', () => {
  it('jättää sentit pois kun niitä ei ole', () => {
    expect(speakMoney(800, 'EUR')).toBe('8 euroa');
  });

  it('lukee sentit erikseen', () => {
    expect(speakMoney(880, 'EUR')).toBe('8 euroa 80 senttiä');
  });

  it('käyttää muun valuutan nimeä perusmuodossa', () => {
    expect(speakMoney(800, 'SEK')).toBe('8 ruotsin kruunu');
  });
});

describe('parseAmountToCents', () => {
  it('hyväksyy sekä pilkun että pisteen', () => {
    expect(parseAmountToCents('8,80')).toBe(880);
    expect(parseAmountToCents('8.80')).toBe(880);
  });

  it('sivuuttaa välilyönnit myös tuhaterottimena', () => {
    expect(parseAmountToCents('  8,80  ')).toBe(880);
    expect(parseAmountToCents('1 000')).toBe(100000);
  });

  it('hyväksyy kokonaisluvut ja nollan', () => {
    expect(parseAmountToCents('5')).toBe(500);
    expect(parseAmountToCents('0')).toBe(0);
  });

  it('hylkää kelvottoman syötteen nullilla', () => {
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('.')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('-5')).toBeNull();
  });

  it('hylkää yli kaksi desimaalia, koska sentti on pienin yksikkö', () => {
    expect(parseAmountToCents('8,805')).toBeNull();
  });
});
