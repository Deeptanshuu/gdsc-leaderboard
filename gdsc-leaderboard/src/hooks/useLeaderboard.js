import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import data from '../FINAL-LIST.json';
import { buildLeaderboard, computeStats, diffRanks } from '../lib/leaderboard';

const MOVER_TTL_MS = 8000;

// Live mode is opt-in: add ?live to the URL (uses VITE_API_ENDPOINT, else localhost:5000)
// or ?live=https://your-server to point at a specific backend. Otherwise the final static
// results are shown and nothing touches the network.
export function getLiveUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  if (!params.has('live')) return null;
  return params.get('live') || import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5000';
}

export function useLeaderboard({ onChanges } = {}) {
  const liveUrl = useMemo(() => getLiveUrl(), []);
  const [rawTeams, setRawTeams] = useState(data);
  const [status, setStatus] = useState(liveUrl ? 'connecting' : 'static');
  const [movers, setMovers] = useState({});
  const board = useMemo(() => buildLeaderboard(rawTeams), [rawTeams]);
  const stats = useMemo(() => computeStats(board), [board]);

  const previousRanked = useRef(board.ranked);
  const receivedLiveData = useRef(false);
  const onChangesRef = useRef(onChanges);
  useEffect(() => {
    onChangesRef.current = onChanges;
  }, [onChanges]);

  useEffect(() => {
    if (!liveUrl) return;
    const socket = io(liveUrl, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setStatus('live'));
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.on('connect_error', () => setStatus('reconnecting'));
    socket.on('leaderboard_update', (teams) => setRawTeams(teams));
    return () => socket.disconnect();
  }, [liveUrl]);

  useEffect(() => {
    const changes = diffRanks(previousRanked.current, board.ranked);
    previousRanked.current = board.ranked;
    // The first live payload just replaces the static snapshot; don't celebrate it.
    const isFirstLivePayload = liveUrl && !receivedLiveData.current && rawTeams !== data;
    if (isFirstLivePayload) receivedLiveData.current = true;
    if (!changes.length || isFirstLivePayload) return;

    onChangesRef.current?.(changes);
    const at = Date.now();
    setMovers((current) => ({
      ...current,
      ...Object.fromEntries(
        changes.map((change) => [change.id, { climbed: change.climbed, gained: change.score - change.prevScore, at }])
      ),
    }));
  }, [board, liveUrl, rawTeams]);

  // Expire ▲▼ markers after a few seconds.
  useEffect(() => {
    if (!Object.keys(movers).length) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setMovers((current) =>
        Object.fromEntries(Object.entries(current).filter(([, mover]) => now - mover.at < MOVER_TTL_MS))
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [movers]);

  return { board, stats, movers, status, liveUrl };
}
