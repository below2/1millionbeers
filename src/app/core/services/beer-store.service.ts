import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  BeerLog,
  Drinker,
  DRINKERS,
  GOAL_BEERS,
  LeaderboardEntry,
} from '../models/beer.model';

const PIN_STORAGE_KEY = 'beer-tracker-pin';

@Injectable({ providedIn: 'root' })
export class BeerStoreService {
  private readonly supabase = inject(SupabaseService);

  // ---- Raw state -----------------------------------------------------
  readonly logs = signal<BeerLog[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  // ---- Derived state (Signals) ----------------------------------------
  readonly totalBeers = computed(() =>
    this.logs().reduce((sum, log) => sum + log.count, 0)
  );

  readonly percentComplete = computed(() =>
    (this.totalBeers() / GOAL_BEERS) * 100
  );

  readonly leaderboard = computed<LeaderboardEntry[]>(() => {
    const totals = new Map<Drinker, number>(DRINKERS.map((d) => [d, 0]));
    for (const log of this.logs()) {
      totals.set(log.drinker, (totals.get(log.drinker) ?? 0) + log.count);
    }
    const groupTotal = this.totalBeers();

    return [...totals.entries()]
      .map(([drinker, total]) => ({
        drinker,
        total,
        pct: groupTotal > 0 ? (total / groupTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  });

  readonly todayTotal = computed(() => {
    const startOfToday = this.startOfDay(new Date());
    return this.logs()
      .filter((l) => new Date(l.created_at) >= startOfToday)
      .reduce((sum, l) => sum + l.count, 0);
  });

  readonly monthTotal = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.logs()
      .filter((l) => new Date(l.created_at) >= startOfMonth)
      .reduce((sum, l) => sum + l.count, 0);
  });

  readonly avgPerDay = computed(() => {
    const logs = this.logs();
    if (logs.length === 0) return 0;
    const earliest = logs.reduce(
      (min, l) => Math.min(min, new Date(l.created_at).getTime()),
      Date.now()
    );
    const daysElapsed = Math.max(
      1,
      Math.ceil((Date.now() - earliest) / (1000 * 60 * 60 * 24))
    );
    return this.totalBeers() / daysElapsed;
  });

  readonly recentActivity = computed(() => this.logs().slice(0, 20));

  // ---- Lifecycle --------------------------------------------------------
  constructor() {
    this.refresh();
    this.supabase.subscribeToNewLogs((newLog) => {
      // Avoid duplicate insert if this client triggered it (optimistic update
      // already added it) — dedupe by id.
      if (this.logs().some((l) => l.id === newLog.id)) return;
      this.logs.update((current) => [newLog, ...current]);
    });
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const logs = await this.supabase.fetchLogs();
      this.logs.set(logs);
    } catch (err) {
      this.error.set(this.toMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async logBeer(input: {
    drinker: Drinker;
    count: number;
    pin: string;
    note?: string | null;
  }): Promise<{ success: boolean; message?: string }> {
    this.submitting.set(true);
    try {
      const inserted = await this.supabase.logBeer(input);
      // Optimistic prepend; realtime subscription will no-op on duplicate.
      this.logs.update((current) => [inserted, ...current]);
      this.savePin(input.pin);
      return { success: true };
    } catch (err) {
      return { success: false, message: this.toMessage(err) };
    } finally {
      this.submitting.set(false);
    }
  }

  // ---- PIN persistence (localStorage) ------------------------------------
  getSavedPin(): string | null {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  savePin(pin: string): void {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, pin);
    } catch {
      /* localStorage unavailable — ignore */
    }
  }

  clearSavedPin(): void {
    try {
      localStorage.removeItem(PIN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private toMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Something went wrong. Please try again.';
  }
}
