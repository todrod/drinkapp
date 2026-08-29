import { RecipeIngredient } from './types';

const FRACTIONS: Record<string, string> = {
  '0.25': '¼',
  '0.5': '½',
  '0.75': '¾',
  '0.33': '⅓',
  '0.67': '⅔',
};

/** 1.5 → "1½", 0.75 → "¾". Bar measures read better as fractions. */
export function formatAmount(amount: number | null): string {
  if (amount === null) return '';
  const whole = Math.floor(amount);
  const frac = Number((amount - whole).toFixed(2));
  const fracStr = frac > 0 ? FRACTIONS[String(frac)] ?? String(frac).replace('0.', '.') : '';
  if (whole === 0) return fracStr || '0';
  return `${whole}${fracStr}`;
}

export function formatIngredient(ing: RecipeIngredient): string {
  const amount = formatAmount(ing.amount);
  const unitless = ing.unit === 'piece' || ing.unit === 'top';
  const unit = unitless ? '' : ing.unit;
  const measure = [amount, unit].filter(Boolean).join(' ');
  return measure ? `${measure} ${ing.displayName}` : ing.displayName;
}

export function pluralize(n: number, one: string, many?: string): string {
  return n === 1 ? one : many ?? one + 's';
}
