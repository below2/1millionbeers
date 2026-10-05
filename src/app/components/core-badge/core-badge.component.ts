import { Component } from '@angular/core';

/** Tiny, understated chip marking the original 5 drinkers. */
@Component({
  selector: 'app-core-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center gap-0.5 shrink-0 bg-stout text-pub-amber border border-pub-amber
             rounded-full px-1.5 py-px text-[9px] font-black uppercase tracking-wider leading-none"
      title="Core 5 — original drinker"
    >
      ★ Core
    </span>
  `,
})
export class CoreBadgeComponent {}