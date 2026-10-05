import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { StatsDashboardComponent } from '../../components/stats-dashboard/stats-dashboard.component';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard.component';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed.component';
import { PlayerSelectComponent } from '../../components/player-select/player-select.component';
import { buildLeaderboard, displayName } from '../../core/models/beer.model';

type Granularity = 'day' | 'month' | 'year';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const pad = (n: number): string => String(n).padStart(2, '0');

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/**
 * Detailed history. All filter state is local to this page; it only READS
 * logs/players from the store, so the home page state is never affected.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StatsDashboardComponent,
    LeaderboardComponent,
    ActivityFeedComponent,
    PlayerSelectComponent,
  ],
  template: `
    <div class="min-h-screen px-4 py-5 sm:px-6 sm:py-8 max-w-5xl mx-auto flex flex-col gap-5">
      <!-- Header -->
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <a
          routerLink="/"
          class="btn-brutal inline-flex items-center !py-2 !px-3 text-xs sm:text-sm"
        >
          ← Back to Challenge
        </a>
        <h1
          class="font-arcade font-black text-xl sm:text-3xl text-pub-amber uppercase tracking-wide"
        >
          📜 Detailed History
        </h1>
      </header>

      <!-- Filter bar -->
      <section class="card p-5 sm:p-6">
        <h2
          class="font-arcade font-black text-sm sm:text-base text-pub-foam/70 uppercase tracking-wide mb-4"
        >
          🔎 Filters
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 1. Drinker -->
          <div>
            <div class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
              Drinker
            </div>
            <app-player-select
              [players]="store.players()"
              [(value)]="drinker"
              allLabel="All Drinkers"
            />
          </div>

          <!-- 2. Granularity -->
          <div>
            <div class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
              Time Range
            </div>
            <div class="grid grid-cols-3 gap-1.5" role="group" aria-label="Time range">
              @for (g of granularities; track g.id) {
                <button
                  type="button"
                  class="btn-brutal !py-2 !px-2 text-xs sm:text-sm"
                  [class.btn-brutal-active]="granularity() === g.id"
                  [attr.aria-pressed]="granularity() === g.id"
                  (click)="granularity.set(g.id)"
                >
                  {{ g.label }}
                </button>
              }
            </div>
          </div>

          <!-- 3. Dynamic date selector -->
          <div>
            @switch (granularity()) {
              @case ('day') {
                <label
                  for="history-day"
                  class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold"
                >
                  Date
                </label>
                <input
                  id="history-day"
                  type="date"
                  class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm font-bold
                         [color-scheme:dark] focus:outline-none focus:border-pub-amber"
                  [ngModel]="dayValue()"
                  (ngModelChange)="onDayChange($event)"
                />
              }
              @case ('month') {
                <label
                  for="history-month"
                  class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold"
                >
                  Month
                </label>
                <input
                  id="history-month"
                  type="month"
                  placeholder="YYYY-MM"
                  class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm font-bold
                         [color-scheme:dark] focus:outline-none focus:border-pub-amber"
                  [ngModel]="monthValue()"
                  (ngModelChange)="onMonthChange($event)"
                />
              }
              @case ('year') {
                <label
                  for="history-year"
                  class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold"
                >
                  Year
                </label>
                <select
                  id="history-year"
                  class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm font-bold
                         [color-scheme:dark] focus:outline-none focus:border-pub-amber"
                  [ngModel]="yearValue()"
                  (ngModelChange)="yearValue.set(+$event)"
                >
                  @for (y of years(); track y) {
                    <option [ngValue]="y">{{ y }}</option>
                  }
                </select>
              }
            }
          </div>
        </div>

        <p class="text-xs text-pub-foam/50 font-bold mt-4">
          Showing <span class="text-pub-amber">{{ range().label }}</span>
          ·
          <span class="text-pub-amber">{{ drinker() ? name(drinker()!) : 'All drinkers' }}</span>
          ·
          {{ scopedLogs().length }} {{ scopedLogs().length === 1 ? 'entry' : 'entries' }}
        </p>
      </section>

      <!-- Results -->
      @if (store.loading()) {
        <div class="card p-8 text-center">
          <p class="text-pub-foam/50 text-sm font-bold">Digging through the archives...</p>
        </div>
      } @else if (scopedLogs().length === 0) {
        <div class="card p-8 sm:p-12 text-center">
          <p class="text-5xl mb-3">🫗</p>
          <h2
            class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide mb-1"
          >
            No activity found for this period.
          </h2>
          <p class="text-sm text-pub-foam/60">
            Nobody was drankin here. Try a different date, or pick another drinker.
          </p>
        </div>
      } @else {
        <app-stats-dashboard [logs]="scopedLogs()" [periodDays]="range().days"/>

        <app-leaderboard
          [entries]="entries()"
          [selected]="drinker()"
          (drinkerToggle)="onDrinkerToggle($event)"
        />

        <app-activity-feed
          [logs]="scopedLogs()"
          title="Play-by-Play"
          [live]="false"
          [subtitle]="range().label"
          [pageSize]="15"
          [absoluteTime]="true"
          [resetKey]="resetKey()"
        />
      }
    </div>
  `,
})
export class HistoryComponent {
  readonly store = inject(BeerStoreService);
  readonly name = displayName;

  readonly granularities: { id: Granularity; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  // ---- Local filter state (never written to the store) ----------------------
  readonly drinker = signal<string | null>(null); // null = all drinkers
  readonly granularity = signal<Granularity>('day');
  readonly dayValue = signal(todayStr());
  readonly monthValue = signal(currentMonthStr());
  readonly yearValue = signal(new Date().getFullYear());

  /** Current year + every year that has at least one log (newest first). */
  readonly years = computed(() => {
    const set = new Set<number>([new Date().getFullYear(), this.yearValue()]);
    for (const log of this.store.logs()) {
      set.add(new Date(log.created_at).getFullYear());
    }
    return [...set].sort((a, b) => b - a);
  });

  /** The selected period as [startMs, endMs) plus a label and length in days. */
  readonly range = computed(() => {
    const g = this.granularity();
    let start: Date;
    let end: Date;
    let label: string;

    if (g === 'day') {
      const [y, m, d] = this.dayValue().split('-').map(Number);
      start = new Date(y, m - 1, d);
      end = new Date(y, m - 1, d + 1);
      label = start.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (g === 'month') {
      const [y, m] = this.monthValue().split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
      label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const y = this.yearValue();
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      label = String(y);
    }

    const startMs = start.getTime();
    const endMs = end.getTime();

    // For a period that is still in progress, only count the days elapsed so far.
    const effectiveEnd = Math.min(Date.now(), endMs);
    const raw = (effectiveEnd - startMs) / DAY_MS;
    const days = Math.max(1, effectiveEnd === endMs ? Math.round(raw) : Math.ceil(raw));

    return { startMs, endMs, label, days };
  });

  /** All drinkers' logs inside the selected period. */
  readonly periodLogs = computed(() => {
    const { startMs, endMs } = this.range();
    return this.store.logs().filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= startMs && t < endMs;
    });
  });

  /** Period logs narrowed by the drinker filter. Feeds the stats + activity feed. */
  readonly scopedLogs = computed(() => {
    const d = this.drinker();
    const logs = this.periodLogs();
    return d ? logs.filter((l) => l.drinker === d) : logs;
  });

  /** Period leaderboard for everyone who drank in the period. */
  readonly entries = computed(() =>
    buildLeaderboard(
      this.store.players().map((p) => p.username),
      this.periodLogs(),
      true
    )
  );

  readonly resetKey = computed(
    () => `${this.drinker() ?? 'all'}|${this.granularity()}|${this.range().startMs}`
  );

  // ---- Handlers ------------------------------------------------------------
  onDayChange(value: string): void {
    if (DAY_RE.test(value ?? '')) this.dayValue.set(value);
  }

  onMonthChange(value: string): void {
    if (MONTH_RE.test(value ?? '')) this.monthValue.set(value);
  }

  /** Leaderboard row tapped: select that drinker, or clear if already selected. */
  onDrinkerToggle(username: string): void {
    this.drinker.update((current) => (current === username ? null : username));
  }
}