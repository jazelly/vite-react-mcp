import { Divider, List, ListIcon, ListItem, Text } from '@chakra-ui/react';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { SectionCard, vendorSignals } from '@mfplayground/hearthhub-ui';

export function MarketplaceQualityBar() {
  return (
    <SectionCard icon={SparklesIcon} title="Marketplace quality bar">
      <List spacing={3}>
        {vendorSignals.map((item) => (
          <ListItem key={item}>
            <ListIcon as={CheckCircleIcon} color="green.500" />
            {item}
          </ListItem>
        ))}
      </List>
      <Divider my={4} />
      <Text color="gray.600" lineHeight="1.7">
        The catalog remote can evolve pricing, taxonomy, and service
        merchandising independently while the shell preserves a stable customer
        navigation model.
      </Text>
    </SectionCard>
  );
}
