import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { GOAL_BEERS } from '../../core/models/beer.model';

/** Size of one "sprint" (level) in beers. */
const SPRINT_SIZE = 100;
/** How long the milestone celebration stays on screen. */
const CELEBRATE_MS = 4500;

@Component({
  selector: 'app-hero-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card p-5 sm:p-8 relative overflow-hidden" style="margin-bottom: 1.5rem;">
      <p
        class="font-arcade uppercase tracking-[0.3em] text-xs sm:text-sm text-pub-amber mb-5 text-center"
      >
        The stupid fucking Million Beer Challenge
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <!-- ============ SIDE A: SPRINT (the part that visibly moves) ============ -->
        <div class="card-amber p-4 sm:p-5 relative" [class.animate-pop]="celebrating()">
          @if (celebrating()) {
            <span
              class="pointer-events-none absolute top-2 right-4 font-arcade font-black text-2xl sm:text-3xl
                     text-stout animate-floatUp z-10"
              aria-hidden="true"
            >
              🎉
            </span>
          }

          <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <span
              class="inline-flex items-center bg-stout text-neon font-arcade font-black uppercase
                     text-[10px] sm:text-xs px-2.5 py-1 rounded-full tracking-wide"
            >
              Level {{ currentLevel() }}
            </span>
            <span class="font-arcade font-black uppercase text-[11px] sm:text-xs tracking-wide">
              {{ levelTitle() }}
            </span>
          </div>

          <div class="flex items-center justify-center gap-5 sm:gap-6">
            <!-- Pint glass: fills 0 to 100 across each sprint -->
            <div class="relative w-28 sm:w-36 h-48 sm:h-60 shrink-0">
              <div
                class="absolute inset-0 border-4 border-stout bg-pub-surface2 overflow-hidden shadow-brutal"
                style="clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%); border-radius: 0.5rem 0.5rem 1.5rem 1.5rem;"
              >
                <!-- liquid -->
                <div
                  class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pub-amber2 via-pub-amber to-pub-gold
                         transition-all duration-700 ease-out"
                  [style.height.%]="sprintPct()"
                >
                  @if (sprintPct() > 0) {
                    <!-- foam cap -->
                    <div class="absolute -top-2 left-0 right-0 h-4 sm:h-5 bg-pub-foam rounded-full shadow-sm"></div>
                    <div class="absolute -top-4 left-2 w-3 h-3 sm:w-4 sm:h-4 bg-pub-foam rounded-full"></div>
                    <div class="absolute -top-3 right-3 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pub-foam rounded-full"></div>

                    <!-- rising bubbles -->
                    <span class="absolute bottom-4 left-3 w-1.5 h-1.5 bg-white/70 rounded-full animate-bubble"></span>
                    <span class="absolute bottom-6 left-8 w-1 h-1 bg-white/50 rounded-full animate-bubble" style="animation-delay: .7s"></span>
                    <span class="absolute bottom-3 right-5 w-1.5 h-1.5 bg-white/60 rounded-full animate-bubble" style="animation-delay: 1.3s"></span>
                    <span class="absolute bottom-8 right-3 w-1 h-1 bg-white/50 rounded-full animate-bubble" style="animation-delay: 1.9s"></span>
                  }
                </div>

                <!-- quarter tick marks (25 / 50 / 75) -->
                <div class="absolute left-0 w-3 border-t-2 border-stout/60" style="bottom: 25%"></div>
                <div class="absolute left-0 w-4 border-t-2 border-stout/60" style="bottom: 50%"></div>
                <div class="absolute left-0 w-3 border-t-2 border-stout/60" style="bottom: 75%"></div>
              </div>
              <!-- glass handle -->
              <div class="hidden sm:block absolute top-1/3 -right-5 w-7 h-14 border-4 border-stout rounded-r-full bg-transparent"></div>
            </div>

            <!-- Sprint numbers -->
            <div class="min-w-0 text-center">
              <p class="font-arcade font-black text-4xl sm:text-5xl leading-none text-stout">
                {{ sprintProgress() | number }}
              </p>
              <p class="font-arcade font-black text-lg sm:text-xl text-stout/70 leading-tight">
                / {{ sprintSize }}
              </p>
            </div>
          </div>

          <!-- Milestone banner -->
          <div
            class="mt-4 rounded-xl border-3 border-stout px-3 py-2 text-center transition-colors"
            [ngClass]="celebrating() ? 'bg-neon text-stout' : 'bg-stout text-pub-foam'"
            role="status"
            aria-live="polite"
          >
            @if (celebrating()) {
              <p class="font-arcade font-black uppercase text-xs sm:text-sm leading-snug">
                🎉 Milestone smashed! {{ currentLevel() * sprintSize | number }} beers!
              </p>
              <p class="text-[11px] sm:text-xs font-bold opacity-80 mt-0.5">
                Glass is empty again. Pour the next one.
              </p>
            } @else {
              <p class="font-arcade font-black uppercase text-xs sm:text-sm leading-snug text-pub-amber">
                Next milestone in {{ beersToNext() | number }}
                {{ beersToNext() === 1 ? 'beer' : 'beers' }}
              </p>
            }
          </div>
        </div>

        <!-- ============ SIDE B: MARATHON (the grand monument) ============ -->
        <div class="flex flex-col justify-center text-center md:text-left min-w-0">

          <h1 class="font-arcade font-black text-4xl sm:text-5xl lg:text-6xl text-pub-foam leading-none mb-1 break-words">
            {{ store.totalBeers() | number }}
            <span class="block text-pub-amber/70 text-xl sm:text-3xl mt-1">
              / {{ goal | number }}
            </span>
          </h1>

          <div class="mt-3">
            <p
              class="inline-block bg-pub-amber text-stout font-mono font-bold text-sm sm:text-lg px-3 py-1
                     rounded-lg border-3 border-stout shadow-brutalSm"
            >
              {{ store.percentComplete() | number: '1.4-4' }}% there
            </p>
          </div>

          <!-- Macro progress bar -->
          <div class="mt-5">
            <div
              class="relative h-5 sm:h-6 rounded-full border-3 border-stout bg-pub-surface2 overflow-hidden shadow-brutalSm"
              role="progressbar"
              aria-label="Progress toward 1,000,000 beers"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="macroPct()"
            >
              <div
                class="h-full bg-gradient-to-r from-pub-amber2 via-pub-amber to-pub-gold transition-all duration-700 ease-out"
                [style.width.%]="macroBarWidth()"
              ></div>
            </div>
            <div
              class="flex justify-between mt-1 text-[10px] sm:text-xs font-mono font-bold text-pub-foam/40"
            >
              <span>0</span>
              <span>1,000,000</span>
            </div>
          </div>

          <p class="mt-3 text-xs sm:text-sm text-pub-foam/50">
            Only {{ remaining() | number }} beers left guys!
          </p>
        </div>
      </div>

      <!-- Absurd ETA joke card -->
      <div class="mt-6 sm:mt-8 card-amber block px-4 py-3 sm:px-6 sm:py-4 text-left max-w-xl mx-auto">
        <p class="font-arcade text-[10px] sm:text-xs uppercase tracking-widest mb-1 opacity-70">
          📊this will definitely happen
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
  private readonly destroyRef = inject(DestroyRef);

  readonly goal = GOAL_BEERS;
  readonly sprintSize = SPRINT_SIZE;

  // ---- Marathon (1,000,000) ---------------------------------------------
  readonly remaining = computed(() => Math.max(0, this.goal - this.store.totalBeers()));
  readonly macroPct = computed(() => Math.min(100, this.store.percentComplete()));
  /** Keeps a thin sliver visible once anyone has logged a beer. */
  readonly macroBarWidth = computed(() => {
    const pct = this.macroPct();
    return this.store.totalBeers() > 0 ? Math.max(pct, 1) : 0;
  });

  // ---- Sprint (every 100 beers) ----------------------------------------------
  readonly currentLevel = computed(() => Math.floor(this.store.totalBeers() / SPRINT_SIZE));
  readonly sprintProgress = computed(() => this.store.totalBeers() % SPRINT_SIZE);
  readonly sprintPct = computed(() => (this.sprintProgress() / SPRINT_SIZE) * 100);
  readonly nextMilestone = computed(() => (this.currentLevel() + 1) * SPRINT_SIZE);
  readonly beersToNext = computed(() => this.nextMilestone() - this.store.totalBeers());
  readonly levelTitle = computed(() => {
    const level = this.currentLevel();
    return level === 0 ? 'The Warm-Up' : `The ${level * SPRINT_SIZE}s`;
  });

  // ---- Milestone celebration ---------------------------------------------------
  readonly celebrating = signal(false);

  private lastLevel: number | null = null;
  private lastFilter: string | null = null;
  private celebrateTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.celebrateTimer) clearTimeout(this.celebrateTimer);
    });

    effect(() => {
      const level = this.currentLevel();
      const loading = this.store.loading();
      const filter = this.store.filter();

      // Initial data load, or the All/Primary toggle changing totals: re-baseline
      // silently so those jumps don't count as "hitting" a milestone.
      if (loading || this.lastLevel === null || this.lastFilter !== filter) {
        this.lastLevel = loading ? null : level;
        this.lastFilter = filter;
        return;
      }

      if (level > this.lastLevel) {
        untracked(() => this.celebrate());
      }
      this.lastLevel = level;
    });
  }

  private celebrate(): void {
    if (this.celebrateTimer) clearTimeout(this.celebrateTimer);
    this.celebrating.set(true);
    this.celebrateTimer = setTimeout(() => this.celebrating.set(false), CELEBRATE_MS);
  }

  // ---- ETA joke (presentation only) ------------------------------------------
  readonly etaMessage = computed(() => {
    const remaining = this.remaining();
    if (remaining <= 0) {
      return '🎉 GOAL SMASHED. Somehow. Time to pick a new, even dumber target.';
    }

    const pace = this.store.avgPerDay();
    if (!pace || pace <= 0) {
      return "At the current pace of literally nothing, you'll hit 1,000,000 beers approximately never. Drink faster.";
    }

    const daysLeft = remaining / pace;
    const yearsLeft = daysLeft / 365.25;
    const etaYear = new Date().getFullYear() + Math.ceil(yearsLeft);

    // Keep the joke sane if the pace is microscopic.
    if (etaYear > 9999) {
      return "At this pace, you'll hit 1,000,000 beers sometime after the heat death of the pub. Drink faster.";
    }

    return `At this pace, you'll reach 1,000,000 beers in the year ${etaYear}. Drink fast, die young.`;
  });
}