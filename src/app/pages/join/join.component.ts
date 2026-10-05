import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { RegisterResult, displayName } from '../../core/models/beer.model';

const USERNAME_RE = /^[a-zA-Z0-9]{3,20}$/;

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen px-4 py-6 sm:px-6 sm:py-10 max-w-xl mx-auto space-y-6">
      <a
        routerLink="/"
        class="inline-block text-xs font-bold uppercase tracking-widest text-pub-foam/60 hover:text-pub-amber"
      >
        ← Back to the challenge
      </a>

      @if (result(); as r) {
        <!-- SUCCESS: show PIN once -->
        <section class="card-amber p-6 sm:p-8 text-center">
          <p class="text-4xl mb-2">🎉</p>
          <h1 class="font-arcade font-black text-2xl uppercase tracking-wide mb-1">
            Welcome, {{ name(r.username) }}!
          </h1>
          <p class="text-sm font-semibold mb-5">You're in the race. Here's your personal PIN:</p>

          <div
            class="bg-stout text-neon font-mono font-black text-5xl sm:text-6xl tracking-[0.3em]
                   rounded-2xl border-3 border-stout py-5 mb-4 select-all"
          >
            {{ r.pin }}
          </div>

          <p class="font-arcade font-black uppercase text-sm sm:text-base mb-1">
            Save this PIN! You will need it to log beers.
          </p>
          <p class="text-xs font-semibold opacity-80 mb-5">
            It's only shown once. We saved it on this device, but write it down in case you switch phones.
          </p>
          <p class="text-xs font-semibold opacity-80 mb-5">
            (seriously please save this otherwise youre gonna have to register again or youre gonna have to figure out how to ask me to give you the pin which will be annoying and i dont wanna do it plz)
          </p>

          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" class="btn-brutal" (click)="copyPin(r)">
              {{ copied() ? '✅ Copied' : '📋 Copy PIN' }}
            </button>
            <a routerLink="/" class="btn-brutal btn-brutal-active text-center">Back to Challenge</a>
          </div>
        </section>
      } @else {
        <!-- REGISTRATION FORM -->
        <section class="card p-6 sm:p-8">
          <h1 class="font-arcade font-black text-2xl text-pub-amber uppercase tracking-wide mb-1">
            🍻 Join the Challenge
          </h1>
          <p class="text-sm text-pub-foam/60 mb-6">
            Pick a username and we'll hand you a personal PIN for logging your own beers.
          </p>

          <label class="block text-xs uppercase tracking-wide text-pub-foam/50 mb-2 font-bold">
            Username
          </label>
          <input
            type="text"
            maxlength="20"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            placeholder="3–20 letters or numbers"
            class="w-full bg-pub-surface2 border-3 border-stout rounded-xl px-3 py-2 text-sm
                   focus:outline-none focus:border-pub-amber"
            [ngModel]="username()"
            (ngModelChange)="onUsernameChange($event)"
            (keyup.enter)="submit()"
          />

          <p
            class="text-xs mt-2 min-h-4 font-bold"
            [ngClass]="hint() ? 'text-red-400' : 'text-pub-foam/40'"
          >
            {{ hint() || 'Usernames are lowercase. Letters and numbers only.' }}
          </p>

          @if (error()) {
            <p class="text-red-400 text-sm mt-3 font-bold">⚠️ {{ error() }}</p>
          }

          <button
            type="button"
            class="btn-primary text-base sm:text-lg mt-5"
            [disabled]="!valid() || store.submitting()"
            (click)="submit()"
          >
            {{ store.submitting() ? 'Registering...' : "Let's go 🍺" }}
          </button>
        </section>
      }
    </div>
  `,
})
export class JoinComponent {
  readonly store = inject(BeerStoreService);
  readonly name = displayName;

  readonly username = signal('');
  readonly error = signal<string | null>(null);
  readonly result = signal<RegisterResult | null>(null);
  readonly copied = signal(false);

  readonly valid = computed(() => USERNAME_RE.test(this.username().trim()));

  readonly hint = computed(() => {
    const v = this.username().trim();
    if (v.length === 0) return '';
    if (!/^[a-zA-Z0-9]+$/.test(v)) return 'Letters and numbers only — no spaces or symbols.';
    if (v.length < 3) return 'At least 3 characters.';
    if (v.length > 20) return 'Max 20 characters.';
    return '';
  });

  onUsernameChange(value: string): void {
    this.username.set(value ?? '');
    this.error.set(null);
  }

  async submit(): Promise<void> {
    if (!this.valid() || this.store.submitting()) return;
    this.error.set(null);

    const res = await this.store.registerDrinker(this.username().trim().toLowerCase());
    if (res.success) {
      this.result.set(res.result);
    } else {
      this.error.set(res.message);
    }
  }

  async copyPin(r: RegisterResult): Promise<void> {
    try {
      await navigator.clipboard.writeText(r.pin);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* clipboard blocked — the PIN is selectable on screen */
    }
  }
}