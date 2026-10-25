import { createContext, useContext } from 'react';

export const LeaderboardContext = createContext(null);

// Live mode is opt-in: add ?live to the URL (uses VITE_API_ENDPOINT, else localhost:5000)
// or ?live=https://your-server to point at a specific backend. Otherwise the final static
// results are shown and nothing touches the network.
export function getLiveUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  if (!params.has('live')) return null;
  return params.get('live') || import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5000';
}

// { board, stats, movers, feed, status, liveUrl } from the nearest LeaderboardProvider.
export function useLeaderboard() {
  const value = useContext(LeaderboardContext);
  if (!value) throw new Error('useLeaderboard must be used inside <LeaderboardProvider>');
  return value;
}
