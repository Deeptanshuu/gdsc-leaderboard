/* eslint-disable react/prop-types */
// One leaderboard (and at most one socket) shared by every page, the ticker and the palette.
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import data from '../FINAL-LIST.json';
import { buildLeaderboard, computeStats, diffRanks } from '../lib/leaderboard';
import { LeaderboardContext, getLiveUrl } from '../hooks/useLeaderboard';

const MOVER_TTL_MS = 8000;
const FEED_LENGTH = 20;

export default function LeaderboardProvider({ children }) {
  const liveUrl = useMemo(() => getLiveUrl(), []);
  const [rawTeams, setRawTeams] = useState(data);
  const [status, setStatus] = useState(liveUrl ? 'connecting' : 'static');
  const [movers, setMovers] = useState({});
  const [feed, setFeed] = useState([]);
  const board = useMemo(() => buildLeaderboard(rawTeams), [rawTeams]);
  const stats = useMemo(() => computeStats(board), [board]);

  const previousRanked = useRef(board.ranked);
  const receivedLiveData = useRef(false);

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

    const at = Date.now();
    setFeed((current) =>
      [...changes.map((change, i) => ({ ...change, key: `${at}-${i}`, at })), ...current].slice(0, FEED_LENGTH)
    );
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

  const value = useMemo(
    () => ({ board, stats, movers, feed, status, liveUrl }),
    [board, stats, movers, feed, status, liveUrl]
  );
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}
