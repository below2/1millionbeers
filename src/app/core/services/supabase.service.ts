import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BeerLog, Drinker } from '../models/beer.model';

/**
 * Thin wrapper around the Supabase client. Keeps all direct SDK usage in one
 * place so the rest of the app talks to a clean, typed API instead.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  /** Fetch logs, newest first. Capped to keep client-side aggregation cheap. */
  async fetchLogs(limit = 5000): Promise<BeerLog[]> {
    const { data, error } = await this.client
      .from('beer_logs')
      .select('id, drinker, count, note, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as BeerLog[];
  }

  /**
   * Insert a new log via the `log_beer` RPC. The RPC validates the PIN
   * server-side — direct table inserts are blocked by RLS.
   */
  async logBeer(params: {
    drinker: Drinker;
    count: number;
    pin: string;
    note?: string | null;
  }): Promise<BeerLog> {
    const { data, error } = await this.client.rpc('log_beer', {
      p_drinker: params.drinker,
      p_count: params.count,
      p_pin: params.pin,
      p_note: params.note ?? null,
    });

    if (error) throw error;
    return data as BeerLog;
  }

  /** Subscribe to realtime inserts on beer_logs. Returns the channel so the caller can unsubscribe. */
  subscribeToNewLogs(onInsert: (log: BeerLog) => void): RealtimeChannel {
    return this.client
      .channel('beer_logs_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'beer_logs' },
        (payload) => onInsert(payload.new as BeerLog)
      )
      .subscribe();
  }
}
