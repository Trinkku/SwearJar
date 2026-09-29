import type { Entry, LedgerState, Member, Settings, Settlement } from '../domain/types';

export interface LedgerRepository {
  load(): Promise<LedgerState>;

  addEntry(entry: Entry): Promise<void>;

  updateEntries(entries: Entry[]): Promise<void>;

  addSettlement(settlement: Settlement, closedEntries: Entry[]): Promise<void>;

  saveSettings(settings: Settings): Promise<void>;

  saveMembers(members: Member[]): Promise<void>;

  subscribe?(onRemoteChange: (state: LedgerState) => void): () => void;
}
