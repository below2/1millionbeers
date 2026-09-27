import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { TimeAgoPipe } from './time-ago.pipe';

@Component({
    selector: 'app-activity-feed',
    imports: [CommonModule, TimeAgoPipe],
    standalone: true,
    template: `
    <section class="card p-5 sm:p-6">
      <h2 class="font-display text-lg font-bold text-pub-amber mb-4">📜 Recent Activity</h2>

      @if (store.loading()) {
        <p class="text-pub-foam/50 text-sm">Loading...</p>
      } @else if (store.recentActivity().length === 0) {
        <p class="text-pub-foam/50 text-sm">No beers logged yet. Be the first!</p>
      } @else {
        <ul class="divide-y divide-pub-border">
          @for (log of store.recentActivity(); track log.id) {
            <li class="py-3 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm text-pub-foam">
                  <span class="font-semibold text-pub-amber">{{ log.drinker }}</span>
                  logged <span class="font-semibold">{{ log.count }}</span>
                  {{ log.count === 1 ? 'beer' : 'beers' }}
                  @if (log.note) {
                    <span class="text-pub-foam/60"> — "{{ log.note }}"</span>
                  }
                </p>
              </div>
              <span class="shrink-0 text-xs text-pub-foam/40 whitespace-nowrap">
                {{ log.created_at | timeAgo }}
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `
})
export class ActivityFeedComponent {
  readonly store = inject(BeerStoreService);
}
