import { Card, CardBody, HStack, Heading, Text } from '@chakra-ui/react';
import { AppIcon, type IconComponent } from '@mfplayground/hearthhub-ui';
import type { ReactNode } from 'react';

export function PreferencePanel({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: IconComponent;
  title: string;
}) {
  return (
    <Card bg="white" borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <HStack color="hearth.700" mb={3}>
          <AppIcon icon={icon} />
          <Heading size="sm">{title}</Heading>
        </HStack>
        <Text color="gray.600" lineHeight="1.7">
          {children}
        </Text>
      </CardBody>
    </Card>
  );
}
