import { Flex, Kbd, Text, useColorModeValue } from '@chakra-ui/react';
import { Heart } from 'lucide-react';
import { ORANGE } from '../lib/brand';

export default function Footer() {
  const muted = useColorModeValue('gray.600', 'gray.400');
  const strong = useColorModeValue('gray.800', 'white');
  return (
    <Flex direction="column" align="center" gap={2} pb={10} pt={2} color={muted} fontSize="sm">
      <Flex align="center" gap={1.5}>
        Made with <Heart size={14} fill={ORANGE} color={ORANGE} /> by
        <Text as="span" fontWeight="bold" color={strong}>Deeptanshu Lal</Text>
      </Flex>
      <Text fontSize="xs" letterSpacing="wider">
        GDG RAIT · Hacktoberfest · press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> anywhere
      </Text>
    </Flex>
  );
}
