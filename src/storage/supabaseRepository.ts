import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import type {
  CurrencyCode,
  Entry,
  LedgerState,
  Member,
  Settings,
  Settlement,
} from '../domain/types';
import { ensureSession, getSupabase } from '../lib/supabase';
import type { LedgerRepository } from './repository';

interface PurseRow {
  id: string;
  app_name: string;
  invite_code: string;
  price_cents: number;
  currency: string;
  settlement_day: number;
  max_devices: number;
}

interface MemberRow {
  id: string;
  purse_id: string;
  name: string;
  sort_order: number;
}

interface EntryRow {
  id: string;
  purse_id: string;
  member_id: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  deleted_at: string | null;
  settlement_id: string | null;
  period_key: string;
}

interface SettlementRow {
  id: string;
  purse_id: string;
  period_key: string;
  total_cents: number;
  entry_count: number;
  currency: string;
  settled_at: string;
  settled_by: string | null;
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    purseId: row.purse_id,
    userId: row.member_id,
    amountCents: row.amount_cents,
    currency: row.currency as CurrencyCode,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    settlementId: row.settlement_id,
    periodKey: row.period_key,
  };
}

function toEntryRow(entry: Entry): EntryRow {
  return {
    id: entry.id,
    purse_id: entry.purseId,
    member_id: entry.userId,
    amount_cents: entry.amountCents,
    currency: entry.currency,
    created_at: entry.createdAt,
    deleted_at: entry.deletedAt,
    settlement_id: entry.settlementId,
    period_key: entry.periodKey,
  };
}

function toSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    purseId: row.purse_id,
    periodKey: row.period_key,
    totalCents: row.total_cents,
    entryCount: row.entry_count,
    currency: row.currency as CurrencyCode,
    settledAt: row.settled_at,
    settledByUserId: row.settled_by ?? '',
  };
}

function toSettings(purse: PurseRow): Settings {
  return {
    priceCents: purse.price_cents,
    currency: purse.currency as CurrencyCode,
    settlementDay: purse.settlement_day,
    appName: purse.app_name,
  };
}

export class SupabaseLedgerRepository implements LedgerRepository {
  private readonly supabase: SupabaseClient;
  private purse: PurseRow | null = null;
  private userId = '';
  private channel: RealtimeChannel | null = null;

  constructor(supabase: SupabaseClient = getSupabase()) {
    this.supabase = supabase;
  }

  get inviteCode(): string | null {
    return this.purse?.invite_code ?? null;
  }

  get maxDevices(): number | null {
    return this.purse?.max_devices ?? null;
  }

  async load(): Promise<LedgerState> {
    this.userId = await ensureSession();

    const { data, error } = await this.supabase.rpc('my_purse').maybeSingle();
    if (error) throw error;

    const row = data as PurseRow | null;
    this.purse = row?.id ? row : null;
    if (this.purse === null) {
      return this.emptyRemoteState();
    }

    return this.fetchState();
  }

  async createPurse(appName: string, memberNames: string[]): Promise<LedgerState> {
    this.userId = await ensureSession();

    const { data, error } = await this.supabase
      .rpc('create_purse', { app_name: appName, member_names: memberNames })
      .single();
    if (error) throw error;

    this.purse = data as PurseRow;
    return this.fetchState();
  }

  async joinPurse(code: string): Promise<LedgerState> {
    this.userId = await ensureSession();

    const { data, error } = await this.supabase
      .rpc('join_purse', { code })
      .single();
    if (error) throw error;

    this.purse = data as PurseRow;
    return this.fetchState();
  }

  async rotateInviteCode(): Promise<string> {
    const { data, error } = await this.supabase.rpc('rotate_invite_code').single();
    if (error) throw error;

    this.purse = data as PurseRow;
    return this.purse.invite_code;
  }

  async countDevices(): Promise<number> {
    const purse = this.requirePurse();

    const { count, error } = await this.supabase
      .from('purse_access')
      .select('user_id', { count: 'exact', head: true })
      .eq('purse_id', purse.id);
    if (error) throw error;

    return count ?? 0;
  }

  async addEntry(entry: Entry): Promise<void> {
    const { error } = await this.supabase
      .from('entries')
      .insert(toEntryRow({ ...entry, purseId: this.requirePurse().id }));
    if (error) throw error;
  }

