import {
  Avatar,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
} from '@chakra-ui/react';
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  HomeModernIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  AppIcon,
  primaryNavigation,
  secondaryNavigation,
  type IconComponent,
} from '@mfplayground/hearthhub-ui';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

function SidebarLink({
  count,
  icon,
  isActive,
  label,
  to,
}: {
  count?: string;
  icon: IconComponent;
  isActive?: boolean;
  label: string;
  to?: string;
}) {
  const content = (
    <HStack
      bg={isActive ? 'whiteAlpha.200' : 'transparent'}
      color="white"
      justify="space-between"
      px={3}
      py={2.5}
      rounded="lg"
      _hover={{ bg: 'whiteAlpha.200' }}
    >
      <HStack spacing={3}>
        <AppIcon icon={icon} />
        <Text fontSize="sm" fontWeight={700}>
          {label}
        </Text>
      </HStack>
      {count ? (
        <Box as="span" bg="whiteAlpha.300" borderRadius="full" fontSize="xs" fontWeight={800} px={2}>
          {count}
        </Box>
      ) : null}
    </HStack>
  );

  return to ? (
    <Box as={Link} display="block" to={to}>
      {content}
    </Box>
  ) : (
    content
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <Flex
      bg="hearth.900"
      color="white"
      direction="column"
      display={{ base: 'none', lg: 'flex' }}
      flexShrink={0}
      minH="100vh"
      p={4}
      w="224px"
    >
      <HStack color="gold.100" mb={6} spacing={2}>
        <AppIcon icon={HomeModernIcon} />
        <Heading color="white" size="md">
          HearthHub
        </Heading>
      </HStack>

      <HStack borderColor="whiteAlpha.300" borderWidth="1px" mb={4} p={3} rounded="lg">
        <AppIcon icon={ShieldCheckIcon} />
        <Box minW={0}>
          <Text fontSize="sm" fontWeight={800}>
            Oakridge Properties
          </Text>
          <Text color="whiteAlpha.700" fontSize="xs">
            Portfolio · 24 homes
          </Text>
        </Box>
        <Icon as={ChevronDownIcon} boxSize={4} ml="auto" />
      </HStack>

      <Box>
        {primaryNavigation.map((item) => (
          <SidebarLink
            icon={item.icon}
            isActive={location.pathname === item.to}
            key={item.to}
            label={item.label}
            to={item.to}
          />
        ))}
      </Box>

      <Divider borderColor="whiteAlpha.300" my={5} />

      <Box>
        {secondaryNavigation.map((item) => (
          <SidebarLink count={item.count} icon={item.icon} key={item.label} label={item.label} />
        ))}
      </Box>

      <Box borderColor="whiteAlpha.300" borderWidth="1px" mt="auto" p={4} rounded="lg">
        <HStack mb={3}>
          <AppIcon icon={LifebuoyIcon} />
          <Box>
            <Text fontSize="sm" fontWeight={800}>
              Need help now?
            </Text>
            <Text color="whiteAlpha.700" fontSize="xs">
              Talk to our care team 24/7.
            </Text>
          </Box>
        </HStack>
        <Button colorScheme="green" size="sm" w="100%">
          Contact Support
        </Button>
      </Box>

      <HStack borderTopColor="whiteAlpha.300" borderTopWidth="1px" mt={4} pt={4}>
        <Avatar name="Jennifer Park" size="sm" />
        <Box>
          <Text fontSize="sm" fontWeight={800}>
            Jennifer Park
          </Text>
          <Text color="whiteAlpha.700" fontSize="xs">
            Admin
          </Text>
        </Box>
        <Icon as={ChevronDownIcon} boxSize={4} ml="auto" />
      </HStack>
    </Flex>
  );
}

function TopBar() {
  return (
    <Flex
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={4}
      justify="space-between"
      mb={5}
    >
      <Box>
        <HStack color="gold.500" spacing={2}>
          <AppIcon icon={HomeModernIcon} />
          <Heading size="md">Good morning, Jennifer</Heading>
        </HStack>
        <Text color="gray.600" fontSize="sm">
          Here&apos;s what&apos;s happening at Oakridge Properties.
        </Text>
      </Box>
      <HStack spacing={3}>
        <InputGroup display={{ base: 'none', xl: 'block' }} w="490px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MagnifyingGlassIcon} boxSize={5} color="gray.500" />
          </InputLeftElement>
          <Input bg="white" placeholder="Search homes, services, vendors, or requests..." rounded="lg" />
        </InputGroup>
        <Circle bg="white" borderColor="blackAlpha.200" borderWidth="1px" size="40px">
          <Icon as={BellIcon} boxSize={5} />
        </Circle>
        <Circle bg="white" borderColor="blackAlpha.200" borderWidth="1px" size="40px">
          <Icon as={ChatBubbleLeftRightIcon} boxSize={5} />
        </Circle>
        <Button colorScheme="green" rightIcon={<Icon as={ChevronDownIcon} boxSize={4} />}>
          New Request
        </Button>
      </HStack>
    </Flex>
  );
}

function MobileHeader() {
  return (
    <HStack bg="hearth.900" color="white" display={{ base: 'flex', lg: 'none' }} justify="space-between" p={4}>
      <HStack>
        <AppIcon icon={HomeModernIcon} />
        <Heading color="white" size="md">
          HearthHub
        </Heading>
      </HStack>
      <Button colorScheme="green" size="sm">
        New Request
      </Button>
    </HStack>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <Flex minH="100vh">
      <Sidebar />
      <Box flex="1" minW={0}>
        <MobileHeader />
        <Box p={{ base: 4, lg: 6 }} pb={10}>
          <TopBar />
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
