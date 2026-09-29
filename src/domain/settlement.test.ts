import { describe, expect, it } from 'vitest';

import {
  isSettlementDue,
  previewSettlement,
  settle,
  sortSettlementsNewestFirst,
  upcomingSettlementDate,
} from './settlement';
import { DEFAULT_SETTINGS, type Entry, type Settlement } from './types';

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    purseId: 'p1',
    userId: 'anna',
    amountCents: 20,
    currency: 'EUR',
    createdAt: '2026-09-28T10:00:00.000Z',
    deletedAt: null,
    settlementId: null,
    periodKey: '2026-09',
    ...overrides,
  };
}

function stateWith(entries: Entry[]) {
  return { entries, purseId: 'p1', userId: 'anna', settings: DEFAULT_SETTINGS };
}

describe('previewSettlement', () => {
  it('kattaa kaiken kassassa olevan rahan', () => {
    const preview = previewSettlement(
      [entry({ id: 'a' }), entry({ id: 'b' })],
      new Date(2026, 8, 30),
    );

    expect(preview.totalCents).toBe(40);
    expect(preview.entryCount).toBe(2);
  });

  it('otsikoidaan vanhimmalla avoimella kuukaudella, koska se on rästissä', () => {
    const preview = previewSettlement(
      [entry({ id: 'uusi', periodKey: '2026-09' }), entry({ id: 'vanha', periodKey: '2026-07' })],
      new Date(2026, 8, 30),
    );

    expect(preview.periodKey).toBe('2026-07');
  });

  it('käyttää kuluvaa kuuta kun kassa on tyhjä', () => {
    const preview = previewSettlement([], new Date(2026, 8, 30));

    expect(preview.periodKey).toBe('2026-09');
    expect(preview.entryCount).toBe(0);
  });

  it('ei ota mukaan kumottuja eikä jo tilitettyjä', () => {
    const preview = previewSettlement(
      [
        entry({ id: 'avoin' }),
        entry({ id: 'kumottu', deletedAt: '2026-09-28T11:00:00.000Z' }),
        entry({ id: 'tilitetty', settlementId: 's1' }),
      ],
      new Date(2026, 8, 30),
    );

    expect(preview.entryIds).toEqual(['avoin']);
  });
});

describe('settle', () => {
  it('palauttaa nullin kun kassassa ei ole mitään kuitattavaa', () => {
    expect(settle(stateWith([]), new Date(2026, 8, 30))).toBeNull();
  });

  it('palauttaa nullin kun kaikki on jo tilitetty', () => {
    const entries = [entry({ settlementId: 's1' })];

    expect(settle(stateWith(entries), new Date(2026, 8, 30))).toBeNull();
  });

  it('sitoo tapahtumat tilitykseen poistamatta niitä', () => {
    const result = settle(
      stateWith([entry({ id: 'a' }), entry({ id: 'b' })]),
      new Date(2026, 8, 30),
    );

    expect(result).not.toBeNull();
    expect(result?.closedEntries).toHaveLength(2);
    for (const closed of result!.closedEntries) {
      expect(closed.settlementId).toBe(result!.settlement.id);
      expect(closed.deletedAt).toBeNull();
    }
  });

  it('kirjaa summan, lukumäärän ja valuutan tilitykseen', () => {
    const result = settle(
      stateWith([entry({ id: 'a' }), entry({ id: 'b' })]),
      new Date(2026, 8, 30),
    );

    expect(result?.settlement.totalCents).toBe(40);
    expect(result?.settlement.entryCount).toBe(2);
    expect(result?.settlement.currency).toBe('EUR');
    expect(result?.settlement.purseId).toBe('p1');
  });

  it('ei muuta alkuperäisiä tapahtumia', () => {
    const original = entry({ id: 'a' });
    settle(stateWith([original]), new Date(2026, 8, 30));

    expect(original.settlementId).toBeNull();
  });

  it('tilittää myös aiemmilta kuilta jääneen rahan kerralla', () => {
    const result = settle(
      stateWith([
        entry({ id: 'heinakuu', periodKey: '2026-07' }),
        entry({ id: 'syyskuu', periodKey: '2026-09' }),
      ]),
      new Date(2026, 8, 30),
    );

    expect(result?.settlement.entryCount).toBe(2);
    expect(result?.settlement.periodKey).toBe('2026-07');
  });
});

describe('isSettlementDue', () => {
  const settings = { ...DEFAULT_SETTINGS, settlementDay: 30 };

  it('ei ole myöhässä kun kassa on tyhjä', () => {
    expect(isSettlementDue([], settings, new Date(2026, 9, 15))).toBe(false);
  });

  it('ei ole myöhässä kun tilityspäivä on vielä tulossa', () => {
    expect(isSettlementDue([entry()], settings, new Date(2026, 8, 15))).toBe(false);
  });

  it('ei ole myöhässä vielä tilityspäivänä', () => {
    expect(isSettlementDue([entry()], settings, new Date(2026, 8, 30, 12))).toBe(false);
  });

  it('on myöhässä kun tilityspäivä on ohitettu', () => {
    const lokakuu = [entry({ periodKey: '2026-10' })];

    expect(isSettlementDue(lokakuu, settings, new Date(2026, 9, 31, 12))).toBe(true);
  });

  it('on myöhässä kun aiemmalta kuulta on jäänyt rahaa, vaikka päivä ei ole ohi', () => {
    const vanha = [entry({ periodKey: '2026-09' })];

    expect(isSettlementDue(vanha, settings, new Date(2026, 9, 1))).toBe(true);
  });

  it('ei ota kumottuja huomioon', () => {
    const kumottu = [entry({ deletedAt: '2026-09-28T11:00:00.000Z' })];

    expect(isSettlementDue(kumottu, settings, new Date(2026, 9, 15))).toBe(false);
  });
});

describe('upcomingSettlementDate', () => {
  it('käyttää asetusten tilityspäivää', () => {
    const next = upcomingSettlementDate(
      { ...DEFAULT_SETTINGS, settlementDay: 5 },
      new Date(2026, 8, 1),
    );

    expect(next.getDate()).toBe(5);
    expect(next.getMonth()).toBe(8);
  });
});

function settlement(id: string, settledAt: string): Settlement {
  return {
    id,
    purseId: 'p1',
    periodKey: '2026-09',
    totalCents: 40,
    entryCount: 2,
    currency: 'EUR',
    settledAt,
    settledByUserId: 'anna',
  };
}

describe('sortSettlementsNewestFirst', () => {
  it('järjestää uusin ensin', () => {
    const settlements = [
      settlement('elokuu', '2026-08-30T10:00:00.000Z'),
      settlement('syyskuu', '2026-09-30T10:00:00.000Z'),
    ];

    expect(sortSettlementsNewestFirst(settlements).map((s) => s.id)).toEqual([
      'syyskuu',
      'elokuu',
    ]);
  });
});
