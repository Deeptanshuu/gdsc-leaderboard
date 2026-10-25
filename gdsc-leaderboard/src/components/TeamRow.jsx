/* eslint-disable react/prop-types */
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Flex,
  IconButton,
  Link,
  List,
  ListItem,
  SimpleGrid,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Github, Link2 } from 'lucide-react';
import { DIFFICULTIES, POINTS } from '../lib/leaderboard';
import { DIFFICULTY_COLORS, MEDALS, ORANGE } from '../lib/brand';
import { useCountUp } from '../hooks/useCountUp';

function RankBadge({ rank, tied }) {
  const medal = MEDALS[rank];
  const plainColor = useColorModeValue('black', 'white');
  return (
    <Flex direction="column" align="center" mr={3} minW="3.2rem">
      <Badge
        fontSize={{ base: 'lg', md: 'xl' }}
        bg={medal ? medal.color : 'transparent'}
        color={medal ? 'blackAlpha.800' : plainColor}
        px={2}
      >
        #{rank}
      </Badge>
      {tied && (
        <Text fontSize="2xs" fontWeight="bold" letterSpacing="widest" color={ORANGE} mt="1px">
          TIED
        </Text>
      )}
    </Flex>
  );
}

function Movement({ mover }) {
  if (!mover) return null;
  const up = mover.climbed > 0;
  return (
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
      <Flex align="center" gap={1} ml={2}>
        {mover.climbed !== 0 && (
          <Badge colorScheme={up ? 'green' : 'red'} display="flex" alignItems="center" gap="2px">
            {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(mover.climbed)}
          </Badge>
        )}
        {mover.gained > 0 && <Badge colorScheme="orange">+{mover.gained}</Badge>}
      </Flex>
    </motion.div>
  );
}

function ScoreBreakdown({ team }) {
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const lines = DIFFICULTIES.filter((level) => team.solved[level] > 0).map((level) => ({
    label: `${level[0].toUpperCase()}${level.slice(1)} × ${team.solved[level]}`,
    value: team.solved[level] * POINTS[level],
    color: DIFFICULTY_COLORS[level],
  }));
  if (team.adjustment !== 0) {
    lines.push({
      label: team.adjustment > 0 ? 'Time bonus' : 'Penalty',
      value: team.adjustment,
      color: team.adjustment > 0 ? 'teal' : 'gray',
    });
  }

  return (
    <Box>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" mb={2}>
        Score breakdown
      </Text>
      {lines.length === 0 && <Text color={labelColor}>No problems solved yet.</Text>}
      {lines.map((line) => (
        <Flex key={line.label} justify="space-between" align="center" py={1} borderBottom="1px dashed" borderColor="whiteAlpha.300">
          <Badge colorScheme={line.color} variant="subtle">{line.label}</Badge>
          <Text fontWeight="semibold" fontFamily="mono">
            {line.value > 0 ? '+' : ''}{line.value}
          </Text>
        </Flex>
      ))}
      <Flex justify="space-between" pt={2}>
        <Text fontWeight="bold">Total</Text>
        <Text fontWeight="extrabold" fontFamily="mono" color={ORANGE}>{team.score}</Text>
      </Flex>
    </Box>
  );
}

export default function TeamRow({ team, topScore, mover, isExpanded }) {
  const score = useCountUp(team.score);
  const toast = useToast();
  const textColor = useColorModeValue('black', 'gray.100');
  const panelBg = useColorModeValue('gray.100', 'gray.900');
  const hoverBg = useColorModeValue('gray.200', 'gray.800');
  const trackBg = useColorModeValue('gray.200', 'gray.700');
  const share = topScore > 0 ? Math.max(0, team.score) / topScore : 0;

  const copyLink = async (event) => {
    event.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${team.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: url, status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Copy failed', description: url, status: 'warning', duration: 4000 });
    }
  };

  return (
    <AccordionItem mb={3} border={0} id={team.slug}>
      <motion.div
        key={mover?.at ?? 'idle'}
        initial={mover ? { boxShadow: `0 0 0 3px ${ORANGE}` } : false}
        animate={{ boxShadow: '0 0 0 0px rgba(255,102,0,0)' }}
        transition={{ duration: 2.5 }}
        style={{ borderRadius: 6 }}
      >
        <AccordionButton
          _expanded={{ bg: panelBg, color: '#ff8c00' }}
          _hover={{ bg: hoverBg }}
          borderRadius="md"
          padding={{ base: 3, md: 4 }}
          flexDir="column"
          alignItems="stretch"
        >
          <Flex align="center" w="100%">
            <RankBadge rank={team.rank} tied={team.tied} />
            <Flex flex="1" align="center" minW={0} textAlign="left">
              <Text fontSize={{ base: 'md', md: 'xl' }} fontWeight="semibold" color={isExpanded ? undefined : textColor} noOfLines={2}>
                {team.name}
              </Text>
              <Movement mover={mover} />
            </Flex>
            <AvatarGroup size="sm" max={4} mx={4} display={{ base: 'none', sm: 'flex' }}>
              {team.members.map((member) => (
                <Avatar name={member} key={member} />
              ))}
            </AvatarGroup>
            <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={isExpanded ? undefined : textColor} minW="3.5rem" textAlign="right" mr={2}>
              {score}
            </Text>
            <AccordionIcon />
          </Flex>
          <Box h="4px" bg={trackBg} borderRadius="full" mt={3} overflow="hidden">
            <motion.div
              style={{ height: '100%', background: `linear-gradient(90deg, ${ORANGE}, #ffb347)`, borderRadius: 999 }}
              initial={{ width: 0 }}
              animate={{ width: `${share * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </Box>
        </AccordionButton>
      </motion.div>
      <AccordionPanel pb={4} bg={panelBg} borderBottomRadius="md" color={textColor}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={2}>
          <Box>
            <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" mb={2}>
              Team members
            </Text>
            <List spacing={3} listStyleType="none">
              {team.members.map((member) => (
                <ListItem key={member} display="flex" alignItems="center">
                  <Avatar name={member} size="sm" mr={3} />
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{member}</Text>
                </ListItem>
              ))}
            </List>
            <Flex mt={4} align="center" gap={2}>
              <Link href={`https://github.com/${team.githubUsername}`} isExternal display="flex" alignItems="center" gap={1} fontWeight="semibold" onClick={(e) => e.stopPropagation()}>
                <Github size={16} /> @{team.githubUsername}
              </Link>
              <Tooltip label="Copy link to this team" hasArrow>
                <IconButton size="xs" variant="ghost" aria-label="Copy link to this team" icon={<Link2 size={14} />} onClick={copyLink} />
              </Tooltip>
            </Flex>
          </Box>
          <ScoreBreakdown team={team} />
        </SimpleGrid>
      </AccordionPanel>
    </AccordionItem>
  );
}
