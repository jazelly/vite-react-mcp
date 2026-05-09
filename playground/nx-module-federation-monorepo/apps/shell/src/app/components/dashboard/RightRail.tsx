import {
  Avatar,
  Badge,
  Box,
  Button,
  Circle,
  Divider,
  HStack,
  Heading,
  Icon,
  Progress,
  Stack,
  Text,
} from '@chakra-ui/react';
import { CalendarDaysIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AppIcon, ShellPanel, issueTriage, readinessTasks, routeOwners } from '@mfplayground/hearthhub-ui';

function UpcomingVisitCard() {
  return (
    <ShellPanel action={<AppIcon icon={CalendarDaysIcon} />} title="Upcoming Visit">
      <HStack align="stretch" spacing={4}>
        <Box alignItems="center" borderColor="blackAlpha.200" borderWidth="1px" display="flex" flexDirection="column" justifyContent="center" rounded="lg" w="72px">
          <Text color="hearth.600" fontSize="xs" fontWeight={900}>MAY</Text>
          <Text fontSize="3xl" fontWeight={900}>28</Text>
          <Text color="gray.500" fontSize="xs">WED</Text>
        </Box>
        <Box flex="1">
          <HStack justify="space-between">
            <Heading size="sm">HVAC Seasonal Tune-Up</Heading>
            <Badge colorScheme="orange">Scheduled</Badge>
          </HStack>
          <Text>9:00 - 11:00 AM</Text>
          <Text color="gray.600">123 Maple Ridge Dr</Text>
          <HStack mt={2}>
            <Avatar name="Alex Ramirez" size="xs" />
            <Text color="gray.600" fontSize="sm">Technician: Alex Ramirez</Text>
          </HStack>
        </Box>
      </HStack>
      <HStack mt={4}>
        <Button colorScheme="green" flex="1" size="sm">View Visit</Button>
        <Button flex="1" size="sm" variant="outline">Reschedule</Button>
      </HStack>
    </ShellPanel>
  );
}

function SeasonalReadinessCard() {
  return (
    <ShellPanel action={<Button colorScheme="green" size="xs" variant="link">View all</Button>} title="Seasonal Readiness">
      <HStack align="center" mb={4} spacing={4}>
        <Circle borderColor="hearth.600" borderWidth="8px" size="86px">
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight={900}>72%</Text>
            <Text color="gray.600" fontSize="xs">Ready</Text>
          </Box>
        </Circle>
        <Box>
          <Text fontWeight={800}>You&apos;re on track for summer.</Text>
          <Text color="gray.600" fontSize="sm">2 of 7 seasonal tasks remaining.</Text>
        </Box>
      </HStack>
      <Stack divider={<Divider />} spacing={2}>
        {readinessTasks.map(([task, date, state]) => (
          <HStack key={task} justify="space-between">
            <HStack>
              {state === 'open' ? (
                <Circle borderColor="gray.400" borderWidth="1px" size="14px" />
              ) : (
                <Icon
                  as={state === 'done' ? CheckCircleIcon : ExclamationTriangleIcon}
                  boxSize={4}
                  color={state === 'done' ? 'green.500' : 'orange.500'}
                />
              )}
              <Text fontSize="sm">{task}</Text>
            </HStack>
            <Text color="gray.500" fontSize="xs">{date}</Text>
          </HStack>
        ))}
      </Stack>
      <Button colorScheme="green" mt={3} size="sm" variant="link" w="100%">
        View Seasonal Checklist
      </Button>
    </ShellPanel>
  );
}

function IssueTriageCard() {
  return (
    <ShellPanel action={<Button colorScheme="green" size="xs" variant="link">View all (3)</Button>} title="Issue Triage">
      <Stack spacing={3}>
        {issueTriage.map(([issue, home, level, time]) => (
          <HStack key={issue} justify="space-between">
            <HStack>
              <Circle bg={level === 'High' ? 'red.500' : level === 'Medium' ? 'orange.400' : 'yellow.400'} color="white" size="24px">
                !
              </Circle>
              <Box>
                <Text fontSize="sm" fontWeight={800}>{issue}</Text>
                <Text color="gray.500" fontSize="xs">{home}</Text>
              </Box>
            </HStack>
            <HStack>
              <Badge colorScheme={level === 'High' ? 'red' : level === 'Medium' ? 'orange' : 'green'}>{level}</Badge>
              <Text color="gray.500" fontSize="xs">{time}</Text>
            </HStack>
          </HStack>
        ))}
      </Stack>
      <Button colorScheme="green" mt={3} size="sm" variant="link" w="100%">
        Go to Requests
      </Button>
    </ShellPanel>
  );
}

function RouteOwnershipCard() {
  return (
    <ShellPanel action={<Button colorScheme="green" size="xs" variant="link">View map</Button>} title="Route Ownership">
      <Stack spacing={3}>
        {routeOwners.map(([owner, count, progress]) => (
          <HStack key={owner}>
            <Avatar name={String(owner)} size="xs" />
            <Text flex="1" fontSize="sm">{owner}</Text>
            <Text color="gray.600" fontSize="xs">{count}</Text>
            <Progress colorScheme="green" flex="1" rounded="full" size="sm" value={Number(progress)} />
            <Text color="gray.600" fontSize="xs">{progress}%</Text>
          </HStack>
        ))}
      </Stack>
      <Button colorScheme="green" mt={3} size="sm" variant="link" w="100%">
        Manage Routes
      </Button>
    </ShellPanel>
  );
}

export function RightRail() {
  return (
    <Stack spacing={4}>
      <UpcomingVisitCard />
      <SeasonalReadinessCard />
      <IssueTriageCard />
      <RouteOwnershipCard />
    </Stack>
  );
}
