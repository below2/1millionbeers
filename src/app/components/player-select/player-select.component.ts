import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { Player, displayName, sortPlayers } from '../../core/models/beer.model';

/**
 * Reusable brutalist player dropdown.
 *  - Two-way bindable: [(value)]="signalOfStringOrNull"
 *  - Players are always shown primary-first, then alphabetical.
 *  - Pass `allLabel` to add an "All ..." option that sets value to null.
 */
@Component({
  selector: 'app-player-select',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="relative" (keydown.escape)="open.set(false)">
      <button
        type="button"
        class="w-full flex items-center gap-3 bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2
               shadow-brutalSm transition-all hover:-translate-y-0.5 hover:shadow-brutal
               active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
               focus:outline-none focus-visible:border-pub-amber"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
      >
        @if (value(); as v) {
        <app-avatar [name]="v" sizeClass="w-8 h-8" />
        <span class="font-bold text-sm sm:text-base truncate">{{ name(v) }}</span>
        } @else if (allLabel()) {
        <span
            class="w-8 h-8 shrink-0 rounded-full border-2 border-stout bg-pub-amber text-stout
                flex items-center justify-center text-sm"
        >
            🌍
        </span>
        <span class="font-bold text-sm sm:text-base truncate">{{ allLabel() }}</span>
        } @else {
        <span
            class="w-8 h-8 shrink-0 rounded-full border-2 border-dashed border-pub-foam/30
                flex items-center justify-center text-sm font-black text-pub-foam/40"
        >
            ?
        </span>
        <span class="font-bold text-sm sm:text-base text-pub-foam/50">{{ placeholder() }}</span>
        }

        <svg
          class="ml-auto w-5 h-5 shrink-0 text-pub-amber transition-transform duration-200"
          [ngClass]="open() ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      @if (open()) {
        <ul
          role="listbox"
          class="card !rounded-xl absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-y-auto p-2 space-y-1"
        >
          @if (allLabel(); as all) {
            <li role="presentation">
              <button
                type="button"
                role="option"
                class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                [ngClass]="optionClass(value() === null)"
                [attr.aria-selected]="value() === null"
                (click)="choose(null)"
              >
                <span
                  class="w-7 h-7 shrink-0 rounded-full border-2 border-stout bg-pub-amber text-stout
                         flex items-center justify-center text-xs"
                >
                  🌍
                </span>
                <span class="font-bold text-sm truncate">{{ all }}</span>
                @if (value() === null) {
                  <span class="ml-auto font-black" aria-hidden="true">✓</span>
                }
              </button>
            </li>
          }

          @for (row of rows(); track row.player.username) {
            @if (row.dividerBefore) {
              <li aria-hidden="true" class="my-1.5 border-t-2 border-dashed border-pub-border"></li>
            }
            <li role="presentation">
              <button
                type="button"
                role="option"
                class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                [ngClass]="optionClass(value() === row.player.username)"
                [attr.aria-selected]="value() === row.player.username"
                (click)="choose(row.player.username)"
              >
                <app-avatar [name]="row.player.username" sizeClass="w-7 h-7" />
                <span class="font-bold text-sm truncate">{{ name(row.player.username) }}</span>
                @if (value() === row.player.username) {
                  <span class="ml-auto font-black" aria-hidden="true">✓</span>
                }
              </button>
            </li>
          } @empty {
            <li class="px-3 py-2 text-sm text-pub-foam/50 font-bold">No players yet.</li>
          }
        </ul>
      }
    </div>
  `,
})
export class PlayerSelectComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly players = input.required<readonly Player[]>();
  readonly value = model<string | null>(null);
  readonly placeholder = input('Pick your name...');
  /** When set, an extra option with this label is shown and maps to `null`. */
  readonly allLabel = input<string | null>(null);

  readonly open = signal(false);
  readonly name = displayName;

  /** Always primary-first then alphabetical, with a divider between the groups. */
  readonly rows = computed(() => {
    const sorted = sortPlayers(this.players());
    return sorted.map((player, i) => ({
      player,
      dividerBefore: i > 0 && sorted[i - 1].is_primary && !player.is_primary,
    }));
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  choose(username: string | null): void {
    this.value.set(username);
    this.open.set(false);
  }

  optionClass(active: boolean): string {
    return active ? 'bg-pub-amber text-stout' : 'text-pub-foam hover:bg-pub-surface2';
  }
}