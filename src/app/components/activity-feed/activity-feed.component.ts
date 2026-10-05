import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { TimeAgoPipe } from './time-ago.pipe';
import { BeerLog, displayName } from '../../core/models/beer.model';

/**
 * Activity feed.
 *  - No `logs` input -> global mode: the store's weekly feed (past 7 days,
 *    All/Primary filter + leaderboard selection).
 *  - `logs` set      -> scoped mode: renders exactly those logs (e.g. /history).
 *
 * Header actions can be projected with any element carrying the `feedActions` attribute.
 */
@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, AvatarComponent],
  template: `
    <section id="activity-feed" class="card p-5 sm:p-6 scroll-mt-4">
      <div class="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap" style="justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          @if (live()) {
            <span class="live-dot"></span>
          }
          <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber uppercase tracking-wide">
            {{ title() }}
          </h2>
        </div>
          @if (shownSubtitle(); as sub) {
            <span
              class="text-[10px] sm:text-xs font-mono font-bold text-pub-foam/60 border-2 border-pub-border
                     rounded-full px-2 py-0.5 uppercase tracking-wide"
            >
              {{ sub }}
            </span>
          }
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <ng-content select="[feedActions]" />

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
      </div>

      <!-- Active leaderboard filter (global mode only) -->
      @if (activeDrinker(); as active) {
        <div
          class="flex items-center justify-between gap-3 mb-4 p-2.5 rounded-xl border-3 border-pub-amber bg-pub-surface2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <app-avatar [name]="active" sizeClass="w-7 h-7" />
            <p class="text-sm font-bold truncate">
              Showing only <span class="text-pub-amber">{{ name(active) }}</span>
            </p>
          </div>
          <button
            type="button"
            class="btn-brutal !py-1 !px-2.5 text-[11px] sm:text-xs shrink-0"
            (click)="store.clearDrinkerFilter()"
          >
            ✕ Show all
          </button>
        </div>
      }

      @if (store.loading()) {
        <p class="text-pub-foam/50 text-sm">Loading the box score...</p>
      } @else if (totalLogs() === 0) {
        <div class="text-center py-8 px-4 border-3 border-dashed border-pub-border rounded-xl">
          <p class="text-3xl mb-2">🍺</p>
          <p class="text-pub-foam/60 text-sm font-bold">{{ emptyText() }}</p>
        </div>
      } @else {
        <ul class="space-y-2.5">
          @for (log of pagedLogs(); track log.id) {
            <li
              class="flex items-center gap-3 p-2.5 rounded-xl border-3 border-stout bg-pub-surface2"
            >
              <app-avatar [name]="log.drinker" sizeClass="w-9 h-9" />

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
                @if (absoluteTime()) {
                  {{ log.created_at | date: 'MMM d, h:mm a' }}
                } @else {
                  {{ log.created_at | timeAgo }}
                }
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
  readonly name = displayName;

  /** Optional scoped logs. When null, falls back to the store's weekly feed. */
  readonly logs = input<BeerLog[] | null>(null);
  readonly title = input('Recent Activity');
  readonly live = input(true);
  readonly subtitle = input<string | null>(null);
  readonly pageSize = input(10);
  /** Show "Mar 4, 9:15 PM" instead of "2 days ago" (better for history). */
  readonly absoluteTime = input(false);
  readonly emptyMessage = input<string | null>(null);
  /** Change this value to send the feed back to page 1 (e.g. when filters change). */
  readonly resetKey = input<unknown>(null);

  readonly page = signal(1);

  readonly scoped = computed(() => this.logs() !== null);
  private readonly feedLogs = computed(() => this.logs() ?? this.store.activityLogs());

  readonly activeDrinker = computed(() =>
    this.scoped() ? null : this.store.activeDrinkerFilter()
  );

  readonly shownSubtitle = computed(
    () => this.subtitle() ?? (this.scoped() ? null : 'Past 7 days')
  );

  readonly emptyText = computed(() => {
    const custom = this.emptyMessage();
    if (custom) return custom;
    if (this.scoped()) return 'No activity found for this period.';
    const active = this.activeDrinker();
    if (active) return `${displayName(active)} hasn't logged a beer this week. Suspicious.`;
    return 'No beers logged this week yet! Time to get cracking.';
  });

  readonly totalLogs = computed(() => this.feedLogs().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalLogs() / this.pageSize()))
  );

  private readonly clampedPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly pagedLogs = computed(() => {
    const size = this.pageSize();
    const start = (this.clampedPage() - 1) * size;
    return this.feedLogs().slice(start, start + size);
  });

  readonly rangeStart = computed(() =>
    this.totalLogs() === 0 ? 0 : (this.clampedPage() - 1) * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.totalLogs(), this.clampedPage() * this.pageSize())
  );

  constructor() {
    // Changing any filter jumps back to page 1.
    effect(() => {
      this.resetKey();
      this.store.filter();
      this.store.activeDrinkerFilter();
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
}