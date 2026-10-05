/** Usernames are lowercase, 3–20 chars, [a-z0-9]. Dynamic now (no fixed enum). */
export type Drinker = string;

export interface Player {
  username: Drinker;
  is_primary: boolean;
  created_at: string;
}

export type PlayerFilter = 'all' | 'primary';

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
  pct: number; // percent of visible group total, 0-100
  rank: number;
}

export interface RegisterResult {
  username: string;
  pin: string;
}

export const GOAL_BEERS = 1_000_000;

// ----------------------------------------------------------------------------
// Avatars — presentation-only. Photos exist only for the original 5; everyone
// else gets a generated initials avatar.
// ----------------------------------------------------------------------------
const KNOWN_AVATARS: Record<string, string> = {
  dom: 'assets/avatars/dom.jpg',
  josh: 'assets/avatars/josh.jpg',
  james: 'assets/avatars/james.jpg',
  grayson: 'assets/avatars/grayson.jpg',
  brendan: 'assets/avatars/brendan.jpg',
};

export function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=f2a71b&color=0b0908&bold=true&size=128`;
}

export function avatarFor(name: string): string {
  return KNOWN_AVATARS[name] ?? avatarFallback(name);
}

/** 'dom' -> 'Dom' */
export function displayName(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}