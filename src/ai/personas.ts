import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type Tier = 'small' | 'medium' | 'big';

type Lines = { checkin: string[]; streak: string[]; redeem: string[] };

export type Persona = {
  id: string;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Words in the "about you" text that imply this persona. */
  keywords: string[];
  rewards: Record<Tier, string[]>;
  lines: Lines;
};

export const PERSONAS: Persona[] = [
  {
    id: 'gym',
    label: 'Gym & fitness',
    icon: 'dumbbell',
    keywords: ['gym', 'lift', 'workout', 'fitness', 'run', 'running', 'crossfit', 'yoga', 'cardio'],
    rewards: {
      small: ['Post-workout smoothie', 'Sauna or steam session'],
      medium: ['New workout gear', 'Massage or recovery session'],
      big: ['Gym wear haul', 'Weekend fitness retreat'],
    },
    lines: {
      checkin: ['Rep logged. +{points}.', 'Stronger than yesterday. +{points}.'],
      streak: ['{streak} days without skipping. Beast mode.', '{streak}-day streak. Consistency builds muscle.'],
      redeem: ['Recovery earned: {name}.', '{name}. You trained for it.'],
    },
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: 'basketball',
    keywords: ['sport', 'sports', 'cricket', 'football', 'soccer', 'basketball', 'tennis', 'badminton', 'swim', 'swimming', 'match'],
    rewards: {
      small: ['Watch a live match tonight', 'Post-game snack run'],
      medium: ['New jersey or gear', 'Pickup game with friends'],
      big: ['Tickets to a live match', 'Weekend sports trip'],
    },
    lines: {
      checkin: ['Point scored! +{points}.', 'Game on. +{points}.'],
      streak: ['{streak} wins in a row. On a roll.', '{streak}-day winning streak.'],
      redeem: ['Victory lap: {name}.', '{name}. MVP move.'],
    },
  },
  {
    id: 'gamer',
    label: 'Gamer',
    icon: 'controller-classic',
    keywords: ['game', 'gaming', 'gamer', 'ps5', 'xbox', 'steam', 'esports', 'minecraft'],
    rewards: {
      small: ['One hour of guilt-free gaming', 'In-game cosmetic'],
      medium: ['Buy a new game', 'Gaming marathon evening'],
      big: ['New controller or accessory', 'Gaming weekend, no plans'],
    },
    lines: {
      checkin: ['XP gained: +{points}.', 'Quest complete! +{points}.'],
      streak: ['{streak}-day combo. Keep it going.', 'Streak x{streak}. Bonus round unlocked.'],
      redeem: ['Loot claimed: {name}.', '{name} unlocked.'],
    },
  },
  {
    id: 'foodie',
    label: 'Foodie',
    icon: 'food',
    keywords: ['food', 'foodie', 'eat', 'pizza', 'cook', 'cooking', 'coffee', 'baking', 'restaurant'],
    rewards: {
      small: ['Fancy coffee', 'Favourite dessert'],
      medium: ['Order pizza', 'Try a new restaurant'],
      big: ['Tasting-menu dinner', 'Cooking class'],
    },
    lines: {
      checkin: ['Earned a bite: +{points}.', 'Tastier already. +{points}.'],
      streak: ['{streak} days of discipline. Dessert is closer.', '{streak}-day streak, well seasoned.'],
      redeem: ['Bon appétit: {name}.', '{name}. Savour it.'],
    },
  },
  {
    id: 'movies',
    label: 'Movies & shows',
    icon: 'movie-open',
    keywords: ['movie', 'movies', 'film', 'cinema', 'netflix', 'anime', 'series', 'tv', 'shows'],
    rewards: {
      small: ['Watch an episode, guilt-free', 'Popcorn night in'],
      medium: ['Movie night with snacks', 'Cinema trip'],
      big: ['Series binge weekend', 'Premium cinema plus dinner'],
    },
    lines: {
      checkin: ['Cut! Great take. +{points}.', 'Scene complete. +{points}.'],
      streak: ['{streak}-day streak. Sequel confirmed.', '{streak} days running. Binge-worthy.'],
      redeem: ['Showtime: {name}.', '{name}. Roll credits on the guilt.'],
    },
  },
  {
    id: 'reader',
    label: 'Reader & learner',
    icon: 'book-open-variant',
    keywords: ['read', 'reading', 'book', 'books', 'study', 'learn', 'learning', 'student', 'course'],
    rewards: {
      small: ['Buy a new ebook', 'Coffee and a reading hour'],
      medium: ['New book haul', 'Online course you wanted'],
      big: ['Reading nook upgrade', 'E-reader or tablet fund'],
    },
    lines: {
      checkin: ['Page turned. +{points}.', 'Smarter by the day. +{points}.'],
      streak: ['{streak} days of learning. Chapter after chapter.', '{streak}-day streak. Plot thickening.'],
      redeem: ['Well-read reward: {name}.', '{name}. You earned this chapter.'],
    },
  },
  {
    id: 'traveler',
    label: 'Traveller',
    icon: 'airplane',
    keywords: ['travel', 'traveling', 'trip', 'trips', 'hike', 'hiking', 'explore', 'adventure', 'road trip'],
    rewards: {
      small: ['Plan the next trip for 30 minutes', 'Try a new neighbourhood'],
      medium: ['Day trip somewhere new', 'Overnight stay nearby'],
      big: ['Weekend getaway', 'Top up the big-trip fund'],
    },
    lines: {
      checkin: ['One step closer to the trip. +{points}.', 'Miles earned: +{points}.'],
      streak: ['{streak} days. The map is filling in.', '{streak}-day streak. Boarding soon.'],
      redeem: ['Bon voyage: {name}.', '{name}. Pack your bag.'],
    },
  },
  {
    id: 'music',
    label: 'Music',
    icon: 'music',
    keywords: ['music', 'guitar', 'piano', 'concert', 'band', 'sing', 'singing', 'playlist', 'drums'],
    rewards: {
      small: ['New album, full attention', 'Build a fresh playlist'],
      medium: ['Vinyl or headphone upgrade', 'Open-mic night out'],
      big: ['Concert ticket', 'New instrument fund'],
    },
    lines: {
      checkin: ['Right on the beat. +{points}.', 'Nice riff. +{points}.'],
      streak: ['{streak} days in rhythm.', '{streak}-day streak. Encore.'],
      redeem: ['Turn it up: {name}.', '{name}. Front row.'],
    },
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: 'palette',
    keywords: ['art', 'draw', 'drawing', 'paint', 'write', 'writing', 'design', 'craft', 'photography', 'create'],
    rewards: {
      small: ['Supplies treat', 'A free afternoon to make things'],
      medium: ['New tool or app subscription', 'Gallery or museum visit'],
      big: ['Workshop or class', 'Studio or gear upgrade'],
    },
    lines: {
      checkin: ['Made something. +{points}.', 'Another stroke. +{points}.'],
      streak: ['{streak} days of making things.', '{streak}-day streak. Portfolio growing.'],
      redeem: ['Inspiration fuel: {name}.', '{name}. Go create.'],
    },
  },
  {
    id: 'homebody',
    label: 'Homebody',
    icon: 'sofa',
    keywords: ['home', 'homebody', 'cozy', 'sleep', 'relax', 'chill', 'quiet'],
    rewards: {
      small: ['Sleep in', 'Long bath evening'],
      medium: ['Cozy day: blanket, snacks, no plans', 'Order in and watch something'],
      big: ['Home spa day', 'Room upgrade'],
    },
    lines: {
      checkin: ['Cozy win. +{points}.', 'Quietly crushing it. +{points}.'],
      streak: ['{streak} calm days in a row.', '{streak}-day streak, from the couch to greatness.'],
      redeem: ['Settle in: {name}.', '{name}. Pure comfort.'],
    },
  },
  {
    id: 'tech',
    label: 'Tech & builder',
    icon: 'laptop',
    keywords: ['code', 'coding', 'programming', 'developer', 'tech', 'gadget', 'build', 'startup', 'hacking'],
    rewards: {
      small: ['New app or tool to try', 'Tech video binge'],
      medium: ['Gadget accessory', 'Side-project day'],
      big: ['Gadget upgrade fund', 'Conference or course ticket'],
    },
    lines: {
      checkin: ['Commit pushed. +{points}.', 'Build passing. +{points}.'],
      streak: ['{streak}-day streak. Zero downtime.', '{streak} days shipped.'],
      redeem: ['Deployed: {name}.', '{name}. Merged and earned.'],
    },
  },
  {
    id: 'shopper',
    label: 'Fashion & shopping',
    icon: 'shopping',
    keywords: ['shop', 'shopping', 'fashion', 'style', 'clothes', 'sneakers', 'outfit'],
    rewards: {
      small: ['A small treat for yourself', 'New accessory'],
      medium: ['Shopping trip with a budget', 'New outfit'],
      big: ['That thing you have been eyeing', 'Wardrobe refresh'],
    },
    lines: {
      checkin: ['Cha-ching: +{points}.', 'Style points. +{points}.'],
      streak: ['{streak} days of discipline. Worth the splurge.', '{streak}-day streak, well dressed too.'],
      redeem: ['Treat yourself: {name}.', '{name}. Add to cart, guilt-free.'],
    },
  },
];

export const GENERIC: { rewards: Record<Tier, string[]>; lines: Lines } = {
  rewards: {
    small: ['Favourite dessert', 'Sleep in'],
    medium: ['Movie night', 'Order your favourite food'],
    big: ['Weekend trip fund', 'A guilt-free lazy day out'],
  },
  lines: {
    checkin: ['Done. +{points}.', 'Nice work. +{points}.'],
    streak: ['{streak} days in a row.', '{streak}-day streak. Keep going.'],
    redeem: ['Enjoy {name}. You earned it.'],
  },
};

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);

/** Personas chosen explicitly plus any implied by the free-text "about you". */
export function resolvePersonas(chosen: string[], about: string): Persona[] {
  const ids = new Set(chosen);
  const words: string[] = about.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const p of PERSONAS) {
    if (p.keywords.some((k) => words.includes(k))) ids.add(p.id);
  }
  return PERSONAS.filter((p) => ids.has(p.id));
}
