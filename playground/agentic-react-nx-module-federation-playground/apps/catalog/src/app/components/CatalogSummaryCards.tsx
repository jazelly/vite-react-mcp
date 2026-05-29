import { SimpleGrid, Text } from '@chakra-ui/react';
import { ServerStackIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  MetricCard,
  SectionCard,
  servicePlans,
} from '@mfplayground/hearthhub-ui';

export function CatalogSummaryCards() {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      <SectionCard icon={ServerStackIcon} title="Remote scope">
        <Text color="gray.600">catalog/Routes</Text>
        <Text fontWeight={800}>service marketplace module</Text>
      </SectionCard>
      <MetricCard
        help="bookable household care paths"
        label="Active plans"
        value={`${servicePlans.length} service plans`}
      />
      <SectionCard icon={ShieldCheckIcon} title="Selector model">
        <Text color="gray.600">
          Chakra tables, plan links, badges, and progress rows
        </Text>
        <Text fontWeight={800}>source aware</Text>
      </SectionCard>
    </SimpleGrid>
  );
}
