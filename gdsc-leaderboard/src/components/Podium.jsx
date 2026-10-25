/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import { Avatar, AvatarGroup, Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MEDALS, ORANGE } from '../lib/brand';
import { useCountUp } from '../hooks/useCountUp';

const MotionBox = motion(Box);

// Visual order on the podium is 2nd, 1st, 3rd; they rise 3rd → 2nd → 1st.
const SLOTS = [
  { place: 2, height: { base: '90px', md: '130px' }, delay: 0.35 },
  { place: 1, height: { base: '125px', md: '180px' }, delay: 0.7 },
  { place: 3, height: { base: '65px', md: '95px' }, delay: 0 },
];

let celebrated = false;

function celebrate() {
  if (celebrated) return;
  celebrated = true;
  const colors = [ORANGE, MEDALS[1].color, '#ffffff', '#4285F4', '#34A853', '#EA4335'];
  const shoot = (origin, angle) =>
    confetti({ particleCount: 70, spread: 65, angle, origin, colors, disableForReducedMotion: true, zIndex: 2000 });
  shoot({ x: 0, y: 0.7 }, 60);
  shoot({ x: 1, y: 0.7 }, 120);
}

function PodiumSlot({ team, place, height, delay, onSelect }) {
  const medal = MEDALS[place];
  const score = useCountUp(team.score, { delay: delay + 0.3 });
  const nameColor = useColorModeValue('gray.800', 'gray.100');
  const reduceMotion = useReducedMotion();

  return (
    <Flex direction="column" align="center" flex="1" minW={0} cursor="pointer" onClick={() => onSelect(team)} role="button"
      aria-label={`${team.name}, ${place} place, ${team.score} points`} tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(team)}
    >
      <MotionBox
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.25, duration: 0.4 }}
        textAlign="center"
        mb={2}
        px={1}
        w="100%"
      >
        {place === 1 && (
          <MotionBox
            display="inline-block"
            color={medal.color}
            animate={reduceMotion ? undefined : { rotate: [-8, 8, -8], y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            <Crown size={30} fill={medal.color} />
          </MotionBox>
        )}
        <AvatarGroup size={{ base: 'xs', md: 'sm' }} max={4} justifyContent="center" mb={1}>
          {team.members.map((member) => (
            <Avatar key={member} name={member} />
          ))}
        </AvatarGroup>
        <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'md' }} color={nameColor} noOfLines={2} lineHeight="short">
          {team.name}
        </Text>
        <Text fontWeight="extrabold" fontSize={{ base: 'lg', md: '2xl' }} color={ORANGE} lineHeight="1.1">
          {score}
          <Text as="span" fontSize="xs" fontWeight="semibold" ml={1}>pts</Text>
        </Text>
      </MotionBox>
      <MotionBox
        w="100%"
        h={height}
        bgGradient={`linear(to-b, ${medal.color}, ${medal.deep})`}
        borderTopRadius="md"
        border="3px solid"
        borderColor={ORANGE}
        borderBottom="none"
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
        pt={2}
        style={{ transformOrigin: 'bottom' }}
        initial={reduceMotion ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay, type: 'spring', stiffness: 120, damping: 14 }}
      >
        <Text as="h2" fontSize={{ base: '2xl', md: '4xl' }} color="white" textShadow="2px 2px 0 rgba(0,0,0,0.25)">
          {team.rank}
        </Text>
      </MotionBox>
    </Flex>
  );
}

export default function Podium({ ranked, onSelect }) {
  const top = ranked.slice(0, 3);
  useEffect(() => {
    if (top.length === 0) return;
    const timer = setTimeout(celebrate, 1500);
    return () => clearTimeout(timer);
  }, [top.length]);

  if (top.length < 3) return null;

  return (
    <Flex align="flex-end" gap={{ base: 2, md: 4 }} maxW="2xl" mx="auto" mt={6} mb={2} px={{ base: 0, md: 6 }}>
      {SLOTS.map(({ place, height, delay }) => (
        <PodiumSlot key={place} team={top[place - 1]} place={place} height={height} delay={delay} onSelect={onSelect} />
      ))}
    </Flex>
  );
}
