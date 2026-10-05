import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';

@Component({
  selector: 'app-player-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div
        class="card p-1.5 grid grid-cols-2 gap-1.5 w-full sm:w-auto"
        role="group"
        aria-label="Player filter"
      >
        <button
          type="button"
          class="btn-brutal !py-2 !px-4 text-xs sm:text-sm"
          [class.btn-brutal-active]="store.filter() === 'all'"
          [attr.aria-pressed]="store.filter() === 'all'"
          (click)="store.filter.set('all')"
        >
          🌍 All Players
        </button>
        <button
          type="button"
          class="btn-brutal !py-2 !px-4 text-xs sm:text-sm"
          [class.btn-brutal-active]="store.filter() === 'primary'"
          [attr.aria-pressed]="store.filter() === 'primary'"
          (click)="store.filter.set('primary')"
        >
          ⭐ Original 5
        </button>
      </div>

      <p class="text-xs text-pub-foam/50 font-bold uppercase tracking-wide" style="text-align: center; margin-bottom: 0.375rem;">
        Showing {{ store.visiblePlayers().length }} of {{ store.players().length }} players
      </p>
    </div>
  `,
})
export class PlayerFilterComponent {
  readonly store = inject(BeerStoreService);
}