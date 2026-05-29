import {
  Badge,
  Box,
  Button,
  Circle,
  Divider,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import { AppIcon, ShellPanel, servicePlans } from '@mfplayground/hearthhub-ui';
import { Link } from 'react-router-dom';

export function ServicePlansPanel() {
  return (
    <ShellPanel
      action={
        <Button colorScheme="green" size="xs" variant="link">
          Manage
        </Button>
      }
      title="Service Plans"
    >
      <Stack divider={<Divider />} spacing={3}>
        {servicePlans.map((plan) => (
          <HStack key={plan.id} justify="space-between">
            <HStack>
              <Circle bg={plan.color} color="white" size="38px">
                <AppIcon icon={plan.icon} />
              </Circle>
              <Box>
                <Text fontWeight={800}>{plan.displayName}</Text>
                <Text color="gray.500" fontSize="xs">
                  {plan.homes}
                </Text>
              </Box>
            </HStack>
            <Badge colorScheme={plan.status === 'Active' ? 'green' : 'orange'}>
              {plan.status}
            </Badge>
          </HStack>
        ))}
      </Stack>
      <Button
        as={Link}
        colorScheme="green"
        mt={4}
        size="sm"
        to="/catalog"
        variant="link"
        w="100%"
      >
        View All Plans
      </Button>
    </ShellPanel>
  );
}
