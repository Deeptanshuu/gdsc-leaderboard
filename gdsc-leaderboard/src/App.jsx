import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accordion, Box, Flex, Input, Kbd, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import './App.css';
import Header from './Header';
import Podium from './components/Podium';
import StatsStrip from './components/StatsStrip';
import TeamRow from './components/TeamRow';
import LiveBadge from './components/LiveBadge';
import DisqualifiedList from './components/DisqualifiedList';
import Footer from './components/Footer';
import { useLeaderboard } from './hooks/useLeaderboard';
import { ordinal } from './lib/brand';
import { FOCUS_TEAM_EVENT } from './lib/vibes';

const matchesQuery = (team, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    team.name.toLowerCase().includes(q) ||
    team.githubUsername?.toLowerCase().includes(q) ||
    team.members.some((member) => member.toLowerCase().includes(q))
  );
};

const App = () => {
  const toast = useToast();
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const { board, stats, movers, feed, status, liveUrl } = useLeaderboard();

  // Toast each new live event once.
  const lastAnnounced = useRef(feed[0]?.key ?? null);
  useEffect(() => {
    const fresh = [];
    for (const event of feed) {
      if (event.key === lastAnnounced.current) break;
      fresh.push(event);
    }
    if (feed.length) lastAnnounced.current = feed[0].key;
    fresh
      .reverse()
      .filter((change) => change.score !== change.prevScore)
      .forEach((change) => {
          const moved = change.climbed > 0 ? ` and climbs to ${ordinal(change.rank)}!` : '';
          toast({
            title: `${change.name} +${change.score - change.prevScore}`,
            description: `Now at ${change.score} points${moved}`,
            status: change.climbed > 0 ? 'success' : 'info',
            position: 'bottom-right',
            duration: 4000,
          });
        });
  }, [feed, toast]);

  const bgColor = useColorModeValue('rgba(255,255,255,0.8)', 'rgba(10,4,20,0.72)');
  const cardShadow = useColorModeValue(
    '20px 20px 0 rgba(255, 102, 0, 0.85), 0 0 50px rgba(255, 102, 0, 0.2)',
    '20px 20px 0 rgba(255, 102, 0, 0.85), 0 0 80px rgba(255, 46, 136, 0.35)'
  );
  const textColor = useColorModeValue('black', 'gray.100');
  const titleTextColor = useColorModeValue('white', 'black');
  const accent = useColorModeValue('#ff6600', '#ff8c00');
  const searchBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');

  const visibleTeams = useMemo(
    () => board.ranked.filter((team) => matchesQuery(team, searchQuery)),
    [board.ranked, searchQuery]
  );

  const expandedIndexes = visibleTeams
    .map((team, index) => (expandedIds.has(team.id) ? index : -1))
    .filter((index) => index >= 0);

  const handleAccordionChange = (indexes) => {
    setExpandedIds((current) => {
      const hidden = [...current].filter((id) => !visibleTeams.some((team) => team.id === id));
      return new Set([...hidden, ...indexes.map((index) => visibleTeams[index].id)]);
    });
  };

  const focusTeam = useCallback((team) => {
    setSearchQuery('');
    setExpandedIds((current) => new Set([...current, team.id]));
    window.history.replaceState(null, '', `#${team.slug}`);
    requestAnimationFrame(() =>
      document.getElementById(team.slug)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  }, []);

  // Deep links: /#team-slug opens and scrolls to that team.
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    const team = slug && board.ranked.find((t) => t.slug === slug);
    if (team) setTimeout(() => focusTeam(team), 600);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The command palette asks for a team via a window event.
  useEffect(() => {
    const onFocusTeam = (event) => {
      const team = board.ranked.find((t) => t.slug === event.detail);
      if (team) focusTeam(team);
    };
    window.addEventListener(FOCUS_TEAM_EVENT, onFocusTeam);
    return () => window.removeEventListener(FOCUS_TEAM_EVENT, onFocusTeam);
  }, [board.ranked, focusTeam]);

  // Spotlight that follows the cursor across team rows.
  const trackSpotlight = (event) => {
    const row = event.target.closest?.('.team-row');
    if (!row) return;
    const rect = row.getBoundingClientRect();
    row.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    row.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  // "/" focuses search, Escape clears it.
  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchQuery('');
        searchRef.current.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Header />
      <div className="py-10">
        <Box
          className="board-card"
          maxW="4xl"
          mx="auto"
          bg={bgColor}
          backdropFilter="blur(16px) saturate(140%)"
          boxShadow={{ base: 'none', md: cardShadow }}
          border={{ base: 'none', md: '3px solid #ff6600' }}
          borderTop={{ base: '3px solid #ff6600', md: '3px solid #ff6600' }}
          borderBottom={{ base: '3px solid #ff6600', md: '3px solid #ff6600' }}
          borderRadius={{ base: 'none', md: '10px' }}
          overflow="hidden"
        >
          <Box px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }} color={textColor}>
            <Text
              as="h1"
              fontWeight="bold"
              fontSize={{ base: '3xl', md: '5xl' }}
              textAlign="center"
              color={titleTextColor}
              textShadow={`5px 5px 0 ${accent}, -1px -1px 0 ${accent}, 1px -1px 0 ${accent}, -1px 1px 0 ${accent}`}
            >
              <span className="glitch" data-text="Hacktoberfest">Hacktoberfest</span>
              <br />
              <span className="glitch" data-text="Leaderboard">Leaderboard</span>
            </Text>
            <LiveBadge status={status} liveUrl={liveUrl} />

            <Podium ranked={board.ranked} onSelect={focusTeam} />
            <StatsStrip stats={stats} />

            <Flex
              align="center"
              justify="center"
              mt={8}
              mb={6}
              px={{ base: 2, md: 4 }}
              py={1}
              border="1px solid"
              borderColor={accent}
              bg={searchBg}
              borderRadius="md"
            >
              <SearchIcon color={textColor} m={2} />
              <Input
                ref={searchRef}
                placeholder="Search teams, members, GitHub handles"
                aria-label="Search teams"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="unstyled"
                ml={2}
                py={2}
                color={textColor}
              />
              <Kbd display={{ base: 'none', md: 'inline-block' }}>/</Kbd>
            </Flex>

            <Accordion allowMultiple index={expandedIndexes} onChange={handleAccordionChange} onMouseMove={trackSpotlight}>
              <AnimatePresence initial={false}>
                {visibleTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 50, mass: 1 }}
                  >
                    <TeamRow
                      team={team}
                      topScore={stats.topScore}
                      mover={movers[team.id]}
                      isExpanded={expandedIndexes.includes(index)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Accordion>
            {visibleTeams.length === 0 && (
              <Text textAlign="center" color={mutedText} py={8}>
                No team matches “{searchQuery}”.
              </Text>
            )}

            <DisqualifiedList teams={board.disqualified} />
          </Box>
        </Box>
      </div>
      <Footer />
    </>
  );
};

export default App;
