import { Avatar, Box, CardBody, HStack, Heading, Text } from '@chakra-ui/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { IconBadge } from '@mfplayground/hearthhub-ui';

export function ProfileMemberCard({
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
            <Avatar bg="hearth.700" color="white" name={name} rounded="lg" />
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
          <IconBadge color="hearth.700" icon={SparklesIcon} />
        </HStack>
      </CardBody>
    </article>
  );
}
