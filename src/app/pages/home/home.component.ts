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
    <div class="min-h-screen px-4 py-6 sm:px-6 sm:py-10 max-w-5xl mx-auto space-y-6">
      <app-hero-progress />

      <!-- Join CTA -->
      <a
        routerLink="/join"
        class="card-neon block px-5 py-4 text-center font-arcade font-black uppercase tracking-wide
               text-sm sm:text-base transition-all hover:-translate-y-0.5 hover:shadow-brutalLg
               active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        🍺 Want to join the race? Click here to join the challenge. →
      </a>

      @if (store.error()) {
        <div class="card p-4 border-red-500 text-red-400 text-sm font-bold">
          ⚠️ Couldn't reach the database: {{ store.error() }}
        </div>
      }

      <app-player-filter />

      <app-stats-dashboard />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" style="margin-bottom: 1.5rem;">
        <app-log-beer-form />
        <app-leaderboard />
      </div>

      <app-activity-feed />

      <footer class="text-center text-xs text-pub-foam/40 pt-4 pb-2 font-bold uppercase tracking-widest">
        we be drankin
      </footer>
    </div>
  `,
})
export class HomeComponent {
  readonly store = inject(BeerStoreService);
}