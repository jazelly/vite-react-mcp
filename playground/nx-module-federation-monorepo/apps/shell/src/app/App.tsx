import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  ChakraProvider,
  Container,
  Divider,
  Flex,
  Grid,
  HStack,
  Heading,
  Icon,
  Image,
  List,
  ListIcon,
  ListItem,
  Progress,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Table,
  VStack,
  extendTheme,
} from '@chakra-ui/react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  CubeTransparentIcon,
  HomeModernIcon,
  MapPinIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Suspense, lazy, useMemo, useState } from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import hearthHubOperationsImage from '../assets/hearthhub-operations.png';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const CatalogRoutes = lazy(() => import('catalog/Routes'));
const ProfileRoutes = lazy(() => import('profile/Routes'));

const mfTheme = extendTheme({
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: {
    md: '8px',
    lg: '8px',
    xl: '8px',
  },
  colors: {
    hearth: {
      50: '#f4fbf7',
      100: '#dcefe5',
      500: '#25745c',
      700: '#174a3c',
      900: '#10261f',
    },
    ember: {
      100: '#ffe4dc',
      500: '#d65a3b',
      700: '#9d341f',
    },
    brass: {
      100: '#f7e7bd',
      500: '#ba8731',
      700: '#79561d',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#f7f5ef',
        color: '#14231f',
      },
    },
  },
});

const navigation = [
  { to: '/', label: 'Home operations', icon: HomeModernIcon },
  { to: '/catalog', label: 'Services catalog', icon: WrenchScrewdriverIcon },
  { to: '/profile', label: 'Household profile', icon: PuzzlePieceIcon },
  { to: '/diagnostics', label: 'Runtime board', icon: Cog6ToothIcon },
];

const visitQueue = [
  {
    time: 'Today, 2:30 PM',
    title: 'Heat pump tune-up',
    vendor: 'Northline Climate',
    status: 'confirmed',
  },
  {
    time: 'Tomorrow, 9:00 AM',
    title: 'Back gate latch repair',
    vendor: 'Oak & Iron Handyman',
    status: 'arrival window',
  },
  {
    time: 'Fri, 11:15 AM',
    title: 'Water heater inspection',
    vendor: 'ClearPipe Plumbing',
    status: 'needs approval',
  },
];

const federationSlices = [
  {
    area: 'Shell host',
    owner: 'Home operations team',
    scope: 'Scheduling, alerts, shared navigation, and the household command center.',
  },
  {
    area: 'Catalog remote',
    owner: 'Services marketplace team',
    scope: 'Plans, trusted vendors, seasonal packages, and service detail routes.',
  },
  {
    area: 'Profile remote',
    owner: 'Household intelligence team',
    scope: 'Members, access notes, pets, preferences, and inspection-safe profile cards.',
  },
];

function HeroIcon({ icon }: { icon: IconComponent }) {
  return <Icon as={icon} boxSize={5} strokeWidth={1.8} />;
}

function SurfaceCard({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  icon: IconComponent;
  title: string;
}) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" boxShadow="sm" rounded="lg">
      <CardBody>
        <HStack mb={4} spacing={3}>
          <Flex
            align="center"
            bg="hearth.50"
            borderColor="hearth.100"
            borderWidth="1px"
            color="hearth.700"
            h={11}
            justify="center"
            rounded="lg"
            w={11}
          >
            <HeroIcon icon={icon} />
          </Flex>
          <Heading size="md">{title}</Heading>
        </HStack>
        {children}
      </CardBody>
    </Card>
  );
}

function MetricStat({
  help,
  label,
  value,
}: {
  help: string;
  label: string;
  value: string;
}) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <Stat>
          <StatLabel color="gray.600" fontWeight={800}>
            {label}
          </StatLabel>
          <StatNumber color="gray.900">{value}</StatNumber>
          <StatHelpText mb={0}>{help}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}

