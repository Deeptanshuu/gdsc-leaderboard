/* eslint-disable react/prop-types */
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';

export default function DisqualifiedList({ teams }) {
  const muted = useColorModeValue('gray.500', 'gray.500');
  if (!teams.length) return null;
  return (
    <Accordion allowToggle mt={6}>
      <AccordionItem border="1px dashed" borderColor={muted} borderRadius="md">
        <AccordionButton borderRadius="md">
          <Box flex="1" textAlign="left" color={muted} fontWeight="semibold">
            {teams.length} disqualified {teams.length === 1 ? 'team' : 'teams'}
          </Box>
          <AccordionIcon color={muted} />
        </AccordionButton>
        <AccordionPanel>
          {teams.map((team) => (
            <Flex key={team.id} justify="space-between" py={1} color={muted}>
              <Text as="s">{team.name}</Text>
              <Text fontSize="sm">@{team.githubUsername}</Text>
            </Flex>
          ))}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
