export const ORANGE = '#ff6600';
export const ORANGE_LIGHT = '#ff8c00';

export const MEDALS = {
  1: { label: 'Gold', color: '#f6c343', deep: '#b8860b' },
  2: { label: 'Silver', color: '#c4cad3', deep: '#6b7280' },
  3: { label: 'Bronze', color: '#d48a4f', deep: '#8b4513' },
};

export const DIFFICULTY_COLORS = { hard: 'red', medium: 'orange', easy: 'green' };

export const ordinal = (n) => {
  const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th' }[new Intl.PluralRules('en', { type: 'ordinal' }).select(n)];
  return `${n}${suffix}`;
};
