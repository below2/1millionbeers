import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { Drinker, avatarFallback, avatarFor, displayName } from '../../core/models/beer.model';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_STYLES: Record<number, string> = {
  1: 'bg-neon border-stout shadow-brutalNeon',
  2: 'bg-pub-foam border-stout shadow-brutal',
  3: 'bg-pub-amber2 border-stout shadow-brutal',
};

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card p-5 sm:p-6">
      <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber mb-4 uppercase tracking-wide">
        🏆 Leaderboard
      </h2>

      <ul class="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
        @for (entry of store.leaderboard(); track entry.drinker) {
          <li
            class="flex items-center gap-3 p-2.5 rounded-2xl border-3 border-stout"
            [ngClass]="rankStyle(entry.rank)"
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
              <div class="flex justify-between items-baseline mb-1">
                <span class="font-extrabold truncate" [class.text-stout]="entry.rank <= 3">
                  {{ name(entry.drinker) }}
                </span>
                <span class="text-sm font-mono font-bold" [class.text-stout]="entry.rank <= 3">
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

  rankStyle(rank: number): string {
    return RANK_STYLES[rank] ?? 'bg-pub-surface2 border-stout';
  }

  onAvatarError(event: Event, name: Drinker): void {
    (event.target as HTMLImageElement).src = avatarFallback(name);
  }
}