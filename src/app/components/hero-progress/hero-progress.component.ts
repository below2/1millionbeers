import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { GOAL_BEERS } from '../../core/models/beer.model';

@Component({
  selector: 'app-hero-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card p-6 sm:p-8 text-center shadow-glow">
      <p class="uppercase tracking-[0.3em] text-xs text-pub-amber/80 mb-2">
        The Million Beer Challenge
      </p>

      <h1 class="font-display text-3xl sm:text-5xl font-bold text-pub-foam mb-1">
        {{ store.totalBeers() | number }}
        <span class="text-pub-amber/60 text-xl sm:text-3xl"> / {{ goal | number }}</span>
      </h1>

      <p class="text-pub-amber text-sm sm:text-base font-mono mb-6">
        {{ store.percentComplete() | number: '1.4-4' }}% complete
      </p>

      <div class="relative h-8 sm:h-10 w-full rounded-full bg-pub-surface2 border border-pub-border overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-pub-amber2 via-pub-amber to-pub-gold transition-all duration-700 ease-out flex items-center justify-end"
          [style.width.%]="barWidth()"
        >
          <span class="mr-2 text-lg">🍺</span>
        </div>
      </div>

      <p class="mt-4 text-xs text-pub-foam/50">
        {{ remaining() | number }} beers to go — keep pouring.
      </p>
    </section>
  `,
})
export class HeroProgressComponent {
  readonly store = inject(BeerStoreService);
  readonly goal = GOAL_BEERS;

  readonly barWidth = computed(() => Math.min(100, this.store.percentComplete()));
  readonly remaining = computed(() => Math.max(0, this.goal - this.store.totalBeers()));
}