function ShellHome() {
  const [activeSlice, setActiveSlice] = useState('shell');
  const sliceSummary = useMemo(
    () => ({
      shell:
        'The shell owns the shared command center: visit queue, household alerts, app chrome, and cross-remote navigation.',
      catalog:
        'The catalog remote owns the service marketplace: plan comparison, vendor availability, subscription status, and detail routes.',
      profile:
        'The profile remote owns household context: members, pets, access rules, care notes, and selector-friendly profile cards.',
    }),
    [],
  );

  return (
    <Stack id="shell-workspace" spacing={6}>
      <Grid gap={5} templateColumns={{ base: '1fr', xl: '1.05fr 0.95fr' }}>
        <Card bg="hearth.900" color="white" overflow="hidden" rounded="lg">
          <CardBody p={{ base: 6, md: 8 }}>
            <HStack color="hearth.100" mb={5} spacing={3}>
              <HeroIcon icon={HomeModernIcon} />
              <Text fontWeight={800}>HearthHub household command center</Text>
            </HStack>
            <Heading as="h1" color="white" maxW="780px" size="2xl">
              Coordinate the work that keeps a home running.
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg" lineHeight="1.8" maxW="760px" mt={5}>
              HearthHub gives families and property managers one operational view
              for maintenance visits, trusted vendors, recurring care plans,
              emergency triage, and the household preferences that technicians
              need before they arrive.
            </Text>
            <HStack flexWrap="wrap" mt={7} spacing={3}>
              <Button as={Link} colorScheme="green" leftIcon={<HeroIcon icon={CalendarDaysIcon} />} to="/catalog">
                Review service plans
              </Button>
              <Button
                as={Link}
                color="white"
                leftIcon={<HeroIcon icon={PuzzlePieceIcon} />}
                to="/profile"
                variant="outline"
              >
                Open household profile
              </Button>
            </HStack>
          </CardBody>
        </Card>

        <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" overflow="hidden" rounded="lg">
          <Image
            alt="HearthHub operations dashboard concept"
            src={hearthHubOperationsImage}
            sx={{ aspectRatio: '16 / 10', objectFit: 'cover', width: '100%' }}
          />
          <CardBody>
            <HStack justify="space-between" mb={3}>
              <Heading size="md">Live home readiness</Heading>
              <Badge colorScheme="green">87% ready</Badge>
            </HStack>
            <Text color="gray.600" lineHeight="1.75">
              The shell assembles remote-owned product areas into one household
              workflow so each team can ship independently without losing a single
              customer journey.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <MetricStat help="Two confirmed, one awaiting household approval." label="Scheduled visits" value="3" />
        <MetricStat help="HVAC, plumbing, access, garden, and appliance partners." label="Trusted vendors" value="24" />
        <MetricStat help="Seasonal service plan with emergency coverage." label="Active plan" value="Family Plus" />
      </SimpleGrid>

      <Grid gap={4} templateColumns={{ base: '1fr', xl: '1.1fr 0.9fr' }}>
        <SurfaceCard icon={ClipboardDocumentCheckIcon} title="Upcoming work queue">
          <Stack spacing={3}>
            {visitQueue.map((visit) => (
              <Flex
                align={{ base: 'flex-start', md: 'center' }}
                borderColor="blackAlpha.200"
                borderWidth="1px"
                direction={{ base: 'column', md: 'row' }}
                gap={3}
                justify="space-between"
                key={visit.title}
                p={4}
                rounded="lg"
              >
                <Box>
                  <Text color="gray.500" fontSize="sm" fontWeight={800}>
                    {visit.time}
                  </Text>
                  <Heading as="h3" size="sm">
                    {visit.title}
                  </Heading>
                  <Text color="gray.600">{visit.vendor}</Text>
                </Box>
                <Badge colorScheme={visit.status === 'confirmed' ? 'green' : 'orange'}>
                  {visit.status}
                </Badge>
              </Flex>
            ))}
          </Stack>
        </SurfaceCard>

        <SurfaceCard icon={ShieldCheckIcon} title="Seasonal readiness">
          <VStack align="stretch" spacing={4}>
            {[
              ['Winter heating', 92],
              ['Leak prevention', 76],
              ['Access notes current', 88],
            ].map(([label, value]) => (
              <Box key={label}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight={800}>{label}</Text>
                  <Text color="gray.600">{value}%</Text>
                </HStack>
                <Progress colorScheme="green" rounded="full" size="sm" value={Number(value)} />
              </Box>
            ))}
          </VStack>
        </SurfaceCard>
      </Grid>

      <SurfaceCard icon={CubeTransparentIcon} title="How the product is split across teams">
        <HStack aria-label="Team runtime switcher" flexWrap="wrap" mb={4} spacing={2}>
          {(['shell', 'catalog', 'profile'] as const).map((slice) => (
            <Button
              colorScheme={slice === activeSlice ? 'green' : 'gray'}
              key={slice}
              onClick={() => setActiveSlice(slice)}
              variant={slice === activeSlice ? 'solid' : 'outline'}
            >
              {slice}
            </Button>
          ))}
        </HStack>
        <Text color="gray.600" lineHeight="1.75" mb={5}>
          {sliceSummary[activeSlice as keyof typeof sliceSummary]}
        </Text>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Federated area</Th>
              <Th>Team owner</Th>
              <Th>Production responsibility</Th>
            </Tr>
          </Thead>
          <Tbody>
            {federationSlices.map((slice) => (
              <Tr key={slice.area}>
                <Td fontWeight={800}>{slice.area}</Td>
                <Td>{slice.owner}</Td>
                <Td color="gray.600">{slice.scope}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </SurfaceCard>
    </Stack>
  );
}

function Diagnostics() {
  return (
    <Stack id="runtime-diagnostics" spacing={5}>
      <Box>
        <HStack color="hearth.700" mb={3}>
          <HeroIcon icon={Cog6ToothIcon} />
          <Text fontWeight={800}>Runtime board</Text>
        </HStack>
        <Heading as="h2" size="xl">
          Production diagnostics for the federated HearthHub app.
        </Heading>
        <Text color="gray.600" fontSize="lg" lineHeight="1.8" maxW="820px" mt={4}>
          Developers use this board to confirm that customer-facing screens still
          expose accurate component trees, stable selection targets, and route
          ownership after each remote ships.
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <LegacyRuntimeBadge />
        <SurfaceCard icon={ChartBarIcon} title="MCP runtime">
          <Text color="gray.600">window.__VITE_REACT_MCP__</Text>
          <Text fontWeight={800}>available in the shell host and remotes</Text>
        </SurfaceCard>
        <SurfaceCard icon={PuzzlePieceIcon} title="Remote boundaries">
          <List spacing={2}>
            {['catalog/Routes owns service plans', 'profile/Routes owns household context'].map((item) => (
              <ListItem key={item}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {item}
              </ListItem>
            ))}
          </List>
        </SurfaceCard>
        <SurfaceCard icon={ArrowPathIcon} title="Shared runtime contract">
          <Text color="gray.600">React 18.2.0 and React Router 6.4.2 remain strict singletons.</Text>
          <Divider my={4} />
          <Tag colorScheme="green">
            <TagLabel>module-federation.js enforced</TagLabel>
          </Tag>
        </SurfaceCard>
      </SimpleGrid>
    </Stack>
  );
}

export function App() {
  const location = useLocation();

  return (
    <ChakraProvider theme={mfTheme}>
      <Box bg="#f7f5ef" minH="100vh">
        <Container maxW="1220px" py={6}>
          <Flex
            align={{ base: 'flex-start', lg: 'center' }}
            as="header"
            direction={{ base: 'column', lg: 'row' }}
            gap={4}
            justify="space-between"
            mb={8}
          >
            <Button
              as={Link}
              colorScheme="green"
              leftIcon={<HeroIcon icon={SparklesIcon} />}
              rounded="lg"
              to="/"
            >
              HearthHub
            </Button>
            <HStack as="nav" flexWrap="wrap" spacing={2}>
              {navigation.map((item) => (
                <Button
                  as={Link}
                  colorScheme={location.pathname === item.to ? 'green' : 'gray'}
                  key={item.to}
                  leftIcon={<HeroIcon icon={item.icon} />}
                  rounded="lg"
                  to={item.to}
                  variant={location.pathname === item.to ? 'solid' : 'outline'}
                >
                  {item.label}
                </Button>
              ))}
            </HStack>
          </Flex>

          <Routes>
            <Route path="/" element={<ShellHome />} />
            <Route
              path="/catalog/*"
              element={
                <Suspense
                  fallback={
                    <SurfaceCard icon={TruckIcon} title="Loading services catalog...">
                      <Text>Loading services catalog...</Text>
                    </SurfaceCard>
                  }
                >
                  <CatalogRoutes />
                </Suspense>
              }
            />
            <Route
              path="/profile/*"
              element={
                <Suspense
                  fallback={
                    <SurfaceCard icon={PuzzlePieceIcon} title="Loading household profile...">
                      <Text>Loading household profile...</Text>
                    </SurfaceCard>
                  }
                >
                  <ProfileRoutes />
                </Suspense>
              }
            />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </ChakraProvider>
  );
}
