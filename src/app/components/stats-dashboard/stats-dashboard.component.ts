import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-1 gap-3">
      <div class="card p-4 sm:p-5 text-center">
        <p class="text-3xl mb-1">🤕</p>
        <p class="text-2xl sm:text-3xl font-arcade font-black text-pub-amber">
          {{ store.todayTotal() | number }}
        </p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1 font-bold">
          Today's Count
        </p>
      </div>

      <div class="card p-4 sm:p-5 text-center">
        <p class="text-3xl mb-1">🏋️</p>
        <p class="text-2xl sm:text-3xl font-arcade font-black text-pub-amber">
          {{ store.monthTotal() | number }}
        </p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1 font-bold">
          Monthly Count
        </p>
      </div>

      <div class="card p-4 sm:p-5 text-center">
        <p class="text-3xl mb-1">🐎</p>
        <p class="text-2xl sm:text-3xl font-arcade font-black text-pub-amber">
          {{ store.avgPerDay() | number: '1.1-1' }}
        </p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1 font-bold">
          Group Pace (beers/day)
        </p>
      </div>
    </section>
  `,
})
export class StatsDashboardComponent {
  readonly store = inject(BeerStoreService);
}
