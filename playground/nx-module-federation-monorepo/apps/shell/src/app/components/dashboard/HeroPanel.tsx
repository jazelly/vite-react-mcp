import { Box, Button, Heading, Icon, Text } from '@chakra-ui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import commandCenterImage from '../../../assets/hearthhub-command-center.png';

export function HeroPanel() {
  return (
    <Box
      bgImage={`linear-gradient(90deg, rgba(3, 40, 31, 0.97) 0%, rgba(3, 40, 31, 0.86) 39%, rgba(3, 40, 31, 0.18) 100%), url(${commandCenterImage})`}
      bgPosition="center"
      bgSize="cover"
      color="white"
      minH="230px"
      p={{ base: 6, md: 8 }}
      rounded="lg"
    >
      <Text color="gold.100" fontSize="sm" fontWeight={900} mb={3}>
        Command Center
      </Text>
      <Heading color="white" maxW="560px" size="xl">
        All systems. Every home.
      </Heading>
      <Text color="whiteAlpha.900" lineHeight="1.8" maxW="420px" mt={4}>
        Monitor visits, manage vendors, and keep your homes running smoothly.
      </Text>
      <Button
        as={Link}
        color="white"
        mt={6}
        rightIcon={
          <Icon as={ChevronDownIcon} boxSize={4} transform="rotate(-90deg)" />
        }
        to="/diagnostics"
        variant="outline"
      >
        View Operations
      </Button>
    </Box>
  );
}
