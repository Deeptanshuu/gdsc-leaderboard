/* eslint-disable react/prop-types */
// Awards-show mode for a projector: reveals the final standings from last place to first,
// with a drumroll before each podium spot and confetti for the champions.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, Box, Button, Flex, HStack, Kbd, Link, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useCountUp } from '../hooks/useCountUp';
import { MEDALS, ORANGE, ordinal } from '../lib/brand';

const MotionBox = motion(Box);
const DRUMROLL_MS = { 1: 3600, 2: 2200, 3: 2200 };

function championConfetti() {
  const end = Date.now() + 4000;
  const colors = [ORANGE, MEDALS[1].color, '#ffffff', '#4285F4', '#34A853', '#EA4335'];
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 200, spread: 160, startVelocity: 45, origin: { y: 0.4 }, colors, disableForReducedMotion: true });
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

const placeLabel = (team) => `${team.tied ? 'Tied for ' : 'In '}${ordinal(team.rank)} place`;

function Intro({ stats }) {
  return (
    <MotionBox key="intro" textAlign="center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
      <Text as="h1" fontSize={{ base: '4xl', md: '7xl' }} color="black" lineHeight="1.1"
        textShadow={`6px 6px 0 ${ORANGE}, -2px -2px 0 ${ORANGE}, 2px -2px 0 ${ORANGE}, -2px 2px 0 ${ORANGE}, 2px 2px 0 ${ORANGE}`}
      >
        The Final<br />Reveal
      </Text>
      <Text mt={8} fontSize={{ base: 'lg', md: '2xl' }} color="gray.300">
        {stats.teams} teams · {stats.hackers} hackers · {stats.problemsSolved} problems solved
      </Text>
      <Text mt={2} fontSize={{ base: 'md', md: 'xl' }} color="gray.400">One champion.</Text>
      <MotionBox mt={12} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
        <Text fontSize={{ base: 'md', md: 'lg' }} letterSpacing="widest" textTransform="uppercase">
          Press <Kbd color="black">Space</Kbd> or tap to begin
        </Text>
      </MotionBox>
    </MotionBox>
  );
}

function Drumroll({ team, duration }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (team.rank !== 1) return;
    const step = duration / 3;
    const timers = [1, 2].map((i) => setTimeout(() => setCount(3 - i), step * i));
    return () => timers.forEach(clearTimeout);
  }, [team.rank, duration]);

  return (
    <MotionBox key={`drum-${team.id}`} textAlign="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.4 }}>
      <Text fontSize={{ base: 'xl', md: '3xl' }} color="gray.300" letterSpacing="wider" mb={6}>
        {team.rank === 1 ? 'And the champions are…' : `${placeLabel(team)}…`}
      </Text>
      <MotionBox
        as="h1"
        fontSize={{ base: '8xl', md: '12rem' }}
        color={MEDALS[team.rank].color}
        lineHeight="1"
        animate={{ scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      >
        {team.rank === 1 ? count : '?'}
      </MotionBox>
    </MotionBox>
  );
}

function TeamReveal({ team }) {
  const score = useCountUp(team.score, { duration: team.rank <= 3 ? 1.8 : 1, delay: 0.3 });
  const medal = MEDALS[team.rank];
  const glow = medal ? medal.color : ORANGE;

  return (
    <MotionBox
      key={`team-${team.id}`}
      textAlign="center"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      maxW="4xl"
      px={4}
    >
      {team.rank === 1 && (
        <Text as="h2" fontSize={{ base: 'xl', md: '3xl' }} color={medal.color} letterSpacing="widest" mb={2}>
          Champions
        </Text>
      )}
      <Text as="h1" fontSize={{ base: '6xl', md: '9xl' }} lineHeight="1" color="transparent" style={{ WebkitTextStroke: `3px ${glow}` }}>
        #{team.rank}
      </Text>
      {team.tied && <Text color={ORANGE} fontWeight="bold" letterSpacing="widest">TIED</Text>}
      <Text fontSize={{ base: '3xl', md: '6xl' }} fontWeight="extrabold" mt={4} lineHeight="1.1" textShadow={`0 0 40px ${glow}88`}>
        {team.name}
      </Text>
      <Wrap justify="center" spacing={4} mt={6}>
        {team.members.map((member, i) => (
          <WrapItem key={member}>
            <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.12 }}>
              <HStack bg="whiteAlpha.100" borderRadius="full" pr={4} pl={1} py={1}>
                <Avatar size="sm" name={member} />
                <Text fontSize={{ base: 'sm', md: 'lg' }}>{member}</Text>
              </HStack>
            </MotionBox>
          </WrapItem>
        ))}
      </Wrap>
      <Text mt={8} fontSize={{ base: '5xl', md: '8xl' }} fontWeight="black" color={ORANGE} lineHeight="1" fontFamily="mono">
        {score}
        <Text as="span" fontSize={{ base: 'xl', md: '3xl' }} ml={3} color="gray.400">points</Text>
      </Text>
    </MotionBox>
  );
}

