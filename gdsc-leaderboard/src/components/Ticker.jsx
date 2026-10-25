// Scrolling news ticker of headlines generated from the current standings (and live events).
import { Fragment, useMemo } from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { ORANGE, ordinal } from '../lib/brand';

function buildHeadlines({ board, stats, feed, status }) {
  const { ranked, disqualified } = board;
  const [first, second] = ranked;
  const lines = [];

  if (status === 'live') lines.push({ tag: 'ON AIR', text: 'Streaming live from the webhook server' });
  feed.filter((event) => event.score !== event.prevScore).slice(0, 5).forEach((event) => {
    const gained = event.score - event.prevScore;
    lines.push({
      tag: 'BREAKING',
      text: `${event.name} ${gained > 0 ? '+' : ''}${gained}${event.climbed > 0 ? `, storms up to ${ordinal(event.rank)}` : ''}`,
    });
  });
  if (first) lines.push({ tag: 'LEADER', text: `${first.name} on top with ${first.score} pts` });
  if (first && second) lines.push({ tag: 'GAP', text: `${first.score - second.score} pts between #1 and #2` });

  const groups = new Map();
  ranked.forEach((team) => groups.set(team.score, [...(groups.get(team.score) || []), team.name]));
  [...groups.entries()]
    .filter(([, names]) => names.length > 1)
    .forEach(([score, names]) => lines.push({ tag: 'DEADLOCK', text: `${names.join(' & ')} locked at ${score}` }));

  lines.push({ tag: 'STATS', text: `${stats.problemsSolved} problems solved by ${stats.hackers} hackers` });
  if (disqualified.length) lines.push({ tag: 'RIP', text: `${disqualified.length} teams disqualified` });
  lines.push({ tag: 'CREDITS', text: 'Made by Deeptanshu Lal' });
  return lines;
}

export default function Ticker() {
  const leaderboard = useLeaderboard();
  const lines = useMemo(() => buildHeadlines(leaderboard), [leaderboard]);
  const glass = useColorModeValue('rgba(255,255,255,0.55)', 'rgba(14,6,28,0.5)');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const renderLines = (copy) =>
    lines.map((line, i) => (
      <Fragment key={`${copy}-${i}`}>
        <Text as="span" bg={ORANGE} color="black" px={1.5} mr={2} borderRadius="sm" fontWeight="black">
          {line.tag}
        </Text>
        <Text as="span" mr={10}>{line.text}</Text>
      </Fragment>
    ));

  return (
    <Box maxW="6xl" mx="auto" mt={2} px={{ base: 2, md: 4 }} position="relative" zIndex={1}>
      <Box
        className="ticker"
        bg={glass}
        backdropFilter="blur(12px)"
        borderRadius="full"
        border="1px solid rgba(255,102,0,0.35)"
        overflow="hidden"
        py={1.5}
        color={textColor}
        fontFamily="'JetBrains Mono', monospace"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="wider"
        aria-label="Leaderboard headlines"
        role="marquee"
      >
        <Box className="ticker-track" style={{ animationDuration: `${Math.max(30, lines.length * 6)}s` }}>
          <Box as="span" display="inline-flex" alignItems="center" pl={4}>{renderLines('a')}</Box>
          <Box as="span" display="inline-flex" alignItems="center" pl={4} aria-hidden="true">{renderLines('b')}</Box>
        </Box>
      </Box>
    </Box>
  );
}
