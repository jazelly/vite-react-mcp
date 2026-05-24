import {
  Badge,
  Button,
  Card,
  CardBody,
  Grid,
  HStack,
  Heading,
  Icon,
  Progress,
  Text,
} from '@chakra-ui/react';
import { ArrowLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { SectionCard, servicePlans } from '@mfplayground/hearthhub-ui';
import { Link, useParams } from 'react-router-dom';

export function ProductDetail() {
  const params = useParams();
  const selectedPlan =
    servicePlans.find((plan) => plan.id === params.productId) ??
    servicePlans[0];

  return (
    <Grid gap={4} templateColumns={{ base: '1fr', xl: '0.9fr 1.1fr' }}>
      <Card
        bg="white"
        borderColor="blackAlpha.200"
        borderWidth="1px"
        rounded="lg"
      >
        <CardBody>
          <Badge colorScheme="green" mb={3}>
            Remote detail
          </Badge>
          <Heading as="h2" size="xl">
            {selectedPlan.name}
          </Heading>
          <Text color="gray.600" fontSize="lg" lineHeight="1.8" mt={4}>
            {selectedPlan.summary}
          </Text>
          <HStack mt={5} spacing={3}>
            <Badge colorScheme="orange">{selectedPlan.status}</Badge>
            <Badge colorScheme="green">{selectedPlan.price}</Badge>
          </HStack>
          <Button
            as={Link}
            leftIcon={<Icon as={ArrowLeftIcon} boxSize={4} />}
            mt={6}
            to="/catalog"
          >
            Back to services
          </Button>
        </CardBody>
      </Card>

      <SectionCard icon={CurrencyDollarIcon} title="Enrollment readiness">
        <HStack justify="space-between" mb={2}>
          <Text fontWeight={800}>{selectedPlan.technicalName}</Text>
          <Text color="gray.600">{selectedPlan.readiness}%</Text>
        </HStack>
        <Progress
          colorScheme="green"
          rounded="full"
          size="sm"
          value={selectedPlan.readiness}
        />
        <Text color="gray.600" lineHeight="1.7" mt={4}>
          This route is intentionally owned by the catalog remote so runtime MCP
          tools can inspect a real customer workflow across the host boundary
          while preserving service ownership, plan copy, and source-context
          routing.
        </Text>
      </SectionCard>
    </Grid>
  );
}
