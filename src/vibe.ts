import { Vibe } from './ai/AIProvider';
import { getProfileValue, setProfileValue } from './database/habits';

const split = (value: string | null) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function isOnboarded(): boolean {
  return getProfileValue('onboarded') === '1';
}

export function loadVibe(): Vibe {
  return {
    personas: split(getProfileValue('personas')),
    about: getProfileValue('about') ?? '',
    favorites: split(getProfileValue('favorites')),
  };
}

export function saveVibe(vibe: Vibe) {
  setProfileValue('personas', vibe.personas.join(','));
  setProfileValue('about', vibe.about.trim());
  setProfileValue('favorites', vibe.favorites.join(','));
  setProfileValue('onboarded', '1');
}

export { split as splitList };
