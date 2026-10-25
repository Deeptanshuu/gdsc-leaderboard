/* eslint-disable react/prop-types */
import { Box, SimpleGrid, Text, useColorModeValue } from '@chakra-ui/react';
import { Code2, Trophy, Users, Zap } from 'lucide-react';
import { ORANGE } from '../lib/brand';
import { useCountUp } from '../hooks/useCountUp';

function Stat({ icon: Icon, label, value }) {
  const shown = useCountUp(value, { duration: 1.6 });
  const bg = useColorModeValue('orange.50', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  return (
    <Box bg={bg} borderRadius="md" border="1px solid" borderColor={ORANGE} px={3} py={2} textAlign="center">
      <Box color={ORANGE} display="flex" justifyContent="center" mb={1}>
        <Icon size={18} />
      </Box>
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="extrabold" lineHeight="1">
        {shown}
      </Text>
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={labelColor} mt={1}>
        {label}
      </Text>
    </Box>
  );
}

export default function StatsStrip({ stats }) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={6}>
      <Stat icon={Users} label="Teams" value={stats.teams} />
      <Stat icon={Zap} label="Hackers" value={stats.hackers} />
      <Stat icon={Code2} label="Problems solved" value={stats.problemsSolved} />
      <Stat icon={Trophy} label="Points earned" value={stats.pointsAwarded} />
    </SimpleGrid>
  );
}
