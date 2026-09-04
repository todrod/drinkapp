import { Method, Role, Unit } from '../types';

/**
 * Authoring shape for bundled recipes, shared by recipes.ts and library.ts.
 *
 * Tuple form keeps a 60-recipe file readable:
 *   [catalogId, amount, unit, role, optional?]
 */
export type Ing =
  | [string, number | null, Unit, Role]
  | [string, number | null, Unit, Role, true];

export type Seed = {
  name: string;
  method: Method;
  glass: string;
  ing: Ing[];
  steps: string[];
  garnish?: string;
  tags: string[];
  accent: string;
  /** Book attribution, for recipes drawn from a published source. */
  source?: string;
  /** Themed collection id, see THEMES. */
  theme?: string;
};

export interface ThemeDef {
  id: string;
  label: string;
  icon: string;
  accent: string;
  blurb: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'middle-earth',
    label: 'Middle-earth',
    icon: '🧝',
    accent: '#C6FF3D',
    blurb: 'Long dark nights, second breakfasts and things best not woken.',
  },
  {
    id: 'fairytale',
    label: 'Fairytale',
    icon: '🏰',
    accent: '#FF3DBE',
    blurb: 'Poisoned apples, glass slippers and midnight deadlines.',
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    icon: '🚀',
    accent: '#33E6FF',
    blurb: 'Cantina pours for a long way from home.',
  },
  {
    id: 'spooky',
    label: 'Spooky',
    icon: '🎃',
    accent: '#FFB43D',
    blurb: 'Amaro, absinthe and apple brandy after dark.',
  },
];

export const THEME_BY_ID: Record<string, ThemeDef> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);
