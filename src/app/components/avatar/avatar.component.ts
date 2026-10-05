import { Component, computed, inject, input, signal } from '@angular/core';
import { BeerStoreService } from '../../core/services/beer-store.service';
import { avatarFallback, avatarFor, displayName } from '../../core/models/beer.model';

/**
 * Circular avatar used everywhere in the app.
 *  - Primary (Core 5) players: bold amber ring with a dark offset gap.
 *  - Everyone else: a thin neutral ring.
 * Falls back to a generated initials avatar if the photo is missing.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  host: { class: 'inline-flex shrink-0' },
  template: `<img [src]="src()" (error)="onError()" [alt]="label()" [class]="classes()" />`,
})
export class AvatarComponent {
  private readonly store = inject(BeerStoreService);

  readonly name = input.required<string>();
  readonly sizeClass = input('w-9 h-9');

  private readonly failedFor = signal<string | null>(null);

  readonly src = computed(() =>
    this.failedFor() === this.name() ? avatarFallback(this.name()) : avatarFor(this.name())
  );

  readonly label = computed(() => displayName(this.name()));

  readonly classes = computed(() => {
    const ring = this.store.isPrimary(this.name())
      ? 'ring-2 ring-pub-amber ring-offset-2 ring-offset-stout'
      : 'ring-1 ring-pub-border';
    return `avatar-ring ${this.sizeClass()} ${ring}`;
  });

  onError(): void {
    this.failedFor.set(this.name());
  }
}