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
import { NewsComponent } from '../../components/news/news.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NewsComponent,
    HeroProgressComponent,
    LogBeerFormComponent,
    LeaderboardComponent,
    StatsDashboardComponent,
    ActivityFeedComponent,
    PlayerFilterComponent,
  ],
  template: `
    <div class="min-h-screen">
      <!-- Sole top banner. Renders no box at all when there's no active/undismissed news. -->
      <app-news />

      <div class="px-4 py-5 sm:px-6 sm:py-8 max-w-5xl mx-auto space-y-6">
        <!-- Join CTA: compact card directly above the log form -->
        <div class="card flex items-center justify-between gap-3 p-3 sm:p-4" style="margin-bottom: 1.5rem;">
          <p class="min-w-0 text-sm sm:text-base font-bold leading-snug text-pub-foam">
            <span aria-hidden="true">🍺</span>
            New people can join here
          </p>
          <a
            routerLink="/join"
            class="btn-brutal shrink-0 inline-flex items-center !py-1.5 !px-3 text-xs sm:text-sm
                   !bg-neon !text-stout font-arcade font-black uppercase tracking-wide"
          >
            Join →
          </a>
        </div>

        <app-hero-progress />

        @if (store.error()) {
          <div class="card p-4 border-red-500 text-red-400 text-sm font-bold">
            ⚠️ Couldn't reach the database: {{ store.error() }}
          </div>
        }

        <app-log-beer-form />

        <!-- Divider: top section above, controls below -->
        <div class="flex items-center gap-3 py-1" style="margin-bottom: 1.5rem;" role="separator" aria-hidden="true">
          <div class="flex-1 border-t-2 border-dashed border-pub-border"></div>
          <span
            class="font-arcade font-black uppercase tracking-[0.25em] text-[10px] sm:text-xs text-pub-foam/40"
          >
            Stats
          </span>
          <div class="flex-1 border-t-2 border-dashed border-pub-border"></div>
        </div>
        
        <app-player-filter />
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" style="margin-top: 0; margin-bottom: 1.5rem;">
          <app-stats-dashboard />
          <app-leaderboard />
        </div>

        <app-activity-feed>
          <a
            feedActions
            routerLink="/history"
            class="btn-brutal inline-flex items-center !py-1.5 !px-3 text-xs sm:text-sm"
          >
            📜 View Full History
          </a>
        </app-activity-feed>

        <footer
          class="text-center text-xs text-pub-foam/40 pt-4 pb-2 font-bold uppercase tracking-widest"
        >
          im not resetting ur pin if u forget
        </footer>
      </div>
    </div>
  `,
})
export class HomeComponent {
  readonly store = inject(BeerStoreService);
}