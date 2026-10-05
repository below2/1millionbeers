import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { CoreBadgeComponent } from '../core-badge/core-badge.component';
import {
  Drinker,
  LeaderboardEntry,
  avatarFallback,
  avatarFor,
  displayName,
} from '../../core/models/beer.model';

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

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, CoreBadgeComponent],
  template: `
    <section class="card p-5 sm:p-6">
      <div class="flex items-start justify-between gap-2 mb-1 flex-wrap">
        <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide">
          🏆 Leaderboard
        </h2>

        @if (store.activeDrinkerFilter(); as active) {
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
              (click)="store.clearDrinkerFilter()"
            >
              ✕ Show all
            </button>
          </div>
        }
      </div>

      <p class="text-[11px] sm:text-xs text-pub-foam/40 font-bold mb-4">
        @if (store.activeDrinkerFilter(); as active) {
          Feed filtered to <span class="text-pub-amber">{{ name(active) }}</span>. Tap again to clear.
        } @else {
          Tap a player to filter the play-by-play.
        }
      </p>

      <ul class="space-y-3 max-h-[34rem] overflow-y-auto p-2">
        @for (entry of store.leaderboard(); track entry.drinker) {
          <li>
            <button
              type="button"
              [ngClass]="rowClass(entry)"
              [attr.aria-pressed]="isActive(entry.drinker)"
              (click)="store.toggleDrinkerFilter(entry.drinker)"
            >
              <span class="w-8 text-center text-xl sm:text-2xl shrink-0">
                {{ medal(entry.rank) }}
              </span>

              <img
                [src]="avatar(entry.drinker)"
                (error)="onAvatarError($event, entry.drinker)"
                [alt]="name(entry.drinker)"
                class="avatar-ring w-9 h-9 sm:w-10 sm:h-10 shrink-0"
              />

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline gap-2 mb-1">
                  <span class="flex items-center gap-1.5 min-w-0">
                    <span
                      class="font-extrabold truncate"
                      [class.text-stout]="entry.rank <= 3"
                    >
                      {{ name(entry.drinker) }}
                    </span>
                    @if (store.isPrimary(entry.drinker)) {
                      <app-core-badge />
                    }
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
  readonly avatar = avatarFor;
  readonly name = displayName;

  medal(rank: number): string {
    return MEDALS[rank] ?? `#${rank}`;
  }

  isActive(username: string): boolean {
    return this.store.activeDrinkerFilter() === username;
  }

  rowClass(entry: LeaderboardEntry): string {
    const rank = RANK_STYLES[entry.rank] ?? 'bg-pub-surface2 border-stout';
    const active = this.store.activeDrinkerFilter();

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

  onAvatarError(event: Event, name: Drinker): void {
    (event.target as HTMLImageElement).src = avatarFallback(name);
  }
}