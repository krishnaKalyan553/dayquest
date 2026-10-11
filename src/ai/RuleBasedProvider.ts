import { AIProvider, ParsedHabit, RewardSuggestion, Vibe } from './AIProvider';
import { GENERIC, Tier, resolvePersonas } from './personas';

const TIERS: Tier[] = ['small', 'medium', 'big'];
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const TIME_OF_DAY: Record<string, string> = {
  morning: '08:00',
  noon: '12:00',
  afternoon: '15:00',
  evening: '19:00',
  night: '21:00',
};

function parseTime(text: string): string | null {
  const explicit = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (explicit) {
    let hour = parseInt(explicit[1], 10);
    const minute = explicit[2] ? parseInt(explicit[2], 10) : 0;
    const meridiem = explicit[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    if (hour <= 23 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  const word = text.match(/\b(morning|noon|afternoon|evening|night)\b/i);
  return word ? TIME_OF_DAY[word[1].toLowerCase()] : null;
}

export const ruleBasedProvider: AIProvider = {
  parseHabit(text: string): ParsedHabit {
    const input = text.trim();
    const pointsMatch = input.match(/(?:worth|for|=)\s*(\d+)\s*(?:points?|pts?)?|(\d+)\s*(?:points?|pts?)/i);
    const points = pointsMatch ? parseInt(pointsMatch[1] ?? pointsMatch[2], 10) : null;
    const reminderTime = parseTime(input);

    const name = input
      .replace(/(?:worth|for|=)\s*\d+\s*(?:points?|pts?)?/gi, '')
      .replace(/\d+\s*(?:points?|pts?)/gi, '')
      .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
      .replace(/\b(?:every|each)\s+(?:day|morning|noon|afternoon|evening|night)\b/gi, '')
      .replace(/\b(?:daily|remind me to|remind me)\b/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/[,.\s]+$/g, '')
      .trim();

    const display = name ? name.charAt(0).toUpperCase() + name.slice(1) : input;
    return { name: display, points, reminderTime, confident: points !== null && name.length > 0 };
  },

  suggestRewards(vibe: Vibe): RewardSuggestion[] {
    const personas = resolvePersonas(vibe.personas, vibe.about);
    const pools = personas.length ? personas.map((p) => p.rewards) : [GENERIC.rewards];

    const out: RewardSuggestion[] = vibe.favorites.map((name) => ({ name, tier: 'medium', favorite: true }));
    for (const tier of TIERS) {
      for (let i = 0; i < 2; i += 1) {
        for (const pool of pools) {
          const name = pool[tier][i];
          if (name) out.push({ name, tier });
        }
      }
    }
    const seen = new Set<string>();
    return out.filter((r) => {
      const key = r.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  message(kind, vibe, ctx = {}) {
    const personas = resolvePersonas(vibe.personas, vibe.about);
    const lines = personas.length ? personas.flatMap((p) => p.lines[kind]) : GENERIC.lines[kind];
    return pick(lines)
      .replace('{points}', String(ctx.points ?? ''))
      .replace('{streak}', String(ctx.streak ?? ''))
      .replace('{name}', ctx.name ?? 'your reward');
  },
};
