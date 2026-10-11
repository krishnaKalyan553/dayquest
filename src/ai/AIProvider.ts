import type { Tier } from './personas';

/** What the user tells us about themselves. They control all of it. */
export type Vibe = {
  personas: string[]; // persona ids, e.g. 'gym', 'sports'
  about: string; // free text, e.g. "I play cricket on weekends and love anime"
  favorites: string[]; // rewards they already know they love
};

export type RewardSuggestion = {
  name: string;
  tier: Tier;
  /** true when it came from the user's own favourites list */
  favorite?: boolean;
};

export type ParsedHabit = {
  name: string;
  points: number | null;
  reminderTime: string | null; // 'HH:MM'
  confident: boolean;
};

/**
 * V1 is rule-based. V2 can implement this with an on-device or hosted model
 * without touching any screen code.
 */
export interface AIProvider {
  parseHabit(text: string): ParsedHabit;
  suggestRewards(vibe: Vibe): RewardSuggestion[];
  message(kind: 'checkin' | 'redeem' | 'streak', vibe: Vibe, ctx?: { points?: number; streak?: number; name?: string }): string;
}
