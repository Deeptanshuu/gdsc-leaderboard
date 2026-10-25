// ⌘K / Ctrl+K palette: jump to any team or page, flip the theme, go live, engage HYPER MODE.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Input, Kbd, Modal, ModalContent, ModalOverlay, Text, useColorMode, useColorModeValue, useToast } from '@chakra-ui/react';
import { CornerDownLeft, LayoutList, Link2, Moon, Radio, Search, Sparkles, Sun, Trophy, Users, Zap } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { hyperMode, paletteOpen, requestFocusTeam, useToggle } from '../lib/vibes';
import { ORANGE } from '../lib/brand';

export default function CommandPalette() {
  const [isOpen, setOpen] = useToggle(paletteOpen);
  const [hyper, setHyper] = useToggle(hyperMode);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const { board, liveUrl } = useLeaderboard();

  const bg = useColorModeValue('rgba(255,255,255,0.88)', 'rgba(16,8,30,0.88)');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const activeBg = useColorModeValue('rgba(255,102,0,0.12)', 'rgba(255,102,0,0.2)');

  const commands = useMemo(() => {
    const go = (path) => () => navigate(path);
    return [
      { group: 'Pages', label: 'Leaderboard', icon: Trophy, run: go('/') },
      { group: 'Pages', label: 'Final reveal (projector mode)', icon: Sparkles, run: go('/reveal') },
      { group: 'Pages', label: 'Classic view', icon: LayoutList, run: go('/lb') },
      { group: 'Actions', label: hyper ? 'Disengage HYPER MODE' : 'Engage HYPER MODE', icon: Zap, run: () => setHyper((v) => !v) },
      { group: 'Actions', label: `Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`, icon: colorMode === 'dark' ? Sun : Moon, run: toggleColorMode },
      {
        group: 'Actions',
        label: liveUrl ? 'Leave live mode' : 'Go live (stream from server)',
        icon: Radio,
        run: () => window.location.assign(liveUrl ? window.location.pathname : `${window.location.pathname}?live`),
      },
      {
        group: 'Actions',
        label: 'Copy link to this page',
        icon: Link2,
        run: () => navigator.clipboard?.writeText(window.location.href).then(() => toast({ title: 'Link copied', status: 'success', duration: 1500 })),
      },
      ...board.ranked.map((team) => ({
        group: 'Teams',
        label: team.name,
        hint: `#${team.rank} · ${team.score} pts`,
        keywords: `${team.githubUsername} ${team.members.join(' ')}`,
        icon: Users,
        run: () => {
          if (window.location.pathname === '/') requestFocusTeam(team.slug);
          else navigate(`/#${team.slug}`);
        },
      })),
    ];
  }, [board.ranked, colorMode, hyper, liveUrl, navigate, setHyper, toast, toggleColorMode]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords || ''} ${c.group}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    setSelected(0);
  }, [query, isOpen]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const runCommand = (command) => {
    close();
    command?.run();
  };

  const onInputKey = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(results[selected]);
    }
  };

  let lastGroup = null;

  return (
    <Modal isOpen={isOpen} onClose={close} size="xl" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
      <ModalContent
        mt="12vh"
        mx={3}
        bg={bg}
        backdropFilter="blur(20px) saturate(180%)"
        border="1px solid rgba(255,102,0,0.5)"
        boxShadow="0 0 0 1px rgba(255,102,0,0.2), 0 30px 80px rgba(255,46,136,0.25)"
        borderRadius="xl"
        overflow="hidden"
      >
        <Flex align="center" px={4} borderBottom="1px solid rgba(255,102,0,0.3)">
          <Search size={18} color={ORANGE} />
          <Input
            autoFocus
            variant="unstyled"
            placeholder="Search teams, members, pages, actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            py={4}
            px={3}
            fontSize="md"
            aria-label="Command search"
          />
          <Kbd fontSize="2xs">Esc</Kbd>
        </Flex>
        <Box ref={listRef} maxH="50vh" overflowY="auto" py={2} role="listbox">
          {results.length === 0 && (
            <Text px={4} py={6} textAlign="center" color={muted}>Nothing matches “{query}”.</Text>
          )}
          {results.map((command, index) => {
            const header = command.group !== lastGroup ? command.group : null;
            lastGroup = command.group;
            const Icon = command.icon;
            const active = index === selected;
            return (
              <Box key={`${command.group}-${command.label}`}>
                {header && (
                  <Text px={4} pt={2} pb={1} fontSize="2xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" color={muted}>
                    {header}
                  </Text>
                )}
                <Flex
                  data-index={index}
                  role="option"
                  aria-selected={active}
                  align="center"
                  gap={3}
                  mx={2}
                  px={3}
                  py={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={active ? activeBg : 'transparent'}
                  borderLeft="3px solid"
                  borderColor={active ? ORANGE : 'transparent'}
                  onMouseMove={() => setSelected(index)}
                  onClick={() => runCommand(command)}
                >
                  <Box color={active ? ORANGE : muted}><Icon size={16} /></Box>
                  <Text flex="1" fontWeight={active ? 'semibold' : 'normal'} noOfLines={1}>{command.label}</Text>
                  {command.hint && <Text fontSize="xs" color={muted} fontFamily="mono">{command.hint}</Text>}
                  {active && <CornerDownLeft size={14} color={ORANGE} />}
                </Flex>
              </Box>
            );
          })}
        </Box>
      </ModalContent>
    </Modal>
  );
}
