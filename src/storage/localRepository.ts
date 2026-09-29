import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_SETTINGS,
  emptyLedgerState,
  type Entry,
  type LedgerState,
  type Member,
  type Settings,
  type Settlement,
} from '../domain/types';
import type { LedgerRepository } from './repository';

const STORAGE_KEY = 'kiroilukassa.ledger.v1';
const CORRUPT_BACKUP_KEY = 'kiroilukassa.ledger.corrupt';
const SCHEMA_VERSION = 2;

interface StoredLedger extends LedgerState {
  schemaVersion: number;
}

export class LocalLedgerRepository implements LedgerRepository {
  private state: LedgerState = emptyLedgerState();

  async load(): Promise<LedgerState> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      this.state = emptyLedgerState();
      return this.snapshot();
    }

    try {
      this.state = parseStored(raw);
    } catch {
      await AsyncStorage.setItem(CORRUPT_BACKUP_KEY, raw).catch(() => undefined);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
      this.state = emptyLedgerState();
    }

    return this.snapshot();
  }

  async addEntry(entry: Entry): Promise<void> {
    this.state = { ...this.state, entries: [...this.state.entries, entry] };
    await this.persist();
  }

  async updateEntries(updated: Entry[]): Promise<void> {
    const byId = new Map(updated.map((entry) => [entry.id, entry]));
    this.state = {
      ...this.state,
      entries: this.state.entries.map((entry) => byId.get(entry.id) ?? entry),
    };
    await this.persist();
  }

  async addSettlement(settlement: Settlement, closedEntries: Entry[]): Promise<void> {
    const byId = new Map(closedEntries.map((entry) => [entry.id, entry]));
    this.state = {
      ...this.state,
      entries: this.state.entries.map((entry) => byId.get(entry.id) ?? entry),
      settlements: [...this.state.settlements, settlement],
    };
    await this.persist();
  }

  async saveSettings(settings: Settings): Promise<void> {
    this.state = { ...this.state, settings };
    await this.persist();
  }

  async saveMembers(members: Member[]): Promise<void> {
    this.state = { ...this.state, members };
    await this.persist();
  }

  private snapshot(): LedgerState {
    return {
      ...this.state,
      members: [...this.state.members],
      entries: [...this.state.entries],
      settlements: [...this.state.settlements],
      settings: { ...this.state.settings },
    };
  }

  private async persist(): Promise<void> {
    const payload: StoredLedger = { schemaVersion: SCHEMA_VERSION, ...this.state };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}

function parseStored(raw: string): LedgerState {
  const parsed = JSON.parse(raw) as Partial<StoredLedger>;
  const version = parsed.schemaVersion;

  if (typeof version !== 'number' || version < 1 || version > SCHEMA_VERSION) {
    throw new Error(`Tuntematon schemaVersion: ${String(version)}`);
  }
  if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.settlements)) {
    throw new Error('Tallennuksesta puuttuu entries tai settlements');
  }

  const base = emptyLedgerState();
  const userId = parsed.userId ?? base.userId;

  return {
    purseId: parsed.purseId ?? base.purseId,
    userId,
    members: Array.isArray(parsed.members)
      ? (parsed.members as Member[])
      : [{ id: userId, name: 'Minä' }],
    entries: parsed.entries as Entry[],
    settlements: parsed.settlements as Settlement[],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  };
}
