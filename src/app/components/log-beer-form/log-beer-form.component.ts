import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { CoreBadgeComponent } from '../core-badge/core-badge.component';
import {
  Drinker,
  avatarFallback,
  avatarFor,
  displayName,
} from '../../core/models/beer.model';

@Component({
  selector: 'app-log-beer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CoreBadgeComponent],
  template: `
    <section
      class="card p-5 sm:p-6 relative"
      [class.animate-shake]="celebrate()"
    >
      <!-- floating "+N 🍺" popup on success -->
      @if (celebrate()) {
        <span
          class="pointer-events-none absolute top-2 right-6 font-arcade font-black text-2xl sm:text-3xl
                 text-neon drop-shadow-[2px_2px_0px_#0b0908] animate-floatUp z-10"
        >
          +{{ lastLoggedCount() }} 🍺
        </span>
      }

      <h2 class="font-arcade font-black text-lg sm:text-xl text-pub-amber mb-4 uppercase tracking-wide">
        🍻 Log a Beer
      </h2>

      <!-- Drinker dropdown -->
      <div class="mb-5">
        <div class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
          Who's drankin?
        </div>

        <div #dropdown class="relative" (keydown.escape)="open.set(false)">
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
            @if (selectedDrinker(); as sel) {
              <img
                [src]="avatar(sel)"
                (error)="onAvatarError($event, sel)"
                [alt]="name(sel)"
                class="avatar-ring w-8 h-8 shrink-0"
              />
              <span class="font-bold text-sm sm:text-base truncate">{{ name(sel) }}</span>
              @if (store.isPrimary(sel)) {
                <app-core-badge />
              }
            } @else {
              <span
                class="w-8 h-8 shrink-0 rounded-full border-2 border-dashed border-pub-foam/30
                       flex items-center justify-center text-sm font-black text-pub-foam/40"
              >
                ?
              </span>
              <span class="font-bold text-sm sm:text-base text-pub-foam/50">Pick your name...</span>
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
              class="card !rounded-xl absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-y-auto p-1.5 space-y-1"
            >
              @for (p of store.players(); track p.username) {
                <li role="presentation">
                  <button
                    type="button"
                    role="option"
                    class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                    [ngClass]="optionClass(p.username)"
                    [attr.aria-selected]="selectedDrinker() === p.username"
                    (click)="choose(p.username)"
                  >
                    <img
                      [src]="avatar(p.username)"
                      (error)="onAvatarError($event, p.username)"
                      [alt]="name(p.username)"
                      class="avatar-ring w-7 h-7 shrink-0"
                    />
                    <span class="font-bold text-sm truncate">{{ name(p.username) }}</span>
                    @if (p.is_primary) {
                      <app-core-badge />
                    }
                    @if (selectedDrinker() === p.username) {
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
      </div>

      <!-- Quantity: chunky tactile picks -->
      <div class="mb-5">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
          How many?
        </label>
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button
            type="button"
            class="btn-brutal"
            [class.btn-brutal-active]="count() === 1"
            (click)="count.set(1)"
          >
            +1 🍺
          </button>
          <button
            type="button"
            class="btn-brutal"
            [class.btn-brutal-active]="count() === 2"
            (click)="count.set(2)"
          >
            +2 🍻
          </button>
          <button
            type="button"
            class="btn-brutal"
            [class.btn-brutal-active]="count() === 6"
            (click)="count.set(6)"
          >
            +6 📦
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-pub-foam/40 font-bold">or exactly:</span>
          <input
            type="number"
            min="1"
            max="24"
            class="w-20 bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-1.5 text-center text-sm font-bold
                   focus:outline-none focus:border-pub-amber"
            [ngModel]="count()"
            (ngModelChange)="setCustomCount($event)"
          />
          <span class="text-xs text-pub-foam/40">(max 24, otherwise ur ded)</span>
        </div>
      </div>

      <!-- Note -->
      <div class="mb-4">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
          Note (optional, but funnier if u add it)
        </label>
        <input
          type="text"
          maxlength="140"
          placeholder="e.g. Guinness or shower beer"
          class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm
                 focus:outline-none focus:border-pub-amber"
          [(ngModel)]="note"
        />
      </div>

      <!-- PIN -->
      <div class="mb-5">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
          PIN
          @if (pinRemembered()) {
            <span class="text-neon normal-case">(remembered on this device 🔓)</span>
          }
        </label>
        <input
          type="password"
          inputmode="numeric"
          placeholder="Your personal PIN (or the master PIN)"
          class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm tracking-widest
                 focus:outline-none focus:border-pub-amber"
          [(ngModel)]="pin"
        />
        <p class="text-[11px] text-pub-foam/40 mt-1.5 font-bold">
          Personal PINs only work for your own name.
        </p>
      </div>

      @if (errorMessage()) {
        <p class="text-red-400 text-sm mb-3 font-bold">⚠️ {{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="text-neon text-sm mb-3 font-bold">✅ {{ successMessage() }}</p>
      }

      <button
        type="button"
        class="btn-primary text-base sm:text-lg"
        [disabled]="!canSubmit() || store.submitting()"
        (click)="submit()"
      >
        {{ store.submitting() ? 'Pouring...' : 'Log it 🍺' }}
      </button>
    </section>
  `,
})
export class LogBeerFormComponent {
  readonly store = inject(BeerStoreService);
  readonly avatar = avatarFor;
  readonly name = displayName;

