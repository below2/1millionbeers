import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { BeerLog } from '../../core/models/beer.model';

interface Tile {
  icon: string;
  value: number;
  format: string;
  label: string;
}

/**
 * Stat tiles.
 *  - No inputs  -> global mode (Today / Monthly / Group Pace from the store).
 *  - `logs` set -> scoped mode (Total / Biggest Single Log / Pace over `periodDays`).
 */
@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-1 gap-3">
      @for (tile of tiles(); track tile.label) {
        <div class="card p-4 sm:p-5 text-center">
          <p class="text-3xl mb-1">{{ tile.icon }}</p>
          <p class="text-2xl sm:text-3xl font-arcade font-black text-pub-amber">
            {{ tile.value | number: tile.format }}
          </p>
          <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1 font-bold">
            {{ tile.label }}
          </p>
        </div>
      }
    </section>
  `,
})
export class StatsDashboardComponent {
  readonly store = inject(BeerStoreService);

  /** Optional scoped logs. When null, falls back to the global store. */
  readonly logs = input<BeerLog[] | null>(null);
  /** Length of the scoped period in days (used for the pace tile). */
  readonly periodDays = input<number | null>(null);

  readonly tiles = computed<Tile[]>(() => {
    const scoped = this.logs();

    if (scoped === null) {
      return [
        { icon: '🤕', value: this.store.todayTotal(), format: '1.0-0', label: "Today's Count" },
        { icon: '🏋️', value: this.store.monthTotal(), format: '1.0-0', label: 'Monthly Count' },
        { icon: '🐎', value: this.store.avgPerDay(), format: '1.1-1', label: 'Group Pace (beers/day)' },
      ];
    }

    const total = scoped.reduce((sum, l) => sum + l.count, 0);
    const biggest = scoped.reduce((max, l) => Math.max(max, l.count), 0);
    const days = Math.max(1, this.periodDays() ?? 1);

    return [
      { icon: '🍺', value: total, format: '1.0-0', label: 'Beers In Period' },
      { icon: '🏋️', value: biggest, format: '1.0-0', label: 'Biggest Single Log' },
      { icon: '🐎', value: total / days, format: '1.1-1', label: 'Pace (beers/day)' },
    ];
  });
}