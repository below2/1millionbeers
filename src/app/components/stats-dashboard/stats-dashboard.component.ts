import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-3 gap-3 sm:gap-4">
      <div class="card p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-pub-amber">{{ store.todayTotal() | number }}</p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1">Today</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-pub-amber">{{ store.monthTotal() | number }}</p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1">This Month</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-pub-amber">{{ store.avgPerDay() | number: '1.1-1' }}</p>
        <p class="text-[10px] sm:text-xs uppercase tracking-wide text-pub-foam/50 mt-1">Avg / Day</p>
      </div>
    </section>
  `,
})
export class StatsDashboardComponent {
  readonly store = inject(BeerStoreService);
}
