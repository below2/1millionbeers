import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { GOAL_BEERS } from '../../core/models/beer.model';

@Component({
  selector: 'app-hero-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card p-6 sm:p-10 text-center relative overflow-hidden" style="margin-bottom: 1.5rem;">
      <!-- corner sticker -->

      <p class="font-arcade uppercase tracking-[0.3em] text-xs sm:text-sm text-pub-amber mb-4">
        The stupid fucking Million Beer Challenge
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        <!-- The pint glass -->
        <div class="relative w-32 sm:w-44 h-52 sm:h-72 shrink-0">
          <div
            class="absolute inset-0 border-4 border-stout bg-pub-surface2/60 overflow-hidden shadow-brutal"
            style="clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%); border-radius: 0.5rem 0.5rem 1.5rem 1.5rem;"
          >
            <!-- liquid -->
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pub-amber2 via-pub-amber to-pub-gold transition-all duration-700 ease-out"
              [style.height.%]="barWidth()"
            >
              <!-- foam cap -->
              <div class="absolute -top-2 left-0 right-0 h-4 sm:h-5 bg-pub-foam rounded-full shadow-sm"></div>
              <div class="absolute -top-4 left-2 w-3 h-3 sm:w-4 sm:h-4 bg-pub-foam rounded-full"></div>
              <div class="absolute -top-3 right-3 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pub-foam rounded-full"></div>

              <!-- rising bubbles -->
              <span class="absolute bottom-4 left-3 w-1.5 h-1.5 bg-white/70 rounded-full animate-bubble"></span>
              <span class="absolute bottom-6 left-8 w-1 h-1 bg-white/50 rounded-full animate-bubble" style="animation-delay: .7s"></span>
              <span class="absolute bottom-3 right-5 w-1.5 h-1.5 bg-white/60 rounded-full animate-bubble" style="animation-delay: 1.3s"></span>
              <span class="absolute bottom-8 right-3 w-1 h-1 bg-white/50 rounded-full animate-bubble" style="animation-delay: 1.9s"></span>
            </div>
          </div>
          <!-- glass handle -->
          <div class="hidden sm:block absolute top-1/3 -right-5 w-7 h-16 border-4 border-stout rounded-r-full bg-transparent"></div>
        </div>

        <!-- Numbers -->
        <div class="min-w-0">
          <h1 class="font-arcade font-black text-4xl sm:text-6xl text-pub-foam leading-none mb-1 break-words">
            {{ store.totalBeers() | number }}
            <span class="block sm:inline text-pub-amber/70 text-xl sm:text-3xl mt-1 sm:mt-0">
              / {{ goal | number }}
            </span>
          </h1>

          <p class="inline-block bg-pub-amber text-stout font-mono font-bold text-sm sm:text-lg px-3 py-1 rounded-lg border-3 border-stout shadow-brutalSm mt-2">
            {{ store.percentComplete() | number: '1.4-4' }}% there
          </p>

          <p class="mt-4 text-xs sm:text-sm text-pub-foam/50">
            Only {{ remaining() | number }} beers left guys!
          </p>
        </div>
      </div>

      <!-- Absurd ETA joke card -->
      <div class="mt-6 sm:mt-8 card-amber inline-block px-4 py-3 sm:px-6 sm:py-4 text-left max-w-xl mx-auto">
        <p class="font-arcade text-[10px] sm:text-xs uppercase tracking-widest mb-1 opacity-70">
          📊 Scientifically Rigorous Projection
        </p>
        <p class="text-sm sm:text-base font-semibold leading-snug">
          {{ etaMessage() }}
        </p>
      </div>
    </section>
  `,
})
export class HeroProgressComponent {
  readonly store = inject(BeerStoreService);
  readonly goal = GOAL_BEERS;

  readonly barWidth = computed(() => Math.min(100, this.store.percentComplete()));
  readonly remaining = computed(() => Math.max(0, this.goal - this.store.totalBeers()));

  /**
   * Presentation-only joke stat. Purely derived from existing store signals
   * (totalBeers, avgPerDay) — no store/service logic touched.
   */
  readonly etaMessage = computed(() => {
    const remaining = this.remaining();
    if (remaining <= 0) {
      return "🎉 GOAL SMASHED. Somehow. Time to pick a new, even dumber target.";
    }

    const pace = this.store.avgPerDay();
    if (!pace || pace <= 0) {
      return "At the current pace of literally nothing, you'll hit 1,000,000 beers approximately never. Drink faster.";
    }

    const daysLeft = remaining / pace;
    const eta = new Date();
    eta.setDate(eta.getDate() + Math.ceil(daysLeft));
    const yearsLeft = Math.max(1, Math.round(daysLeft / 365.25));
    const dateStr = eta.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `At this pace, we'll reach 1,000,000 beers on ${dateStr}. Drink fast, die young.`;
  });
}
