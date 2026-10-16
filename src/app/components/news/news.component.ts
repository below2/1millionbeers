import { Component, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { NewsItem } from '../../core/models/news.model';

const DISMISSED_KEY = 'dismissed_news_id';

/**
 * Pub Bulletin banner. Shows the latest active news item from Supabase and
 * renders nothing at all when there is none, or when the user has already
 * dismissed that specific item (tracked by id in localStorage).
 */
@Component({
  selector: 'app-news',
  standalone: true,
  template: `
    @if (visible(); as item) {
      <div class="px-4 pt-5 sm:px-6 sm:pt-8 max-w-5xl mx-auto">
        <aside
          role="status"
          aria-live="polite"
          class="card flex items-start gap-3 p-3 sm:p-4 border-pub-amber"
        >
          <span
            class="shrink-0 self-start bg-pub-amber text-stout font-arcade font-black uppercase
                   tracking-wider text-[10px] sm:text-xs px-2.5 py-1 rounded-lg border-3 border-stout
                   shadow-brutalSm"
          >
            📢 News
          </span>

          <p class="flex-1 min-w-0 text-sm sm:text-base font-bold leading-snug break-words text-pub-foam pt-0.5">
            {{ item.message }}
          </p>

          <button
            type="button"
            class="btn-brutal shrink-0 !py-1 !px-2.5 text-xs sm:text-sm"
            aria-label="Dismiss announcement"
            title="Dismiss"
            (click)="dismiss(item)"
          >
            ✕
          </button>
        </aside>
      </div>
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