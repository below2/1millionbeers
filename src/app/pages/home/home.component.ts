import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { HeroProgressComponent } from '../../components/hero-progress/hero-progress.component';
import { LogBeerFormComponent } from '../../components/log-beer-form/log-beer-form.component';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard.component';
import { StatsDashboardComponent } from '../../components/stats-dashboard/stats-dashboard.component';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed.component';
import { PlayerFilterComponent } from '../../components/player-filter/player-filter.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroProgressComponent,
    LogBeerFormComponent,
    LeaderboardComponent,
    StatsDashboardComponent,
    ActivityFeedComponent,
    PlayerFilterComponent,
  ],
  template: `
    <div class="min-h-screen">
      <!-- Top announcement banner: slim so the hero stays above the fold on mobile -->
      <a
        routerLink="/join"
        class="group block bg-neon text-stout border-b-4 border-stout transition-colors hover:bg-neon2"
      >
        <div
          class="max-w-5xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2 sm:gap-3 text-center"
        >
          <span class="text-base sm:text-lg animate-wiggle" aria-hidden="true">🍺</span>
          <span
            class="font-arcade font-black uppercase tracking-wide text-[11px] sm:text-sm leading-tight"
          >
            Want to join the race?
          </span>
          <span
            class="shrink-0 inline-flex items-center bg-stout text-neon font-arcade font-black uppercase
                   text-[10px] sm:text-xs px-2.5 py-1 rounded-full transition-transform group-hover:translate-x-0.5"
          >
            Join →
          </span>
        </div>
      </a>

      <div class="px-4 py-5 sm:px-6 sm:py-8 max-w-5xl mx-auto space-y-6">
        <app-hero-progress />

        @if (store.error()) {
          <div class="card p-4 border-red-500 text-red-400 text-sm font-bold">
            ⚠️ Couldn't reach the database: {{ store.error() }}
          </div>
        }
        
        <app-player-filter />
    
        <app-log-beer-form />
        
        <!-- Divider: top section above, controls below -->
        <div class="flex items-center gap-3 py-1" role="separator" aria-hidden="true">
          <div class="flex-1 border-t-2 border-dashed border-pub-border"></div>
          <span
            class="font-arcade font-black uppercase tracking-[0.25em] text-[10px] sm:text-xs text-pub-foam/40"
          >
            Stats
          </span>
          <div class="flex-1 border-t-2 border-dashed border-pub-border"></div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" style="margin-bottom: 1.5rem;">
          <app-stats-dashboard />
          <app-leaderboard />
        </div>

        <app-activity-feed />

        <footer
          class="text-center text-xs text-pub-foam/40 pt-4 pb-2 font-bold uppercase tracking-widest"
        >
          we be drankin
        </footer>
      </div>
    </div>
  `,
})
export class HomeComponent {
  readonly store = inject(BeerStoreService);
}