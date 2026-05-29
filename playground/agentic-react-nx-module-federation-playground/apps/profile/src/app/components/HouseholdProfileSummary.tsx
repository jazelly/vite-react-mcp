import {
  Card,
  CardBody,
  Divider,
  HStack,
  Heading,
  List,
  ListIcon,
  ListItem,
  Tag,
  TagLabel,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  HomeModernIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { IconBadge, householdPreferences } from '@mfplayground/hearthhub-ui';

export function HouseholdProfileSummary() {
  return (
    <VStack align="stretch" spacing={4}>
      <Card bg="hearth.900" color="white" rounded="lg">
        <CardBody>
          <HStack mb={4} spacing={3}>
            <IconBadge
              bg="whiteAlpha.200"
              color="white"
              icon={HomeModernIcon}
            />
            <Heading color="white" size="md">
              Household profile summary
            </Heading>
          </HStack>
          <Text color="whiteAlpha.800" lineHeight="1.75">
            Two-story family home, home office on the ground floor, nursery
            upstairs, mixed indoor/outdoor access, and recurring seasonal care
            through the Family Plus plan.
          </Text>
          <Divider borderColor="whiteAlpha.300" my={4} />
          <HStack flexWrap="wrap" spacing={2}>
            {[
              'Side gate access',
              'Pet-aware visits',
              'Quiet hours',
              'Text first',
            ].map((tag) => (
              <Tag bg="whiteAlpha.200" color="white" key={tag}>
                <TagLabel>{tag}</TagLabel>
              </Tag>
            ))}
          </HStack>
        </CardBody>
      </Card>

      <Card
        bg="white"
        borderColor="blackAlpha.200"
        borderWidth="1px"
        rounded="lg"
      >
        <CardBody>
          <HStack mb={4} spacing={3}>
            <IconBadge icon={KeyIcon} />
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
  );
}
