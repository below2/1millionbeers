import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { PlayerSelectComponent } from '../player-select/player-select.component';
import { Drinker, displayName } from '../../core/models/beer.model';

@Component({
  selector: 'app-log-beer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerSelectComponent],
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

      <!-- Drinker dropdown (primary players first, then alphabetical) -->
      <div class="mb-5">
        <div class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
          Who's drankin?
        </div>
        <app-player-select
          [players]="store.players()"
          [(value)]="selectedDrinker"
          placeholder="Pick your name..."
        />
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
          placeholder="e.g. shower beer or poopoopeepee"
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
          Personal PINs only work for your own name
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

  // Pre-select whoever last used / registered on this device.
  readonly selectedDrinker = signal<Drinker | null>(this.store.getSavedUsername());
  readonly count = signal(1);
  note = '';
  pin = this.store.getSavedPin() ?? '';

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pinRemembered = signal(!!this.store.getSavedPin());

  // Purely cosmetic celebration state — no business logic involved.
  readonly celebrate = signal(false);
  readonly lastLoggedCount = signal(1);

  canSubmit(): boolean {
    return (
      !!this.selectedDrinker() &&
      this.count() >= 1 &&
      this.count() <= 24 &&
      this.pin.trim().length > 0
    );
  }

  setCustomCount(value: number): void {
    const n = Math.max(1, Math.min(24, Math.round(Number(value) || 1)));
    this.count.set(n);
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