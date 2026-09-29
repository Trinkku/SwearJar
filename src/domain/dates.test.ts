import { describe, expect, it } from 'vitest';

import {
  dayKeyOf,
  formatDate,
  formatPeriod,
  formatTime,
  formatWeekdayDate,
  isSameDay,
  lastDayOfMonth,
  monthNameGenitive,
  nextSettlementDate,
  parsePeriodKey,
  periodKeyOf,
  settlementDateFor,
} from './dates';

describe('periodKeyOf', () => {
  it('nollaa kuukauden kaksinumeroiseksi, jotta merkkijonovertailu järjestää oikein', () => {
    expect(periodKeyOf(new Date(2026, 0, 15))).toBe('2026-01');
    expect(periodKeyOf(new Date(2026, 8, 15))).toBe('2026-09');
    expect(periodKeyOf(new Date(2026, 11, 15))).toBe('2026-12');
  });

  it('järjestyy oikein pelkällä merkkijonovertailulla', () => {
    const keys = ['2026-10', '2026-02', '2025-12'].sort();
    expect(keys).toEqual(['2025-12', '2026-02', '2026-10']);
  });
});

describe('parsePeriodKey', () => {
  it('on periodKeyOf:n käänteisfunktio', () => {
    expect(parsePeriodKey('2026-09')).toEqual({ year: 2026, month: 9 });
  });
});

describe('formatPeriod', () => {
  it('kirjoittaa kuukauden nimen ja vuoden', () => {
    expect(formatPeriod('2026-09')).toBe('Syyskuu 2026');
  });
});

describe('monthNameGenitive', () => {
  it('antaa genetiivin otsikkoon "Syyskuun saldo"', () => {
    expect(monthNameGenitive(9)).toBe('syyskuun');
  });

  it('palauttaa tyhjän tuntemattomalle kuukaudelle', () => {
    expect(monthNameGenitive(13)).toBe('');
  });
});

describe('lastDayOfMonth', () => {
  it('tietää kuukausien pituudet', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
    expect(lastDayOfMonth(2026, 4)).toBe(30);
  });

  it('tietää karkausvuoden helmikuun', () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
    expect(lastDayOfMonth(2028, 2)).toBe(29);
  });
});

describe('settlementDateFor', () => {
  it('rajaa tilityspäivän kuukauden viimeiseen päivään', () => {
    const helmikuu = settlementDateFor(2026, 2, 31);

    expect(helmikuu.getMonth()).toBe(1);
    expect(helmikuu.getDate()).toBe(28);
  });

  it('rajaa karkausvuonna 29. päivään', () => {
    expect(settlementDateFor(2028, 2, 31).getDate()).toBe(29);
  });

  it('palauttaa vuorokauden viimeisen hetken, jottei tilityspäivä itse ole myöhässä', () => {
    const date = settlementDateFor(2026, 9, 30);

    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
    expect(date.getSeconds()).toBe(59);
  });

  it('rajaa myös nollan ja negatiivisen päivän kuukauden ensimmäiseen', () => {
    expect(settlementDateFor(2026, 9, 0).getDate()).toBe(1);
  });
});

describe('nextSettlementDate', () => {
  it('palauttaa kuluvan kuun päivän kun se on vielä tulossa', () => {
    const next = nextSettlementDate(new Date(2026, 8, 15), 30);

    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(30);
  });

  it('pitää tilityspäivän vielä samana päivänä', () => {
    const next = nextSettlementDate(new Date(2026, 8, 30, 12), 30);

    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(30);
  });

  it('siirtyy seuraavaan kuuhun kun päivä on ohitettu', () => {
    const next = nextSettlementDate(new Date(2026, 8, 30, 23, 59, 59, 999), 15);

    expect(next.getMonth()).toBe(9);
    expect(next.getDate()).toBe(15);
  });

  it('vaihtaa vuoden joulukuusta tammikuuhun', () => {
    const next = nextSettlementDate(new Date(2026, 11, 31, 12), 15);

    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(15);
  });
});

describe('dayKeyOf', () => {
  it('nollaa päivän ja kuukauden, jotta ryhmittelyavain järjestyy', () => {
    expect(dayKeyOf(new Date(2026, 8, 5))).toBe('2026-09-05');
  });
});

describe('isSameDay', () => {
  it('vertaa vain päivää, ei kellonaikaa', () => {
    expect(isSameDay(new Date(2026, 8, 28, 1), new Date(2026, 8, 28, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 28), new Date(2026, 8, 29))).toBe(false);
  });
});

describe('suomalainen muotoilu', () => {
  it('kirjoittaa päivämäärän ilman etunollia', () => {
    expect(formatDate(new Date(2026, 8, 5))).toBe('5.9.2026');
  });

  it('kirjoittaa viikonpäivän päivämäärän eteen', () => {
    expect(formatWeekdayDate(new Date(2026, 8, 28))).toBe('Maanantai 28.9.2026');
  });

  it('kirjoittaa kellonajan pisteellä ja kaksinumeroisin minuutein', () => {
    expect(formatTime(new Date(2026, 8, 28, 14, 32))).toBe('14.32');
    expect(formatTime(new Date(2026, 8, 28, 9, 5))).toBe('9.05');
  });
});
