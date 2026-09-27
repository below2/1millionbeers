import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

@Component({
    selector: 'app-leaderboard',
    imports: [CommonModule],
    standalone: true,
    template: `
    <section class="card p-5 sm:p-6">
      <h2 class="font-display text-lg font-bold text-pub-amber mb-4">🏆 Leaderboard</h2>

      <ul class="space-y-3">
        @for (entry of store.leaderboard(); track entry.drinker) {
          <li class="flex items-center gap-3">
            <span class="w-7 text-center text-lg">{{ medal(entry.rank) }}</span>

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline mb-1">
                <span class="font-semibold text-pub-foam truncate">{{ entry.drinker }}</span>
                <span class="text-sm text-pub-amber font-mono">{{ entry.total | number }}</span>
              </div>
              <div class="h-2 rounded-full bg-pub-surface2 overflow-hidden">
                <div
                  class="h-full bg-pub-amber rounded-full transition-all duration-500"
                  [style.width.%]="entry.pct"
                ></div>
              </div>
            </div>

            <span class="w-14 text-right text-xs text-pub-foam/50 font-mono">
              {{ entry.pct | number: '1.1-1' }}%
            </span>
          </li>
        }
      </ul>
    </section>
  `
})
export class LeaderboardComponent {
  readonly store = inject(BeerStoreService);

  medal(rank: number): string {
    return MEDALS[rank] ?? `#${rank}`;
  }
}
