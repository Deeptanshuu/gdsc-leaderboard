// Tiny global toggles shared across the tree without prop drilling.
import { useSyncExternalStore } from 'react';

function createToggle(initial = false) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set: (next) => {
      value = typeof next === 'function' ? next(value) : next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const hyperMode = createToggle(false);
export const paletteOpen = createToggle(false);

export function useToggle(store) {
  return [useSyncExternalStore(store.subscribe, store.get), store.set];
}

// Ask the board page to open and scroll to a team (used by the command palette).
export const FOCUS_TEAM_EVENT = 'leaderboard:focus-team';
export const requestFocusTeam = (slug) => window.dispatchEvent(new CustomEvent(FOCUS_TEAM_EVENT, { detail: slug }));
