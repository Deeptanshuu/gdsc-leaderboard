/* eslint-disable react/prop-types */
import { Box, Flex, Text, Tooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const STATES = {
  live: { color: '#22c55e', label: 'Live', pulse: true },
  connecting: { color: '#eab308', label: 'Connecting…', pulse: true },
  reconnecting: { color: '#ef4444', label: 'Reconnecting…', pulse: true },
  static: { color: '#9ca3af', label: 'Final results', pulse: false },
};

export default function LiveBadge({ status, liveUrl }) {
  const state = STATES[status] || STATES.static;
  const tip = liveUrl ? `Streaming from ${liveUrl}` : 'Add ?live to the URL to stream from a running server';
  return (
    <Tooltip label={tip} hasArrow>
      <Flex align="center" justify="center" gap={2} mt={3}>
        <Box position="relative" w="10px" h="10px">
          {state.pulse && (
            <motion.span
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: state.color }}
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
            />
          )}
          <Box position="absolute" inset={0} borderRadius="50%" bg={state.color} />
        </Box>
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
          {state.label}
        </Text>
      </Flex>
    </Tooltip>
  );
}
