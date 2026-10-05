import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { TimeAgoPipe } from './time-ago.pipe';
import { Drinker, avatarFallback, avatarFor, displayName } from '../../core/models/beer.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <section class="card p-5 sm:p-6">
      <div class="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="live-dot"></span>
          <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide">
            Live Play-by-Play
          </h2>
        </div>

        @if (page() > 1) {
          <button
            type="button"
            class="btn-brutal !py-1.5 !px-3 text-xs sm:text-sm"
            (click)="goToLatest()"
          >
            ⚡ Jump to latest
          </button>
        }
      </div>

      @if (store.loading()) {
        <p class="text-pub-foam/50 text-sm">Loading the box score...</p>
      } @else if (totalLogs() === 0) {
        <p class="text-pub-foam/50 text-sm">No beers logged yet. Somebody get the season started.</p>
      } @else {
        <ul class="space-y-2.5">
          @for (log of pagedLogs(); track log.id) {
            <li
              class="flex items-center gap-3 p-2.5 rounded-xl border-3 border-stout bg-pub-surface2"
            >
              <img
                [src]="avatar(log.drinker)"
                (error)="onAvatarError($event, log.drinker)"
                [alt]="name(log.drinker)"
                class="avatar-ring w-9 h-9 shrink-0"
              />

              <div class="min-w-0 flex-1">
                <p class="text-sm text-pub-foam leading-snug">
                  <span class="font-extrabold text-pub-amber">{{ name(log.drinker) }}</span>
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

        <!-- Pagination controls -->
        <div class="flex items-center justify-between gap-3 mt-5 pt-4 border-t-3 border-stout/40 flex-wrap">
          <p class="text-xs text-pub-foam/50 font-bold">
            Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ totalLogs() }}
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-brutal !py-1.5 !px-3 text-xs sm:text-sm"
              [disabled]="page() <= 1"
              (click)="prevPage()"
            >
              ◀ Prev
            </button>

            <span class="text-xs sm:text-sm font-mono font-bold text-pub-foam/70 px-1">
              Page {{ page() }} / {{ totalPages() }}
            </span>

            <button
              type="button"
              class="btn-brutal !py-1.5 !px-3 text-xs sm:text-sm"
              [disabled]="page() >= totalPages()"
              (click)="nextPage()"
            >
              Next ▶
            </button>
          </div>
        </div>
      }
    </section>
  `,
})
export class ActivityFeedComponent {
  readonly store = inject(BeerStoreService);
  readonly avatar = avatarFor;
  readonly name = displayName;

  readonly pageSize = PAGE_SIZE;
  readonly page = signal(1);

  // Respects the All / Primary filter
  readonly totalLogs = computed(() => this.store.filteredLogs().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalLogs() / this.pageSize)));

  private readonly clampedPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly pagedLogs = computed(() => {
    const start = (this.clampedPage() - 1) * this.pageSize;
    return this.store.filteredLogs().slice(start, start + this.pageSize);
  });

  readonly rangeStart = computed(() => (this.totalLogs() === 0 ? 0 : (this.clampedPage() - 1) * this.pageSize + 1));
  readonly rangeEnd = computed(() => Math.min(this.totalLogs(), this.clampedPage() * this.pageSize));

  constructor() {
    // Switching All <-> Primary jumps back to page 1.
    effect(() => {
      this.store.filter();
      this.page.set(1);
    });
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  goToLatest(): void {
    this.page.set(1);
  }

  onAvatarError(event: Event, name: Drinker): void {
    (event.target as HTMLImageElement).src = avatarFallback(name);
  }
}