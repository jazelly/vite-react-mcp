import {
  Avatar,
  Badge,
  Box,
  Card,
  CardBody,
  ChakraProvider,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tag,
  TagLabel,
  Text,
  VStack,
  extendTheme,
} from '@chakra-ui/react';
import {
  AcademicCapIcon,
  BoltIcon,
  CheckCircleIcon,
  HomeModernIcon,
  KeyIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { Route, Routes } from 'react-router-dom';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const profileTheme = extendTheme({
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: { md: '8px', lg: '8px', xl: '8px' },
  colors: {
    profile: {
      50: '#f4fbf7',
      100: '#dcefe5',
      500: '#25745c',
      700: '#174a3c',
      900: '#10261f',
    },
  },
});

const householdMembers = [
  {
    name: 'Mira Chen',
    role: 'Primary homeowner',
    focus: 'Service approval and budget thresholds',
    note: 'Prefers text confirmations before technicians enter the home office.',
  },
  {
    name: 'Owen Park',
    role: 'Weekend coordinator',
    focus: 'Vendor access and visit handoff',
    note: 'Available for Saturday arrivals and outdoor project sign-off.',
  },
  {
    name: 'Sam Rivera',
    role: 'Care logistics lead',
    focus: 'Component inspection',
    note: 'Keeps inspection notes current for source-context and selector checks.',
  },
];

const householdPreferences = [
  'Technicians can use the side gate after arrival is confirmed.',
  'Quiet hours are 1:00 PM to 3:00 PM for remote work and childcare.',
  'Use fragrance-free cleaning supplies in bedrooms and nursery.',
  'Pets must remain upstairs during plumbing and electrical visits.',
];

function ProfileIcon({ icon }: { icon: IconComponent }) {
  return (
    <Flex align="center" bg="profile.50" color="profile.700" h={10} justify="center" rounded="lg" w={10}>
      <Icon as={icon} boxSize={5} strokeWidth={1.8} />
    </Flex>
  );
}

function ProfileStat({ help, label, value }: { help: string; label: string; value: string }) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <Stat>
          <StatLabel color="gray.600" fontWeight={800}>
            {label}
          </StatLabel>
          <StatNumber>{value}</StatNumber>
          <StatHelpText mb={0}>{help}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}

function ProfileMemberCard({
  focus,
  name,
  note,
  role,
}: {
  focus: string;
  name: string;
  note: string;
  role: string;
}) {
  const memberId = name.toLowerCase().replace(/\s+/g, '-');
  const selectionId = `profile-member-${memberId}`;

  return (
    <article
      id={selectionId}
      style={{
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.16)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <CardBody pointerEvents="none">
        <HStack align="flex-start" justify="space-between" spacing={4}>
          <HStack align="flex-start" spacing={3}>
            <Avatar bg="profile.700" color="white" name={name} rounded="lg" />
            <Box>
              <Heading as="strong" display="block" size="sm">
                {name}
              </Heading>
              <Text color="gray.500" fontSize="sm" fontWeight={800}>
                {role}
              </Text>
              <Text as="span" color="gray.700" display="block" mt={2}>
                {focus}
              </Text>
              <Text color="gray.600" lineHeight="1.65" mt={2}>
                {note}
              </Text>
            </Box>
          </HStack>
          <ProfileIcon icon={SparklesIcon} />
        </HStack>
      </CardBody>
    </article>
  );
}

function PreferencePanel({
  icon,
  title,
  children,
}: {
  children: string;
  icon: IconComponent;
  title: string;
}) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <HStack color="profile.700" mb={3}>
          <Icon as={icon} boxSize={5} />
          <Heading size="sm">{title}</Heading>
        </HStack>
        <Text color="gray.600" lineHeight="1.7">
          {children}
        </Text>
      </CardBody>
    </Card>
  );
}

function ProfileIndex() {
  return (
    <Stack id="profile-remote" spacing={5}>
      <Box>
        <HStack color="profile.700" mb={3}>
          <Icon as={UserCircleIcon} boxSize={5} />
          <Text fontWeight={800}>Profile remote</Text>
        </HStack>
        <Heading as="h2" size="xl">
          Federated team profile routes.
        </Heading>
        <Text color="gray.600" fontSize="lg" lineHeight="1.8" maxW="820px" mt={4}>
          The profile remote owns the household context that makes every service
          visit feel prepared: authorized contacts, access instructions, care
          preferences, pet notes, and inspection-safe member cards for MCP
          selection across a remote boundary.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <ProfileStat help="profile/Routes owns this full customer context." label="Remote owner" value="profile" />
        <ProfileStat help="Three accountable contacts can approve work." label="Household leads" value={String(householdMembers.length)} />
        <ProfileStat help="Stable member card ids remain selectable." label="Inspection scope" value="remote source" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
          <CardBody>
            <HStack mb={4} spacing={3}>
              <ProfileIcon icon={UsersIcon} />
              <Heading size="md">Household contacts</Heading>
            </HStack>
            <Stack spacing={3}>
              {householdMembers.map((member) => (
                <ProfileMemberCard
                  focus={member.focus}
                  key={member.name}
                  name={member.name}
                  note={member.note}
                  role={member.role}
                />
              ))}
            </Stack>
          </CardBody>
        </Card>

        <VStack align="stretch" spacing={4}>
          <Card bg="profile.900" color="white" rounded="lg">
            <CardBody>
              <HStack mb={4} spacing={3}>
                <ProfileIcon icon={HomeModernIcon} />
                <Heading size="md">Household profile summary</Heading>
              </HStack>
              <Text color="whiteAlpha.800" lineHeight="1.75">
                Two-story family home, home office on the ground floor, nursery
                upstairs, mixed indoor/outdoor access, and recurring seasonal care
                through the Family Plus plan.
              </Text>
              <Divider borderColor="whiteAlpha.300" my={4} />
              <HStack flexWrap="wrap" spacing={2}>
                {['Side gate access', 'Pet-aware visits', 'Quiet hours', 'Text first'].map((tag) => (
                  <Tag bg="whiteAlpha.200" color="white" key={tag}>
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </CardBody>
          </Card>

          <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
            <CardBody>
              <HStack mb={4} spacing={3}>
                <ProfileIcon icon={KeyIcon} />
                <Heading size="md">Access and care preferences</Heading>
              </HStack>
              <List spacing={3}>
                {householdPreferences.map((preference) => (
                  <ListItem key={preference}>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    {preference}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <PreferencePanel icon={BoltIcon} title="Selection guarantee">
          The Sam Rivera card keeps a stable id for cross-remote MCP selection
          while still being wrapped by production-like Chakra layout, avatar,
          typography, and Heroicon components.
        </PreferencePanel>
        <PreferencePanel icon={AcademicCapIcon} title="Runtime exercise">
          Nested Chakra cards, tags, stats, lists, avatars, and icon wrappers remain
          visible to component tree, selection context, highlight, and source-code
          tools.
        </PreferencePanel>
        <PreferencePanel icon={ShieldCheckIcon} title="Privacy posture">
          Household notes are specific enough for service coordination but scoped
          to operational needs rather than exposing unnecessary personal detail.
        </PreferencePanel>
        <PreferencePanel icon={MapPinIcon} title="Route ownership">
          The profile remote can change household data capture without requiring the
          services catalog team to redeploy its marketplace routes.
        </PreferencePanel>
      </SimpleGrid>
    </Stack>
  );
}

export default function ProfileRoutes() {
  return (
    <ChakraProvider theme={profileTheme}>
      <Routes>
        <Route path="/" element={<ProfileIndex />} />
      </Routes>
    </ChakraProvider>
  );
}
