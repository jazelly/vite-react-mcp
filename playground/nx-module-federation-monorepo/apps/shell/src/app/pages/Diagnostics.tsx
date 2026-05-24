import {
  Box,
  Divider,
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Stack,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CubeTransparentIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';
import { AppIcon, SectionCard } from '@mfplayground/hearthhub-ui';
import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';

export function Diagnostics() {
  return (
    <Stack id="runtime-diagnostics" spacing={5}>
      <Box>
        <Text color="hearth.700" fontWeight={800}>
          <AppIcon icon={Cog6ToothIcon} /> Runtime board
        </Text>
        <Text as="h2" fontSize="3xl" fontWeight={900} mt={3}>
          Production diagnostics for the federated HearthHub app.
        </Text>
        <Text
          color="gray.600"
          fontSize="lg"
          lineHeight="1.8"
          maxW="820px"
          mt={4}
        >
          Developers use this board to confirm that customer-facing screens
          still expose accurate component trees, stable selection targets, and
          route ownership after each remote ships.
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <LegacyRuntimeBadge />
        <SectionCard icon={CubeTransparentIcon} title="MCP runtime">
          <Text color="gray.600">window.__VITE_REACT_MCP__</Text>
          <Text fontWeight={800}>available in the shell host and remotes</Text>
        </SectionCard>
        <SectionCard icon={PuzzlePieceIcon} title="Remote boundaries">
          <List spacing={2}>
            {[
              'catalog/Routes owns service plans',
              'profile/Routes owns household context',
            ].map((item) => (
              <ListItem key={item}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {item}
              </ListItem>
            ))}
          </List>
        </SectionCard>
        <SectionCard icon={ArrowPathIcon} title="Shared runtime contract">
          <Text color="gray.600">
            React 18.2.0 and React Router 6.4.2 remain strict singletons.
          </Text>
          <Divider my={4} />
          <Tag colorScheme="green">
            <TagLabel>module-federation.js enforced</TagLabel>
          </Tag>
        </SectionCard>
      </SimpleGrid>
    </Stack>
  );
}
