import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { TimeAgoPipe } from './time-ago.pipe';
import { Drinker, FRIEND_AVATARS, avatarFallback } from '../../core/models/beer.model';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <section class="card p-5 sm:p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="live-dot"></span>
        <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide">
          Live Play-by-Play
        </h2>
      </div>

      @if (store.loading()) {
        <p class="text-pub-foam/50 text-sm">Loading the box score...</p>
      } @else if (store.recentActivity().length === 0) {
        <p class="text-pub-foam/50 text-sm">No beers logged yet. Somebody get the season started.</p>
      } @else {
        <ul class="space-y-2.5">
          @for (log of store.recentActivity(); track log.id) {
            <li
              class="flex items-center gap-3 p-2.5 rounded-xl border-3 border-stout bg-pub-surface2"
            >
              <img
                [src]="avatars[log.drinker]"
                (error)="onAvatarError($event, log.drinker)"
                [alt]="log.drinker"
                class="avatar-ring w-9 h-9 shrink-0"
              />

              <div class="min-w-0 flex-1">
                <p class="text-sm text-pub-foam leading-snug">
                  <span class="font-extrabold text-pub-amber">{{ log.drinker }}</span>
                  logged
                  <span class="font-extrabold text-neon">{{ log.count }}</span>
                  {{ log.count === 1 ? 'beer' : 'beers' }}
                  @if (log.note) {
                    <span class="text-pub-foam/60"> — "{{ log.note }}"</span>
                  }
                </p>
              </div>

              <span
                class="shrink-0 text-[10px] sm:text-xs font-mono font-bold text-stout bg-pub-amber
                       px-2 py-1 rounded-full border-2 border-stout whitespace-nowrap"
              >
                {{ log.created_at | timeAgo }}
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ActivityFeedComponent {
  readonly store = inject(BeerStoreService);
  readonly avatars = FRIEND_AVATARS;

  onAvatarError(event: Event, name: Drinker): void {
    (event.target as HTMLImageElement).src = avatarFallback(name);
  }
}