  private readonly dropdownEl = viewChild<ElementRef<HTMLElement>>('dropdown');

  // Pre-select whoever last used / registered on this device.
  readonly selectedDrinker = signal<Drinker | null>(this.store.getSavedUsername());
  readonly open = signal(false);
  readonly count = signal(1);
  note = '';
  pin = this.store.getSavedPin() ?? '';

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pinRemembered = signal(!!this.store.getSavedPin());

  // Purely cosmetic celebration state — no business logic involved.
  readonly celebrate = signal(false);
  readonly lastLoggedCount = signal(1);

  readonly canSubmitState = computed(
    () => !!this.selectedDrinker() && this.count() >= 1 && this.count() <= 24
  );

  /** Close the dropdown when clicking anywhere outside it. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.open()) return;
    const el = this.dropdownEl()?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  choose(username: Drinker): void {
    this.selectedDrinker.set(username);
    this.open.set(false);
  }

  optionClass(username: string): string {
    return this.selectedDrinker() === username
      ? 'bg-pub-amber text-stout'
      : 'text-pub-foam hover:bg-pub-surface2';
  }

  canSubmit(): boolean {
    return this.canSubmitState() && this.pin.trim().length > 0;
  }

  setCustomCount(value: number): void {
    const n = Math.max(1, Math.min(24, Math.round(Number(value) || 1)));
    this.count.set(n);
  }

  /** Swap in a generated initials avatar if the real photo file isn't there. */
  onAvatarError(event: Event, name: Drinker): void {
    (event.target as HTMLImageElement).src = avatarFallback(name);
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const drinker = this.selectedDrinker();
    if (!drinker) return;

    const loggedCount = this.count();

    const result = await this.store.logBeer({
      drinker,
      count: loggedCount,
      pin: this.pin.trim(),
      note: this.note.trim() || null,
    });

    if (result.success) {
      this.successMessage.set(`Logged ${loggedCount} for ${displayName(drinker)}!`);
      this.pinRemembered.set(true);
      this.note = '';
      this.count.set(1);
      this.fireCelebration(loggedCount);
      setTimeout(() => this.successMessage.set(null), 3000);
    } else {
      this.errorMessage.set(result.message ?? 'Failed to log beer.');
    }
  }

  private fireCelebration(count: number): void {
    this.lastLoggedCount.set(count);
    this.celebrate.set(false);
    // restart the CSS animation on the next tick
    requestAnimationFrame(() => {
      this.celebrate.set(true);
      setTimeout(() => this.celebrate.set(false), 1100);
    });
  }
}