import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { LeaderboardEntry, displayName } from '../../core/models/beer.model';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_STYLES: Record<number, string> = {
  1: 'bg-neon border-stout shadow-brutalNeon',
  2: 'bg-pub-foam border-stout shadow-brutal',
  3: 'bg-pub-amber2 border-stout shadow-brutal',
};

const ROW_BASE =
  'w-full text-left flex items-center gap-3 p-2.5 rounded-2xl border-3 border-stout ' +
  'transition-all cursor-pointer hover:-translate-y-0.5 ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-pub-foam';

/**
 * Leaderboard.
 *  - No inputs   -> global mode: store leaderboard; clicking a row filters the home feed.
 *  - `entries`   -> scoped mode: renders the given entries; clicking a row emits
 *                   `drinkerToggle` and highlights `selected` (parent owns the state).
 */
@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <section class="card p-5 sm:p-6">
      <div class="flex items-start justify-between gap-2 mb-1 flex-wrap">
        <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide">
          🏆 Leaderboard
        </h2>

        @if (active()) {
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-brutal !py-1 !px-2.5 text-[11px] sm:text-xs"
              (click)="scrollToFeed()"
            >
              View feed ↓
            </button>
            <button
              type="button"
              class="btn-brutal !py-1 !px-2.5 text-[11px] sm:text-xs"
              (click)="clear()"
            >
              ✕ Show all
            </button>
          </div>
        }
      </div>

      <p class="text-[11px] sm:text-xs text-pub-foam/40 font-bold mb-4">
        @if (active(); as a) {
          Filtered to <span class="text-pub-amber">{{ name(a) }}</span>. Tap again to clear.
        } @else if (scoped()) {
          Tap a player to filter this page to them.
        } @else {
          Tap a player to filter the play-by-play.
        }
      </p>

      <ul class="space-y-3 max-h-[34rem] overflow-y-auto p-2">
        @for (entry of rows(); track entry.drinker) {
          <li>
            <button
              type="button"
              [ngClass]="rowClass(entry)"
              [attr.aria-pressed]="active() === entry.drinker"
              (click)="select(entry.drinker)"
            >
              <span class="w-8 text-center text-xl sm:text-2xl shrink-0">
                {{ medal(entry.rank) }}
              </span>

              <app-avatar [name]="entry.drinker" sizeClass="w-9 h-9 sm:w-10 sm:h-10" />

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline gap-2 mb-1">
                  <span
                    class="font-extrabold truncate"
                    [class.text-stout]="entry.rank <= 3"
                  >
                    {{ name(entry.drinker) }}
                  </span>
                  <span
                    class="text-sm font-mono font-bold shrink-0"
                    [class.text-stout]="entry.rank <= 3"
                  >
                    {{ entry.total | number }}
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-stout/20 border border-stout/40 overflow-hidden">
                  <div
                    class="h-full bg-stout/80 rounded-full transition-all duration-500"
                    [style.width.%]="entry.pct"
                  ></div>
                </div>
              </div>

              <span
                class="w-14 text-right text-xs font-mono font-bold shrink-0 text-pub-foam/60"
                [class.text-stout]="entry.rank <= 3"
              >
                {{ entry.pct | number: '1.1-1' }}%
              </span>
            </button>
          </li>
        }
      </ul>
    </section>
  `,
})
export class LeaderboardComponent {
  readonly store = inject(BeerStoreService);
  readonly name = displayName;

  /** Optional scoped entries. When null, falls back to the global store. */
  readonly entries = input<LeaderboardEntry[] | null>(null);
  /** Highlighted drinker in scoped mode (ignored in global mode). */
  readonly selected = input<string | null>(null);
  /** Scoped mode: a row was tapped. Parent decides what to do with it. */
  readonly drinkerToggle = output<string>();

  readonly scoped = computed(() => this.entries() !== null);
  readonly rows = computed(() => this.entries() ?? this.store.leaderboard());
  readonly active = computed(() =>
    this.scoped() ? this.selected() : this.store.activeDrinkerFilter()
  );

  medal(rank: number): string {
    return MEDALS[rank] ?? `#${rank}`;
  }

  select(username: string): void {
    if (this.scoped()) {
      this.drinkerToggle.emit(username);
    } else {
      this.store.toggleDrinkerFilter(username);
    }
  }

  clear(): void {
    const current = this.active();
    if (this.scoped()) {
      if (current) this.drinkerToggle.emit(current); // toggling the active one clears it
    } else {
      this.store.clearDrinkerFilter();
    }
  }

  rowClass(entry: LeaderboardEntry): string {
    const rank = RANK_STYLES[entry.rank] ?? 'bg-pub-surface2 border-stout';
    const active = this.active();

    let state = '';
    if (active) {
      state =
        active === entry.drinker
          ? ' ring-4 ring-pub-foam ring-offset-2 ring-offset-pub-surface'
          : ' opacity-60';
    }
    return `${ROW_BASE} ${rank}${state}`;
  }

  scrollToFeed(): void {
    document.getElementById('activity-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}