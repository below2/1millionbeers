import { Component, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { NewsItem } from '../../core/models/news.model';

const DISMISSED_KEY = 'dismissed_news_id';

/**
 * Top-of-page news banner (formerly the Join banner's slot and styling).
 * Shows the latest active news item and renders nothing at all when there is
 * none, or when the user already dismissed that specific id (localStorage).
 *
 * The host uses `display: contents`, so with nothing to show the component
 * has no box and leaves no margin or gap behind.
 */
@Component({
  selector: 'app-news',
  standalone: true,
  host: { class: 'contents' },
  template: `
    @if (visible(); as item) {
      <aside
        role="status"
        aria-live="polite"
        class="block bg-neon text-stout border-b-4 border-stout"
      >
        <div
          class="w-full max-w-md sm:max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 
                 flex items-center justify-between gap-2 sm:gap-4 text-center"
        >
          <!-- 📢 NEWS (Anchored to the far left on desktop) -->
          <span
            class="shrink-0 inline-flex items-center bg-stout text-neon font-arcade font-black uppercase
                   text-[10px] sm:text-xs px-2.5 py-1 rounded-full"
          >
            📢 News
          </span>

          <!-- MESSAGE (Centered in the middle) -->
          <p
            class="flex-1 min-w-0 font-arcade font-black tracking-wide text-[11px] sm:text-sm
                   leading-tight break-words text-center"
          >
            {{ item.message }}
          </p>

          <!-- CLOSE BUTTON (Anchored to the far right on desktop) -->
          <button
            type="button"
            class="shrink-0 inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg
                   border-3 border-stout bg-neon2 text-stout font-arcade font-black text-xs sm:text-sm
                   leading-none transition-all hover:bg-stout hover:text-neon
                   active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-stout"
            aria-label="Dismiss announcement"
            title="Dismiss"
            (click)="dismiss(item)"
          >
            ✕
          </button>
        </div>
      </aside>
    }
  `,
})
export class NewsComponent {
  private readonly supabase = inject(SupabaseService);

  private readonly news = signal<NewsItem | null>(null);
  private readonly dismissedId = signal<string | null>(this.readDismissedId());

  /** The item to show: only when one exists and its id isn't the dismissed one. */
  readonly visible = computed(() => {
    const item = this.news();
    return item && item.id !== this.dismissedId() ? item : null;
  });

  constructor() {
    void this.load();
  }

  dismiss(item: NewsItem): void {
    this.dismissedId.set(item.id);
    try {
      localStorage.setItem(DISMISSED_KEY, item.id);
    } catch {
      /* localStorage unavailable: stays dismissed for this session only */
    }
  }

  private async load(): Promise<void> {
    try {
      this.news.set(await this.supabase.fetchLatestNews());
    } catch (err) {
      // Non-fatal: the banner simply doesn't show.
      console.warn('[news] could not load announcement', err);
    }
  }

  private readDismissedId(): string | null {
    try {
      return localStorage.getItem(DISMISSED_KEY);
    } catch {
      return null;
    }
  }
}