import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  HStack,
  Heading,
  Icon,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import type { ComponentType, ReactNode, SVGProps } from 'react';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export function AppIcon({
  icon,
  size = 5,
}: { icon: IconComponent; size?: number }) {
  return <Icon as={icon} boxSize={size} strokeWidth={1.8} />;
}

export function IconBadge({
  bg = 'hearth.50',
  color = 'hearth.700',
  icon,
  size = '40px',
}: {
  bg?: string;
  color?: string;
  icon: IconComponent;
  size?: string;
}) {
  return (
    <Flex
      align="center"
      bg={bg}
      color={color}
      h={size}
      justify="center"
      rounded="lg"
      w={size}
    >
      <AppIcon icon={icon} />
    </Flex>
  );
}

export function ShellPanel({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <Card
      bg="white"
      borderColor="blackAlpha.200"
      borderWidth="1px"
      boxShadow="sm"
      rounded="lg"
    >
      <CardBody p={0}>
        <HStack
          borderBottomColor="blackAlpha.100"
          borderBottomWidth="1px"
          justify="space-between"
          px={4}
          py={3}
        >
          <Heading size="sm">{title}</Heading>
          {action}
        </HStack>
        <Box p={4}>{children}</Box>
      </CardBody>
    </Card>
  );
}

export function SectionCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: IconComponent;
  title: string;
}) {
  return (
    <Card
      bg="white"
      borderColor="blackAlpha.200"
      borderWidth="1px"
      boxShadow="sm"
      rounded="lg"
    >
      <CardBody>
        <HStack mb={4} spacing={3}>
          <IconBadge icon={icon} size="44px" />
          <Heading size="md">{title}</Heading>
        </HStack>
        {children}
      </CardBody>
    </Card>
  );
}

export function RemotePageHeader({
  action,
  children,
  icon,
  label,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  icon: IconComponent;
  label: string;
  title: string;
}) {
  return (
    <Flex
      align={{ base: 'flex-start', lg: 'center' }}
      direction={{ base: 'column', lg: 'row' }}
      gap={4}
      justify="space-between"
    >
      <Box>
        <HStack color="hearth.700" mb={3}>
          <AppIcon icon={icon} />
          <Text fontWeight={800}>{label}</Text>
        </HStack>
        <Heading as="h2" size="xl">
          {title}
        </Heading>
        <Text
          color="gray.600"
          fontSize="lg"
          lineHeight="1.75"
          maxW="820px"
          mt={4}
        >
          {children}
        </Text>
      </Box>
      {action}
    </Flex>
  );
}

export function MetricCard({
  help,
  label,
  value,
}: {
  help: string;
  label: string;
  value: string;
}) {
  return (
    <Card
      bg="white"
      borderColor="blackAlpha.200"
      borderWidth="1px"
      rounded="lg"
    >
      <CardBody>
        <Stat>
          <StatLabel color="gray.600" fontWeight={800}>
            {label}
          </StatLabel>
          <StatNumber>{value}</StatNumber>
          <StatHelpText mb={0}>{help}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const colorScheme =
    normalized.includes('active') ||
    normalized.includes('confirmed') ||
    normalized.includes('stable')
      ? 'green'
      : normalized.includes('high')
        ? 'red'
        : 'orange';

  return <Badge colorScheme={colorScheme}>{value}</Badge>;
}
