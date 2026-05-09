import { Badge, Box, HStack, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';
import { shellStats } from '@mfplayground/hearthhub-ui';

function StatTile({ delta, help, label, tone, value }: (typeof shellStats)[number]) {
  const deltaColor = tone === 'green' ? 'green' : tone === 'red' ? 'red' : tone === 'gold' ? 'yellow' : 'gray';

  return (
    <Box bg="white" borderColor="blackAlpha.200" borderWidth="1px" boxShadow="sm" p={5} rounded="lg">
      <Stat>
        <StatLabel color="gray.600" fontSize="sm" fontWeight={800}>
          {label}
        </StatLabel>
        <HStack align="baseline" flexWrap="wrap" spacing={2}>
          <StatNumber fontSize="2xl">{value}</StatNumber>
          <Badge colorScheme={deltaColor} fontSize="xs">
            {delta}
          </Badge>
        </HStack>
        <StatHelpText color={tone === 'red' ? 'red.500' : 'gray.600'} mb={0}>
          {help}
        </StatHelpText>
      </Stat>
    </Box>
  );
}

export function StatsStrip() {
  return (
    <SimpleGrid columns={{ base: 1, md: 3, xl: 5 }} spacing={3}>
      {shellStats.map((stat) => (
        <StatTile key={stat.label} {...stat} />
      ))}
    </SimpleGrid>
  );
}
