import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  BeerLog,
  Drinker,
  GOAL_BEERS,
  LeaderboardEntry,
  Player,
  PlayerFilter,
  RegisterResult,
} from '../models/beer.model';

const PIN_STORAGE_KEY = 'beer-tracker-pin';
const USERNAME_STORAGE_KEY = 'beer-tracker-username';

@Injectable({ providedIn: 'root' })
export class BeerStoreService {
  private readonly supabase = inject(SupabaseService);

  // ---- Raw state -----------------------------------------------------
  readonly logs = signal<BeerLog[]>([]);
  readonly players = signal<Player[]>([]);
  readonly filter = signal<PlayerFilter>('all');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  // ---- Filter-aware base signals ---------------------------------------
  private readonly primaryNames = computed(
    () => new Set(this.players().filter((p) => p.is_primary).map((p) => p.username))
  );

  /** Players that count under the active filter. */
  readonly visiblePlayers = computed(() =>
    this.filter() === 'primary'
      ? this.players().filter((p) => p.is_primary)
      : this.players()
  );

  /** Logs that count under the active filter. Everything below derives from this. */
  readonly filteredLogs = computed(() => {
    const logs = this.logs();
    if (this.filter() === 'all') return logs;
    const names = this.primaryNames();
    return logs.filter((l) => names.has(l.drinker));
  });

  // ---- Derived state (Signals) ----------------------------------------
  readonly totalBeers = computed(() =>
    this.filteredLogs().reduce((sum, log) => sum + log.count, 0)
  );

  readonly percentComplete = computed(() => (this.totalBeers() / GOAL_BEERS) * 100);

  readonly leaderboard = computed<LeaderboardEntry[]>(() => {
    const totals = new Map<Drinker, number>(
      this.visiblePlayers().map((p) => [p.username, 0])
    );
    for (const log of this.filteredLogs()) {
      if (totals.has(log.drinker)) {
        totals.set(log.drinker, (totals.get(log.drinker) ?? 0) + log.count);
      }
    }
    const groupTotal = [...totals.values()].reduce((a, b) => a + b, 0);

    return [...totals.entries()]
      .map(([drinker, total]) => ({
        drinker,
        total,
        pct: groupTotal > 0 ? (total / groupTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total || a.drinker.localeCompare(b.drinker))
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  });

  readonly todayTotal = computed(() => {
    const startOfToday = this.startOfDay(new Date());
    return this.filteredLogs()
      .filter((l) => new Date(l.created_at) >= startOfToday)
      .reduce((sum, l) => sum + l.count, 0);
  });

  readonly monthTotal = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.filteredLogs()
      .filter((l) => new Date(l.created_at) >= startOfMonth)
      .reduce((sum, l) => sum + l.count, 0);
  });

  readonly avgPerDay = computed(() => {
    const logs = this.filteredLogs();
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

  readonly recentActivity = computed(() => this.filteredLogs().slice(0, 20));

  // ---- Lifecycle --------------------------------------------------------
  constructor() {
    this.refresh();
    this.supabase.subscribeToNewLogs((newLog) => {
      // If someone we haven't seen yet just logged (new sign-up), reload players.
      if (!this.players().some((p) => p.username === newLog.drinker)) {
        void this.refreshPlayers();
      }
      // Dedupe by id (optimistic update may have added it already).
      if (this.logs().some((l) => l.id === newLog.id)) return;
      this.logs.update((current) => [newLog, ...current]);
    });
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [players, logs] = await Promise.all([
        this.supabase.fetchPlayers(),
        this.supabase.fetchLogs(),
      ]);
      this.players.set(players);
      this.logs.set(logs);
    } catch (err) {
      this.error.set(this.toMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async refreshPlayers(): Promise<void> {
    try {
      this.players.set(await this.supabase.fetchPlayers());
    } catch {
      /* non-fatal: the next full refresh will pick it up */
    }
  }

  async registerDrinker(
    username: string
  ): Promise<{ success: true; result: RegisterResult } | { success: false; message: string }> {
    this.submitting.set(true);
    try {
      const result = await this.supabase.registerDrinker(username);

      this.players.update((current) =>
        current.some((p) => p.username === result.username)
          ? current
          : [
              ...current,
              { username: result.username, is_primary: false, created_at: new Date().toISOString() },
            ]
      );

      this.saveUsername(result.username);
      this.savePin(result.pin);
      return { success: true, result };
    } catch (err) {
      return { success: false, message: this.toMessage(err) };
    } finally {
      this.submitting.set(false);
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
      this.logs.update((current) =>
        current.some((l) => l.id === inserted.id) ? current : [inserted, ...current]
      );
      this.savePin(input.pin);
      this.saveUsername(input.drinker);
      return { success: true };
    } catch (err) {
      return { success: false, message: this.toMessage(err) };
    } finally {
      this.submitting.set(false);
    }
  }

  // ---- Local persistence (localStorage) ------------------------------------
  getSavedPin(): string | null {
    return this.read(PIN_STORAGE_KEY);
  }
  savePin(pin: string): void {
    this.write(PIN_STORAGE_KEY, pin);
  }
  clearSavedPin(): void {
    this.remove(PIN_STORAGE_KEY);
  }

  getSavedUsername(): string | null {
    return this.read(USERNAME_STORAGE_KEY);
  }
  saveUsername(username: string): void {
    this.write(USERNAME_STORAGE_KEY, username);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* localStorage unavailable — ignore */
    }
  }
  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
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