import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  ChakraProvider,
  Divider,
  Flex,
  Grid,
  HStack,
  Heading,
  Icon,
  List,
  ListIcon,
  ListItem,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  extendTheme,
} from '@chakra-ui/react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CubeIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const catalogTheme = extendTheme({
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: { md: '8px', lg: '8px', xl: '8px' },
  colors: {
    service: {
      50: '#f4fbf7',
      100: '#dcefe5',
      500: '#25745c',
      700: '#174a3c',
      900: '#10261f',
    },
  },
});

const servicePlans = [
  {
    id: 'family-plus',
    name: 'Family Plus seasonal care',
    technicalName: 'React Router 6.4.2 route island',
    owner: 'services marketplace',
    status: 'enrolling',
    price: '$89/mo',
    readiness: 92,
    summary:
      'Quarterly HVAC, plumbing, appliance, and safety checks bundled with emergency booking priority.',
  },
  {
    id: 'leak-watch',
    name: 'Leak watch response',
    technicalName: 'Remote plan detail boundary',
    owner: 'home protection',
    status: 'active',
    price: '$24/mo',
    readiness: 81,
    summary:
      'Moisture sensor dispatch, same-day plumber coordination, and repair documentation for insurance claims.',
  },
  {
    id: 'move-in-refresh',
    name: 'Move-in refresh package',
    technicalName: 'Catalog remote commerce path',
    owner: 'new home onboarding',
    status: 'limited slots',
    price: '$420',
    readiness: 68,
    summary:
      'Deep clean, filter replacement, lock audit, paint touch-up, and first-week handyman availability.',
  },
];

const vendorSignals = [
  'Background-checked providers with household access notes',
  'Arrival windows synced to the shell work queue',
  'Service detail pages owned by the catalog remote team',
];

function CatalogIcon({ icon }: { icon: IconComponent }) {
  return (
    <Flex align="center" bg="service.50" color="service.700" h={10} justify="center" rounded="lg" w={10}>
      <Icon as={icon} boxSize={5} strokeWidth={1.8} />
    </Flex>
  );
}

function RemoteCard({
  children,
  title,
  icon = CircleStackIcon,
}: {
  children: ReactNode;
  icon?: IconComponent;
  title: string;
}) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <HStack mb={4} spacing={3}>
          <CatalogIcon icon={icon} />
          <Heading size="md">{title}</Heading>
        </HStack>
        {children}
      </CardBody>
    </Card>
  );
}

function CatalogIndex() {
  return (
    <Stack id="catalog-remote" spacing={5}>
      <Flex
        align={{ base: 'flex-start', lg: 'center' }}
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        justify="space-between"
      >
        <Box>
          <HStack color="service.700" mb={3}>
            <Icon as={WrenchScrewdriverIcon} boxSize={5} />
            <Text fontWeight={800}>Catalog remote</Text>
          </HStack>
          <Heading as="h2" size="xl">
            Federated product routes.
          </Heading>
          <Text color="gray.600" fontSize="lg" lineHeight="1.75" maxW="820px" mt={4}>
            The services marketplace team owns the plan inventory, vendor
            availability, enrollment copy, and detail pages that help a household
            choose practical coverage before a repair becomes urgent.
          </Text>
        </Box>
        <LegacyRuntimeBadge />
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <RemoteCard icon={ServerStackIcon} title="Remote scope">
          <Text color="gray.600">catalog/Routes</Text>
          <Text fontWeight={800}>service marketplace module</Text>
        </RemoteCard>
        <RemoteCard icon={CalendarDaysIcon} title="Active plans">
          <Text color="gray.600">bookable household care paths</Text>
          <Text fontWeight={800}>{servicePlans.length} service plans</Text>
        </RemoteCard>
        <RemoteCard icon={ShieldCheckIcon} title="Selector model">
          <Text color="gray.600">Chakra tables, plan links, badges, and progress rows</Text>
          <Text fontWeight={800}>source aware</Text>
        </RemoteCard>
      </SimpleGrid>

      <Grid gap={4} templateColumns={{ base: '1fr', xl: '1.25fr 0.75fr' }}>
        <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
          <CardBody>
            <HStack mb={4} spacing={3}>
              <CatalogIcon icon={HomeModernIcon} />
              <Heading size="md">Service plans</Heading>
            </HStack>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Plan</Th>
                  <Th>Owner</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th>Open</Th>
                </Tr>
              </Thead>
              <Tbody>
                {servicePlans.map((plan) => (
                  <Tr key={plan.id}>
                    <Td>
                      <Button
                        as={Link}
                        colorScheme="green"
                        leftIcon={<Icon as={CubeIcon} boxSize={4} />}
                        size="sm"
                        to={plan.id}
                        variant="link"
                      >
                        {plan.name}
                      </Button>
                      <Text color="gray.500" fontSize="sm">
                        {plan.technicalName}
                      </Text>
                    </Td>
                    <Td>{plan.owner}</Td>
                    <Td>{plan.price}</Td>
                    <Td>
                      <Badge colorScheme={plan.status === 'active' ? 'green' : 'orange'}>
                        {plan.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Icon as={ArrowTopRightOnSquareIcon} boxSize={5} color="gray.500" />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        <RemoteCard icon={SparklesIcon} title="Marketplace quality bar">
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
        </RemoteCard>
      </Grid>
    </Stack>
  );
}

function ProductDetail() {
  const params = useParams();
  const selectedPlan = servicePlans.find((plan) => plan.id === params.productId) ?? servicePlans[0];

  return (
    <Grid gap={4} templateColumns={{ base: '1fr', xl: '0.9fr 1.1fr' }}>
      <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
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
          <Button as={Link} leftIcon={<Icon as={ArrowLeftIcon} boxSize={4} />} mt={6} to="/catalog">
            Back to services
          </Button>
        </CardBody>
      </Card>

      <RemoteCard icon={CurrencyDollarIcon} title="Enrollment readiness">
        <HStack justify="space-between" mb={2}>
          <Text fontWeight={800}>{selectedPlan.technicalName}</Text>
          <Text color="gray.600">{selectedPlan.readiness}%</Text>
        </HStack>
        <Progress colorScheme="green" rounded="full" size="sm" value={selectedPlan.readiness} />
        <Text color="gray.600" lineHeight="1.7" mt={4}>
          This route is intentionally owned by the catalog remote so runtime MCP
          tools can inspect a real customer workflow across the host boundary while
          preserving service ownership, plan copy, and source-context routing.
        </Text>
      </RemoteCard>
    </Grid>
  );
}

export default function CatalogRoutes() {
  return (
    <ChakraProvider theme={catalogTheme}>
      <Routes>
        <Route path="/" element={<CatalogIndex />} />
        <Route path=":productId" element={<ProductDetail />} />
      </Routes>
    </ChakraProvider>
  );
}
