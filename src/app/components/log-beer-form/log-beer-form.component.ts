import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { DRINKERS, Drinker } from '../../core/models/beer.model';

@Component({
    selector: 'app-log-beer-form',
    imports: [CommonModule, FormsModule],
    standalone: true,
    template: `
    <section class="card p-5 sm:p-6">
      <h2 class="font-display text-lg font-bold text-pub-amber mb-4">🍻 Log a Beer</h2>

      <!-- Drinker pills -->
      <div class="mb-4">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2">Who's drinking?</label>
        <div class="flex flex-wrap gap-2">
          @for (name of drinkers; track name) {
            <button
              type="button"
              class="pill-btn"
              [class.pill-btn-active]="selectedDrinker() === name"
              (click)="selectedDrinker.set(name)"
            >
              {{ name }}
            </button>
          }
        </div>
      </div>

      <!-- Quantity -->
      <div class="mb-4">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2">How many?</label>
        <div class="flex items-center gap-2">
          <button type="button" class="pill-btn" [class.pill-btn-active]="count() === 1" (click)="count.set(1)">+1</button>
          <button type="button" class="pill-btn" [class.pill-btn-active]="count() === 2" (click)="count.set(2)">+2</button>
          <input
            type="number"
            min="1"
            max="24"
            class="w-20 bg-pub-surface2 border border-pub-border rounded-full px-3 py-2 text-center text-sm focus:outline-none focus:border-pub-amber"
            [ngModel]="count()"
            (ngModelChange)="setCustomCount($event)"
          />
          <span class="text-xs text-pub-foam/40">(max 24)</span>
        </div>
      </div>

      <!-- Note -->
      <div class="mb-4">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2">Note (optional)</label>
        <input
          type="text"
          maxlength="140"
          placeholder="e.g. Guinness, shower beer..."
          class="w-full bg-pub-surface2 border border-pub-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pub-amber"
          [(ngModel)]="note"
        />
      </div>

      <!-- PIN -->
      <div class="mb-5">
        <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2">
          PIN
          @if (pinRemembered()) {
            <span class="text-pub-amber/70 normal-case">(remembered on this device)</span>
          }
        </label>
        <input
          type="password"
          inputmode="numeric"
          placeholder="Enter shared PIN"
          class="w-full bg-pub-surface2 border border-pub-border rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:border-pub-amber"
          [(ngModel)]="pin"
        />
      </div>

      @if (errorMessage()) {
        <p class="text-red-400 text-sm mb-3">⚠️ {{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="text-green-400 text-sm mb-3">✅ {{ successMessage() }}</p>
      }

      <button
        type="button"
        class="w-full py-3 rounded-xl bg-pub-amber text-pub-bg font-bold tracking-wide
               hover:bg-pub-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="!canSubmit() || store.submitting()"
        (click)="submit()"
      >
        {{ store.submitting() ? 'Pouring...' : 'Log it 🍺' }}
      </button>
    </section>
  `
})
export class LogBeerFormComponent {
  readonly store = inject(BeerStoreService);
  readonly drinkers = DRINKERS;

  readonly selectedDrinker = signal<Drinker | null>(null);
  readonly count = signal(1);
  note = '';
  pin = this.store.getSavedPin() ?? '';

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly pinRemembered = signal(!!this.store.getSavedPin());

  canSubmit(): boolean {
    return !!this.selectedDrinker() && this.count() >= 1 && this.count() <= 24 && this.pin.trim().length > 0;
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

    const result = await this.store.logBeer({
      drinker,
      count: this.count(),
      pin: this.pin.trim(),
      note: this.note.trim() || null,
    });

    if (result.success) {
      this.successMessage.set(`Logged ${this.count()} for ${drinker}!`);
      this.pinRemembered.set(true);
      this.note = '';
      this.count.set(1);
      setTimeout(() => this.successMessage.set(null), 3000);
    } else {
      this.errorMessage.set(result.message ?? 'Failed to log beer.');
    }
  }
}
