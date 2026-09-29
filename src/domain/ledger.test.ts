import { describe, expect, it } from 'vitest';

import {
  balanceCents,
  countInPeriod,
  createEntry,
  findUndoableEntry,
  groupEntriesByDay,
  lastUndoableEntry,
  markDeleted,
  memberNameOf,
  openEntries,
  sortNewestFirst,
  sumCents,
  totalsByMember,
} from './ledger';
import { DEFAULT_SETTINGS, type Entry, type Member } from './types';

const ANNA: Member = { id: 'anna', name: 'Anna' };
const BERTIL: Member = { id: 'bertil', name: 'Bertil' };

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    purseId: 'p1',
    userId: ANNA.id,
    amountCents: 20,
    currency: 'EUR',
    createdAt: '2026-09-28T10:00:00.000Z',
    deletedAt: null,
    settlementId: null,
    periodKey: '2026-09',
    ...overrides,
  };
}

describe('openEntries', () => {
  it('jättää pois kumotut ja tilitetyt', () => {
    const entries = [
      entry({ id: 'avoin' }),
      entry({ id: 'kumottu', deletedAt: '2026-09-28T11:00:00.000Z' }),
      entry({ id: 'tilitetty', settlementId: 's1' }),
    ];

    expect(openEntries(entries).map((e) => e.id)).toEqual(['avoin']);
  });
});

describe('balanceCents', () => {
  it('laskee saldon tapahtumista eikä talletetusta luvusta', () => {
    expect(balanceCents([entry({ id: 'a' }), entry({ id: 'b' })])).toBe(40);
  });

  it('on nolla tyhjällä listalla', () => {
    expect(balanceCents([])).toBe(0);
  });

  it('ei voi mennä negatiiviseksi, koska vähennettävää riviä ei ole', () => {
    const one = entry({ id: 'a' });
    expect(balanceCents([one])).toBe(20);

    const undone = markDeleted(one, '2026-09-28T11:00:00.000Z');
    expect(balanceCents([undone])).toBe(0);
  });

  it('sisältää myös aiempien kuukausien tilittämättömät', () => {
    const entries = [
      entry({ id: 'vanha', periodKey: '2026-08', createdAt: '2026-08-15T10:00:00.000Z' }),
      entry({ id: 'uusi' }),
    ];

    expect(balanceCents(entries)).toBe(40);
  });
});

describe('countInPeriod', () => {
  it('laskee vain kuluvan kauden tilittämättömät', () => {
    const entries = [
      entry({ id: 'a' }),
      entry({ id: 'b' }),
      entry({ id: 'vanha', periodKey: '2026-08' }),
      entry({ id: 'tilitetty', settlementId: 's1' }),
    ];

    expect(countInPeriod(entries, '2026-09')).toBe(2);
  });
});

describe('sortNewestFirst', () => {
  it('järjestää uusin ensin', () => {
    const entries = [
      entry({ id: 'vanha', createdAt: '2026-09-28T09:00:00.000Z' }),
      entry({ id: 'uusi', createdAt: '2026-09-28T12:00:00.000Z' }),
    ];

    expect(sortNewestFirst(entries).map((e) => e.id)).toEqual(['uusi', 'vanha']);
  });

  it('ratkaisee saman aikaleiman id:llä, jotta järjestys on deterministinen', () => {
    const a = entry({ id: 'aaa' });
    const b = entry({ id: 'bbb' });

    expect(sortNewestFirst([a, b]).map((e) => e.id)).toEqual(['bbb', 'aaa']);
    expect(sortNewestFirst([b, a]).map((e) => e.id)).toEqual(['bbb', 'aaa']);
  });

  it('ei muuta alkuperäistä listaa', () => {
    const entries = [
      entry({ id: 'vanha', createdAt: '2026-09-28T09:00:00.000Z' }),
      entry({ id: 'uusi', createdAt: '2026-09-28T12:00:00.000Z' }),
    ];
    sortNewestFirst(entries);

    expect(entries.map((e) => e.id)).toEqual(['vanha', 'uusi']);
  });
});