  async updateEntries(entries: Entry[]): Promise<void> {
    const purseId = this.requirePurse().id;
    const { error } = await this.supabase
      .from('entries')
      .upsert(entries.map((entry) => toEntryRow({ ...entry, purseId })));
    if (error) throw error;
  }

  async addSettlement(settlement: Settlement, closedEntries: Entry[]): Promise<void> {
    const purseId = this.requirePurse().id;

    const { error: settlementError } = await this.supabase.from('settlements').insert({
      id: settlement.id,
      purse_id: purseId,
      period_key: settlement.periodKey,
      total_cents: settlement.totalCents,
      entry_count: settlement.entryCount,
      currency: settlement.currency,
      settled_at: settlement.settledAt,
      settled_by: null,
    });
    if (settlementError) throw settlementError;

    await this.updateEntries(closedEntries);
  }

  async saveSettings(settings: Settings): Promise<void> {
    const purse = this.requirePurse();
    const { error } = await this.supabase
      .from('purses')
      .update({
        app_name: settings.appName,
        price_cents: settings.priceCents,
        currency: settings.currency,
        settlement_day: settings.settlementDay,
      })
      .eq('id', purse.id);
    if (error) throw error;

    this.purse = { ...purse, ...{
      app_name: settings.appName,
      price_cents: settings.priceCents,
      currency: settings.currency,
      settlement_day: settings.settlementDay,
    } };
  }

  async saveMembers(members: Member[]): Promise<void> {
    const purseId = this.requirePurse().id;

    const { data: existing, error: readError } = await this.supabase
      .from('members')
      .select('id')
      .eq('purse_id', purseId);
    if (readError) throw readError;

    const keep = new Set(members.map((member) => member.id));
    const removed = (existing ?? [])
      .map((row) => (row as { id: string }).id)
      .filter((id) => !keep.has(id));

    if (removed.length > 0) {
      const { error } = await this.supabase.from('members').delete().in('id', removed);
      if (error) throw error;
    }

    const { error } = await this.supabase.from('members').upsert(
      members.map((member, index) => ({
        id: member.id,
        purse_id: purseId,
        name: member.name,
        sort_order: index,
      })),
    );
    if (error) throw error;
  }

  subscribe(onRemoteChange: (state: LedgerState) => void): () => void {
    const purse = this.purse;
    if (purse === null) return () => undefined;

    const refresh = () => {
      void this.fetchState()
        .then(onRemoteChange)
        .catch(() => undefined);
    };

    this.channel = this.supabase
      .channel(`purse:${purse.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `purse_id=eq.${purse.id}` },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `purse_id=eq.${purse.id}` },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `purse_id=eq.${purse.id}` },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purses', filter: `id=eq.${purse.id}` },
        refresh,
      )
      .subscribe();

    return () => {
      if (this.channel !== null) {
        void this.supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  private async fetchState(): Promise<LedgerState> {
    const purse = this.requirePurse();

    const [members, entries, settlements] = await Promise.all([
      this.supabase
        .from('members')
        .select('*')
        .eq('purse_id', purse.id)
        .order('sort_order'),
      this.supabase.from('entries').select('*').eq('purse_id', purse.id),
      this.supabase.from('settlements').select('*').eq('purse_id', purse.id),
    ]);

    if (members.error) throw members.error;
    if (entries.error) throw entries.error;
    if (settlements.error) throw settlements.error;

    return {
      purseId: purse.id,
      userId: this.userId,
      members: (members.data as MemberRow[]).map((row) => ({ id: row.id, name: row.name })),
      entries: (entries.data as EntryRow[]).map(toEntry),
      settlements: (settlements.data as SettlementRow[]).map(toSettlement),
      settings: toSettings(purse),
    };
  }

  private emptyRemoteState(): LedgerState {
    return {
      purseId: '',
      userId: this.userId,
      members: [],
      entries: [],
      settlements: [],
      settings: {
        priceCents: 20,
        currency: 'EUR',
        settlementDay: 30,
        appName: 'Kiroilukassa',
      },
    };
  }

  private requirePurse(): PurseRow {
    if (this.purse === null) {
      throw new Error('Kassaa ei ole vielä luotu tai siihen ei ole liitytty');
    }
    return this.purse;
  }
}
