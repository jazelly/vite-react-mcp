import {
  Avatar,
  Badge,
  Button,
  HStack,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { AppIcon, ShellPanel, visitRows } from '@mfplayground/hearthhub-ui';

export function VisitTable() {
  return (
    <ShellPanel title="Upcoming Visits">
      <Tabs colorScheme="green" variant="line">
        <TabList>
          <Tab>
            <AppIcon icon={CalendarDaysIcon} />{' '}
            <Text ml={2}>Upcoming Visits</Text>
          </Tab>
          <Tab>Recent Activity</Tab>
          <Tab>Messages</Tab>
          <Tab>Documents</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <HStack flexWrap="wrap" mb={3} spacing={2}>
              {['Next 7 Days', 'Next 30 Days', 'All'].map((filter, index) => (
                <Button
                  colorScheme={index === 0 ? 'green' : 'gray'}
                  key={filter}
                  size="sm"
                  variant={index === 0 ? 'solid' : 'outline'}
                >
                  {filter}
                </Button>
              ))}
              {['All Homes', 'All Services', 'All Vendors'].map((filter) => (
                <Button
                  key={filter}
                  rightIcon={<Icon as={ChevronDownIcon} boxSize={4} />}
                  size="sm"
                  variant="outline"
                >
                  {filter}
                </Button>
              ))}
            </HStack>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Service</Th>
                  <Th>Home</Th>
                  <Th>Vendor</Th>
                  <Th>Technician</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visitRows.map((visit) => (
                  <Tr key={`${visit.date}-${visit.service}`}>
                    <Td>{visit.date}</Td>
                    <Td>{visit.time}</Td>
                    <Td>{visit.service}</Td>
                    <Td>{visit.home}</Td>
                    <Td>{visit.vendor}</Td>
                    <Td>
                      <HStack>
                        <Avatar name={visit.tech} size="xs" />
                        <Text>{visit.tech}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          visit.status === 'Confirmed' ? 'green' : 'orange'
                        }
                      >
                        {visit.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Button
              colorScheme="green"
              mt={3}
              size="sm"
              variant="link"
              w="100%"
            >
              View All Visits
            </Button>
          </TabPanel>
          <TabPanel color="gray.600">
            Recent service notes, remote deploys, and approval events appear
            here.
          </TabPanel>
          <TabPanel color="gray.600">
            Unread homeowner and vendor messages are grouped by property and
            visit.
          </TabPanel>
          <TabPanel color="gray.600">
            Invoices, inspection reports, and plan documents are attached to
            each route.
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ShellPanel>
  );
}
