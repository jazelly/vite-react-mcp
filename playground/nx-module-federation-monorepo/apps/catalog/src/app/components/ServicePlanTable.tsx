import { Badge, Box, Button, HStack, Icon, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { ArrowTopRightOnSquareIcon, CubeIcon } from '@heroicons/react/24/outline';
import { AppIcon, SectionCard, servicePlans } from '@mfplayground/hearthhub-ui';
import { Link } from 'react-router-dom';

export function ServicePlanTable() {
  return (
    <SectionCard icon={CubeIcon} title="Service plans">
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
                  leftIcon={<AppIcon icon={plan.icon} size={4} />}
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
                <Badge colorScheme={plan.status === 'Active' ? 'green' : 'orange'}>{plan.status}</Badge>
              </Td>
              <Td>
                <Icon as={ArrowTopRightOnSquareIcon} boxSize={5} color="gray.500" />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </SectionCard>
  );
}
