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