describe('lastUndoableEntry', () => {
  it('palauttaa viimeisimmän kassassa olevan', () => {
    const entries = [
      entry({ id: 'vanha', createdAt: '2026-09-28T09:00:00.000Z' }),
      entry({ id: 'uusi', createdAt: '2026-09-28T12:00:00.000Z' }),
    ];

    expect(lastUndoableEntry(entries)?.id).toBe('uusi');
  });

  it('ei tarjoa tilitettyä kumottavaksi, koska se on jo maksettu', () => {
    const entries = [
      entry({ id: 'tilitetty', createdAt: '2026-09-28T12:00:00.000Z', settlementId: 's1' }),
      entry({ id: 'avoin', createdAt: '2026-09-28T09:00:00.000Z' }),
    ];

    expect(lastUndoableEntry(entries)?.id).toBe('avoin');
  });

  it('palauttaa nullin kun kumottavaa ei ole', () => {
    expect(lastUndoableEntry([])).toBeNull();
  });
});

describe('findUndoableEntry', () => {
  it('kohdistuu täsmälleen pyydettyyn tapahtumaan', () => {
    const entries = [entry({ id: 'a' }), entry({ id: 'b' })];

    expect(findUndoableEntry(entries, 'a')?.id).toBe('a');
  });

  it('ei löydä jo kumottua', () => {
    const entries = [entry({ id: 'a', deletedAt: '2026-09-28T11:00:00.000Z' })];

    expect(findUndoableEntry(entries, 'a')).toBeNull();
  });
});

describe('markDeleted', () => {
  it('ei muuta alkuperäistä tapahtumaa', () => {
    const original = entry();
    const deleted = markDeleted(original, '2026-09-28T11:00:00.000Z');

    expect(original.deletedAt).toBeNull();
    expect(deleted.deletedAt).toBe('2026-09-28T11:00:00.000Z');
  });
});

describe('createEntry', () => {
  it('kopioi hinnan tapahtumaan, jottei hinnanmuutos kirjoita historiaa uudelleen', () => {
    const created = createEntry(
      { ...DEFAULT_SETTINGS, priceCents: 50 },
      'p1',
      ANNA.id,
      new Date('2026-09-28T10:00:00.000Z'),
    );

    expect(created.amountCents).toBe(50);
    expect(created.periodKey).toBe('2026-09');
    expect(created.deletedAt).toBeNull();
    expect(created.settlementId).toBeNull();
  });

  it('antaa jokaiselle tapahtumalle oman id:n', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    const a = createEntry(DEFAULT_SETTINGS, 'p1', ANNA.id, now);
    const b = createEntry(DEFAULT_SETTINGS, 'p1', ANNA.id, now);

    expect(a.id).not.toBe(b.id);
  });
});

describe('totalsByMember', () => {
  it('pitää jäsenen listassa myös nollasummalla', () => {
    const totals = totalsByMember([entry({ userId: ANNA.id })], [ANNA, BERTIL]);

    expect(totals.map((t) => [t.member.name, t.totalCents, t.count])).toEqual([
      ['Anna', 20, 1],
      ['Bertil', 0, 0],
    ]);
  });

  it('laskee vain kassassa olevan rahan', () => {
    const entries = [
      entry({ id: 'a', userId: ANNA.id }),
      entry({ id: 'b', userId: ANNA.id, settlementId: 's1' }),
    ];

    expect(totalsByMember(entries, [ANNA])[0].totalCents).toBe(20);
  });
});

describe('memberNameOf', () => {
  it('palauttaa nullin tuntemattomalle jäsenelle', () => {
    expect(memberNameOf([ANNA], 'bertil')).toBeNull();
    expect(memberNameOf([ANNA], 'anna')).toBe('Anna');
  });
});

describe('groupEntriesByDay', () => {
  it('ryhmittelee päiviin, uusin päivä ensin', () => {
    const entries = [
      entry({ id: 'ma', createdAt: '2026-09-28T10:00:00.000Z' }),
      entry({ id: 'ti', createdAt: '2026-09-29T10:00:00.000Z' }),
      entry({ id: 'ti2', createdAt: '2026-09-29T12:00:00.000Z' }),
    ];

    const groups = groupEntriesByDay(entries);

    expect(groups).toHaveLength(2);
    expect(groups[0].entries.map((e) => e.id)).toEqual(['ti2', 'ti']);
    expect(groups[0].totalCents).toBe(40);
    expect(groups[1].entries.map((e) => e.id)).toEqual(['ma']);
  });
});

describe('sumCents', () => {
  it('on nolla tyhjällä listalla', () => {
    expect(sumCents([])).toBe(0);
  });
});
