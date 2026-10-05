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
  buildLeaderboard,
  sortPlayers,
} from '../models/beer.model';

const PIN_STORAGE_KEY = 'beer-tracker-pin';
const USERNAME_STORAGE_KEY = 'beer-tracker-username';
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class BeerStoreService {
  private readonly supabase = inject(SupabaseService);

  // ---- Raw state -----------------------------------------------------
  readonly logs = signal<BeerLog[]>([]);
  private readonly playersRaw = signal<Player[]>([]);
  readonly filter = signal<PlayerFilter>('all');
  /** Player clicked in the leaderboard; narrows the home activity feed only. */
  readonly selectedDrinkerFilter = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  /** Ticks every minute so the rolling "past 7 days" window stays fresh. */
  private readonly now = signal(Date.now());

  /** All players, always ordered: primary first, then alphabetical within each group. */
  readonly players = computed(() => sortPlayers(this.playersRaw()));

  // ---- Filter-aware base signals ---------------------------------------
  readonly primaryNames = computed(
    () => new Set(this.players().filter((p) => p.is_primary).map((p) => p.username))
  );

  /** Players that count under the active All / Primary filter. */
  readonly visiblePlayers = computed(() =>
    this.filter() === 'primary'
      ? this.players().filter((p) => p.is_primary)
      : this.players()
  );

  /** Logs that count under the active All / Primary filter. */
  readonly filteredLogs = computed(() => {
    const logs = this.logs();
    if (this.filter() === 'all') return logs;
    const names = this.primaryNames();
    return logs.filter((l) => names.has(l.drinker));
  });

  /** Filtered logs from the past rolling 7 days. */
  readonly weekLogs = computed(() => {
    const cutoff = this.now() - 7 * DAY_MS;
    return this.filteredLogs().filter((l) => new Date(l.created_at).getTime() >= cutoff);
  });

  /**
   * The leaderboard selection, but only if that player is still visible under
   * the All / Primary filter (otherwise null).
   */
  readonly activeDrinkerFilter = computed(() => {
    const selected = this.selectedDrinkerFilter();
    if (!selected) return null;
    return this.visiblePlayers().some((p) => p.username === selected) ? selected : null;
  });

  /**
   * Home-page feed source: All/Primary filter + past 7 days + leaderboard
   * selection. (The /history page builds its own scoped list locally.)
   */
  readonly activityLogs = computed(() => {
    const logs = this.weekLogs();
    const selected = this.activeDrinkerFilter();
    return selected ? logs.filter((l) => l.drinker === selected) : logs;
  });

  // ---- Derived state (Signals) ----------------------------------------
  readonly totalBeers = computed(() =>
    this.filteredLogs().reduce((sum, log) => sum + log.count, 0)
  );

  readonly percentComplete = computed(() => (this.totalBeers() / GOAL_BEERS) * 100);

  readonly leaderboard = computed<LeaderboardEntry[]>(() =>
    buildLeaderboard(
      this.visiblePlayers().map((p) => p.username),
      this.filteredLogs()
    )
  );

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
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - earliest) / DAY_MS));
    return this.totalBeers() / daysElapsed;
  });

  /** Latest 20 entries of the weekly feed. */
  readonly recentActivity = computed(() => this.activityLogs().slice(0, 20));

  // ---- Lifecycle --------------------------------------------------------
  constructor() {
    this.refresh();
    setInterval(() => this.now.set(Date.now()), 60_000);

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
      this.playersRaw.set(players);
      this.logs.set(logs);
    } catch (err) {
      this.error.set(this.toMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async refreshPlayers(): Promise<void> {
    try {
      this.playersRaw.set(await this.supabase.fetchPlayers());
    } catch {
      /* non-fatal: the next full refresh will pick it up */
    }
  }

  // ---- Leaderboard -> feed filter ------------------------------------------
  /** Click a player to filter the feed; click again to clear. */
  toggleDrinkerFilter(username: string): void {
    this.selectedDrinkerFilter.update((current) => (current === username ? null : username));
  }

  clearDrinkerFilter(): void {
    this.selectedDrinkerFilter.set(null);
  }

  isPrimary(username: string): boolean {
    return this.primaryNames().has(username);
  }

  // ---- Mutations -----------------------------------------------------------
  async registerDrinker(
    username: string
  ): Promise<{ success: true; result: RegisterResult } | { success: false; message: string }> {
    this.submitting.set(true);
    try {
      const result = await this.supabase.registerDrinker(username);

      this.playersRaw.update((current) =>
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