export default function Reveal() {
  const { board, stats } = useLeaderboard();
  const order = [...board.ranked].reverse();
  const [step, setStep] = useState(-1);
  const [drumroll, setDrumroll] = useState(null);
  const timer = useRef(null);

  const current = step >= 0 ? order[step] : null;
  const revealed = order.slice(0, step + 1).sort((a, b) => a.rank - b.rank);
  const done = step === order.length - 1;

  const cancelDrumroll = useCallback(() => {
    clearTimeout(timer.current);
    setDrumroll(null);
  }, []);

  const next = useCallback(() => {
    if (drumroll || step >= order.length - 1) return;
    const upcoming = order[step + 1];
    const wait = DRUMROLL_MS[upcoming.rank];
    if (!wait) {
      setStep(step + 1);
      return;
    }
    setDrumroll(upcoming);
    timer.current = setTimeout(() => {
      setDrumroll(null);
      setStep(step + 1);
      if (upcoming.rank === 1) championConfetti();
      else confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: [MEDALS[upcoming.rank].color, ORANGE], disableForReducedMotion: true });
    }, wait);
  }, [drumroll, step, order]);

  const back = useCallback(() => {
    if (drumroll) return cancelDrumroll();
    setStep((s) => Math.max(-1, s - 1));
  }, [drumroll, cancelDrumroll]);

  const restart = useCallback(() => {
    cancelDrumroll();
    setStep(-1);
  }, [cancelDrumroll]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (event) => {
      if ([' ', 'ArrowRight', 'Enter', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        next();
      } else if (['ArrowLeft', 'Backspace', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        back();
      } else if (event.key.toLowerCase() === 'r') {
        restart();
      } else if (event.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, restart]);

  return (
    <Flex direction="column" minH="100vh" bg="rgba(5, 2, 12, 0.4)" color="white" position="relative" zIndex={1}>
      <Flex justify="space-between" align="center" px={{ base: 4, md: 8 }} py={4} borderBottom={`3px solid ${ORANGE}`}>
        <Link as={RouterLink} to="/" display="flex" alignItems="center" gap={2} color="gray.400" _hover={{ color: 'white' }}>
          <ArrowLeft size={16} /> Board
        </Link>
        <Text fontSize={{ base: 'xs', md: 'sm' }} letterSpacing="widest" textTransform="uppercase" color={ORANGE} fontWeight="bold">
          Hacktoberfest · Final Reveal
        </Text>
        <Text fontSize="sm" color="gray.400" fontFamily="mono">
          {Math.max(0, step + 1)} / {order.length}
        </Text>
      </Flex>

      <Flex flex="1" align="center" justify="center" py={10} onClick={next} cursor={done ? 'default' : 'pointer'} userSelect="none">
        <AnimatePresence mode="wait">
          {drumroll ? (
            <Drumroll key={`drum-${drumroll.id}`} team={drumroll} duration={DRUMROLL_MS[drumroll.rank]} />
          ) : current ? (
            <TeamReveal key={`team-${current.id}`} team={current} />
          ) : (
            <Intro key="intro" stats={stats} />
          )}
        </AnimatePresence>
      </Flex>

      {revealed.length > 0 && (
        <Wrap justify="center" spacing={2} px={4} pb={4}>
          {revealed.map((team) => (
            <WrapItem key={team.id}>
              <HStack
                as={motion.div}
                layout
                spacing={2}
                px={3}
                py={1}
                borderRadius="md"
                border="1px solid"
                borderColor={team.id === current?.id ? ORANGE : 'whiteAlpha.300'}
                bg={MEDALS[team.rank] ? `${MEDALS[team.rank].color}22` : 'whiteAlpha.50'}
                fontSize="sm"
              >
                <Text fontWeight="bold" color={MEDALS[team.rank]?.color || ORANGE}>#{team.rank}</Text>
                <Text>{team.name}</Text>
                <Text color="gray.400" fontFamily="mono">{team.score}</Text>
              </HStack>
            </WrapItem>
          ))}
        </Wrap>
      )}

      <Flex justify="center" align="center" gap={2} pb={6} wrap="wrap" px={4}>
        <Button size="sm" variant="outline" colorScheme="orange" leftIcon={<ChevronLeft size={16} />} onClick={back} isDisabled={step < 0 && !drumroll}>
          Back
        </Button>
        <Button size="sm" colorScheme="orange" rightIcon={<ChevronRight size={16} />} onClick={next} isDisabled={done || Boolean(drumroll)}>
          {step < 0 ? 'Start' : 'Next'}
        </Button>
        <Button size="sm" variant="ghost" colorScheme="whiteAlpha" leftIcon={<RotateCcw size={14} />} onClick={restart}>
          Restart
        </Button>
        <Button size="sm" variant="ghost" colorScheme="whiteAlpha" leftIcon={<Maximize size={14} />} onClick={toggleFullscreen}>
          Fullscreen
        </Button>
        <Text fontSize="xs" color="gray.500" display={{ base: 'none', md: 'block' }} ml={4}>
          <Kbd color="black">Space</Kbd> next · <Kbd color="black">←</Kbd> back · <Kbd color="black">R</Kbd> restart · <Kbd color="black">F</Kbd> fullscreen
        </Text>
      </Flex>
    </Flex>
  );
}
