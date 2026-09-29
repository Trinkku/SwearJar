import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createEntry,
  findUndoableEntry,
  lastUndoableEntry,
  markDeleted,
} from '../domain/ledger';
import { createId } from '../domain/id';
import { settle } from '../domain/settlement';
import {
  emptyLedgerState,
  type Entry,
  type LedgerState,
  type Member,
  type Settings,
} from '../domain/types';
import { isSupabaseConfigured } from '../lib/supabase';
import { LocalLedgerRepository } from '../storage/localRepository';
import type { LedgerRepository } from '../storage/repository';
import { SupabaseLedgerRepository } from '../storage/supabaseRepository';

export type LedgerStatus = 'loading' | 'ready';

interface LedgerContextValue {
  state: LedgerState;
  status: LedgerStatus;
  saveError: string | null;
  clearSaveError: () => void;

  addSwear: (memberId: string) => Promise<Entry | null>;
  undoEntry: (entryId: string) => Promise<number | null>;
  undoLast: () => Promise<number | null>;
  settleNow: () => Promise<number | null>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  saveMembers: (members: Member[]) => Promise<void>;

  isShared: boolean;
  inviteCode: string | null;
  deviceCount: number | null;
  maxDevices: number | null;
  createKassa: (appName: string, memberNames: string[]) => Promise<void>;
  joinKassa: (code: string) => Promise<void>;
  rotateCode: () => Promise<void>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

const SAVE_ERROR_MESSAGE = 'Tallennus epäonnistui';

export function LedgerProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: LedgerRepository;
}) {
  const repoRef = useRef<LedgerRepository>(
    repository ??
      (isSupabaseConfigured ? new SupabaseLedgerRepository() : new LocalLedgerRepository()),
  );
  const [state, setState] = useState<LedgerState>(emptyLedgerState);
  const [status, setStatus] = useState<LedgerStatus>('loading');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);

  const remote =
    repoRef.current instanceof SupabaseLedgerRepository ? repoRef.current : null;

  const syncShareInfo = useCallback(async (): Promise<void> => {
    if (remote === null || remote.inviteCode === null) {
      setInviteCode(null);
      setDeviceCount(null);
      return;
    }

    setInviteCode(remote.inviteCode);
    try {
      setDeviceCount(await remote.countDevices());
    } catch {
      setDeviceCount(null);
    }
  }, [remote]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await repoRef.current.load();
        if (!cancelled) {
          setState(loaded);
          await syncShareInfo();
        }
      } catch {
        if (!cancelled) setState(emptyLedgerState());
      } finally {
        if (!cancelled) setStatus('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syncShareInfo]);

  useEffect(() => {
    if (state.purseId === '' || repoRef.current.subscribe === undefined) return;
    return repoRef.current.subscribe(setState);
  }, [state.purseId]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const persist = useCallback(async (write: () => Promise<void>): Promise<boolean> => {
    try {
      await write();
      setSaveError(null);
      return true;
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
      return false;
    }
  }, []);

  const addSwear = useCallback(
    async (memberId: string): Promise<Entry | null> => {
      const entry = createEntry(state.settings, state.purseId, memberId, new Date());
      setState((current) => ({ ...current, entries: [...current.entries, entry] }));
      await persist(() => repoRef.current.addEntry(entry));
      return entry;
    },
    [persist, state.purseId, state.settings],
  );

  const removeEntry = useCallback(
    async (target: Entry | null): Promise<number | null> => {
      if (target === null) return null;

      const deleted = markDeleted(target, new Date().toISOString());
      setState((current) => ({
        ...current,
        entries: current.entries.map((entry) =>
          entry.id === deleted.id ? deleted : entry,
        ),
      }));
      await persist(() => repoRef.current.updateEntries([deleted]));
      return deleted.amountCents;
    },
    [persist],
  );

  const undoEntry = useCallback(
    (entryId: string) => removeEntry(findUndoableEntry(state.entries, entryId)),
    [removeEntry, state.entries],
  );

  const undoLast = useCallback(
    () => removeEntry(lastUndoableEntry(state.entries)),
    [removeEntry, state.entries],
  );

  const settleNow = useCallback(async (): Promise<number | null> => {
    const result = settle(state, new Date());
    if (result === null) return null;

    const closedById = new Map(result.closedEntries.map((entry) => [entry.id, entry]));
    setState((current) => ({
      ...current,
      entries: current.entries.map((entry) => closedById.get(entry.id) ?? entry),
      settlements: [...current.settlements, result.settlement],
    }));
    await persist(() =>
      repoRef.current.addSettlement(result.settlement, result.closedEntries),
    );
    return result.settlement.totalCents;
  }, [persist, state]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>): Promise<void> => {
      const next = { ...state.settings, ...patch };
      setState((current) => ({ ...current, settings: next }));
      await persist(() => repoRef.current.saveSettings(next));
    },
    [persist, state.settings],
  );

  const saveMembers = useCallback(
    async (members: Member[]): Promise<void> => {
      setState((current) => ({ ...current, members }));
      await persist(() => repoRef.current.saveMembers(members));
    },
    [persist],
  );

  const createKassa = useCallback(
    async (appName: string, memberNames: string[]): Promise<void> => {
      if (remote !== null) {
        const created = await remote.createPurse(appName, memberNames);
        setState(created);
        await syncShareInfo();
        return;
      }

      const members: Member[] = memberNames.map((name) => ({ id: createId(), name }));
      await saveMembers(members);
    },
    [remote, saveMembers, syncShareInfo],
  );

  const joinKassa = useCallback(
    async (code: string): Promise<void> => {
      if (remote === null) {
        throw new Error('Kutsukoodilla liittyminen vaatii Supabase-yhteyden');
      }
      const joined = await remote.joinPurse(code);
      setState(joined);
      await syncShareInfo();
    },
    [remote, syncShareInfo],
  );

  const rotateCode = useCallback(async (): Promise<void> => {
    if (remote === null) {
      throw new Error('Kutsukoodin vaihto vaatii Supabase-yhteyden');
    }
    await remote.rotateInviteCode();
    await syncShareInfo();
  }, [remote, syncShareInfo]);

  const value = useMemo(
    () => ({
      state,
      status,
      saveError,
      clearSaveError,
      addSwear,
      undoEntry,
      undoLast,
      settleNow,
      updateSettings,
      saveMembers,
      isShared: remote !== null,
      inviteCode,
      deviceCount,
      maxDevices: remote?.maxDevices ?? null,
      createKassa,
      joinKassa,
      rotateCode,
    }),
    [
      state,
      status,
      saveError,
      clearSaveError,
      addSwear,
      undoEntry,
      undoLast,
      settleNow,
      updateSettings,
      saveMembers,
      remote,
      inviteCode,
      deviceCount,
      createKassa,
      joinKassa,
      rotateCode,
    ],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const context = useContext(LedgerContext);
  if (context === null) {
    throw new Error('useLedger vaatii LedgerProviderin');
  }
  return context;
}
