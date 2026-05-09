import {
  Avatar,
  Badge,
  Box,
  Card,
  CardBody,
  ChakraProvider,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  extendTheme,
} from '@chakra-ui/react';
import {
  AcademicCapIcon,
  BoltIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Route, Routes } from 'react-router-dom';

const profileTheme = extendTheme({
  radii: { md: '8px', lg: '8px', xl: '8px' },
});

const teamMembers = [
  ['Mira Chen', 'Design systems governance'],
  ['Owen Park', 'Federation runtime contracts'],
  ['Sam Rivera', 'Component inspection'],
];

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <Stat>
          <StatLabel color="gray.600" fontWeight={800}>
            {label}
          </StatLabel>
          <StatNumber>{value}</StatNumber>
        </Stat>
      </CardBody>
    </Card>
  );
}

function ProfileMemberCard({
  focus,
  name,
}: {
  focus: string;
  name: string;
}) {
  const memberId = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Card
      borderColor="blackAlpha.200"
      borderWidth="1px"
      id={`profile-member-${memberId}`}
      rounded="lg"
      transition="transform 160ms ease, box-shadow 160ms ease"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <CardBody>
        <HStack justify="space-between" spacing={4}>
          <HStack spacing={3}>
            <Avatar bg="blue.600" color="white" name={name} rounded="lg" />
            <Box>
              <Heading as="strong" display="block" size="sm">
                {name}
              </Heading>
              <Text as="span" color="gray.600">
                {focus}
              </Text>
            </Box>
          </HStack>
          <Flex align="center" bg="purple.50" color="purple.700" h={10} justify="center" rounded="lg" w={10}>
            <Icon as={SparklesIcon} boxSize={5} />
          </Flex>
        </HStack>
      </CardBody>
    </Card>
  );
}

function ProfileIndex() {
  return (
    <Stack id="profile-remote" spacing={5}>
      <Box>
        <Badge colorScheme="purple" mb={3}>
          Profile remote
        </Badge>
        <Heading as="h2" size="xl">
          Federated team profile routes.
        </Heading>
        <Text color="gray.600" fontSize="lg" lineHeight="1.8" maxW="760px" mt={4}>
          The profile remote represents the platform ownership directory used during
          release reviews. It combines Chakra cards, avatars, stats, and Heroicons
          around each owner so selector capture crosses a realistic production
          component stack.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <ProfileStat label="Remote owner" value="profile" />
        <ProfileStat label="Accountable leads" value={String(teamMembers.length)} />
        <ProfileStat label="Inspection scope" value="remote source" />
      </SimpleGrid>

      <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
        <CardBody>
          <HStack mb={4} spacing={3}>
            <Flex align="center" bg="blue.50" color="blue.700" h={10} justify="center" rounded="lg" w={10}>
              <Icon as={UsersIcon} boxSize={5} />
            </Flex>
            <Heading size="md">Remote team directory</Heading>
          </HStack>
          <Stack spacing={3}>
            {teamMembers.map(([name, focus]) => (
              <ProfileMemberCard focus={focus} key={name} name={name} />
            ))}
          </Stack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
          <CardBody>
            <HStack color="green.700" mb={3}>
              <Icon as={BoltIcon} boxSize={5} />
              <Heading size="sm">Selection guarantee</Heading>
            </HStack>
            <Text color="gray.600">
              The Sam Rivera card keeps a stable id for cross-remote MCP selection
              while still being wrapped by production-like Chakra layout and icon
              components.
            </Text>
          </CardBody>
        </Card>
        <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
          <CardBody>
            <HStack color="orange.700" mb={3}>
              <Icon as={AcademicCapIcon} boxSize={5} />
              <Heading size="sm">Runtime exercise</Heading>
            </HStack>
            <Text color="gray.600">
              Nested Chakra cards, avatars, stats, and icon wrappers remain visible
              to component tree, selection context, highlight, and source-code tools.
            </Text>
          </CardBody>
        </Card>
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
