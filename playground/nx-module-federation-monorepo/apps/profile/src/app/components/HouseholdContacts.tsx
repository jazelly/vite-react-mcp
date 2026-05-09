import { Card, CardBody, HStack, Heading, Stack } from '@chakra-ui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { IconBadge, householdMembers } from '@mfplayground/hearthhub-ui';
import { ProfileMemberCard } from './ProfileMemberCard';

export function HouseholdContacts() {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <HStack mb={4} spacing={3}>
          <IconBadge icon={UsersIcon} />
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
  );
}
