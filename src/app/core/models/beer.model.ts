export const DRINKERS = ['Dom', 'Josh', 'James', 'Grayson', 'Brendan'] as const;
export type Drinker = (typeof DRINKERS)[number];

export interface BeerLog {
  id: string;
  drinker: Drinker;
  count: number;
  note: string | null;
  created_at: string; // ISO timestamp
}

export interface LeaderboardEntry {
  drinker: Drinker;
  total: number;
  pct: number; // percent of group total, 0-100
  rank: number;
}

export const GOAL_BEERS = 1_000_000;

// ----------------------------------------------------------------------------
// Avatars — presentation-only config, safe to edit freely.
// Easy photo swap: drop real photos into /src/assets/avatars/ and these paths
// will just work. No other code needs to change.
// ----------------------------------------------------------------------------
export const FRIEND_AVATARS: Record<Drinker, string> = {
  Dom: 'assets/avatars/dom.jpg',
  Josh: 'assets/avatars/josh.jpg',
  James: 'assets/avatars/james.jpg',
  Grayson: 'assets/avatars/grayson.jpg',
  Brendan: 'assets/avatars/brendan.jpg',
};

/**
 * Until real photos exist at the paths above, the <img (error)> handler in
 * templates falls back to this generated initials avatar, so the UI looks
 * complete immediately.
 */
export function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=f2a71b&color=0b0908&bold=true&size=128`;
}
