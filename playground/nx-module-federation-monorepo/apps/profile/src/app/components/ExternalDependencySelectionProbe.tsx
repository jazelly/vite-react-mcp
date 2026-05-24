import {
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { AppIcon } from '@mfplayground/hearthhub-ui';

export function ExternalDependencySelectionProbe() {
  return (
    <Card
      bg="white"
      borderColor="blackAlpha.200"
      borderWidth="1px"
      rounded="lg"
    >
      <CardBody>
        <HStack align="flex-start" justify="space-between" spacing={4}>
          <HStack align="flex-start" spacing={3}>
            <AppIcon icon={BoltIcon} />
            <div>
              <Heading size="sm">External dependency selection</Heading>
              <Text color="gray.600" lineHeight="1.7" mt={2}>
                This local profile component intentionally renders a Chakra UI
                button so selector tests can attribute a package component back
                to the project file that uses it.
              </Text>
            </div>
          </HStack>
          <Button
            colorScheme="green"
            id="profile-external-component-probe"
            size="sm"
          >
            Review access note
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}
