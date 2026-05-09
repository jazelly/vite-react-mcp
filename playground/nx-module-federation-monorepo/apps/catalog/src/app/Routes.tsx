import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  ChakraProvider,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  extendTheme,
} from '@chakra-ui/react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CircleStackIcon,
  CubeIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

const catalogTheme = extendTheme({
  radii: { md: '8px', lg: '8px', xl: '8px' },
});

const products = [
  {
    id: 'mf-compiler',
    name: 'Federated release compiler',
    owner: 'platform',
    status: 'stable',
  },
  {
    id: 'router-642',
    name: 'Route ownership registry',
    owner: 'catalog',
    status: 'adopting',
  },
  {
    id: 'legacy-react',
    name: 'Legacy dependency exception',
    owner: 'migration',
    status: 'tracked',
  },
];

function CatalogIcon({ icon }: { icon: typeof CircleStackIcon }) {
  return (
    <Flex align="center" bg="blue.50" color="blue.700" h={10} justify="center" rounded="lg" w={10}>
      <Icon as={icon} boxSize={5} />
    </Flex>
  );
}

function RemoteCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <HStack mb={4} spacing={3}>
          <CatalogIcon icon={CircleStackIcon} />
          <Heading size="md">{title}</Heading>
        </HStack>
        {children}
      </CardBody>
    </Card>
  );
}

function CatalogIndex() {
  return (
    <Stack id="catalog-remote" spacing={5}>
      <Flex align={{ base: 'flex-start', lg: 'center' }} direction={{ base: 'column', lg: 'row' }} gap={4} justify="space-between">
        <Box>
          <Badge colorScheme="blue" mb={3}>
            Catalog remote
          </Badge>
          <Heading as="h2" size="xl">
            Federated product routes.
          </Heading>
        </Box>
        <LegacyRuntimeBadge />
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <RemoteCard title="Remote scope">
          <Text color="gray.600">catalog/Routes</Text>
          <Text fontWeight={800}>service catalog module</Text>
        </RemoteCard>
        <RemoteCard title="Route count">
          <Text color="gray.600">release governance paths</Text>
          <Text fontWeight={800}>{products.length} entries</Text>
        </RemoteCard>
        <RemoteCard title="Selector model">
          <Text color="gray.600">Chakra table rows, badges, and links</Text>
          <Text fontWeight={800}>source aware</Text>
        </RemoteCard>
      </SimpleGrid>

      <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
        <CardBody>
          <HStack mb={4} spacing={3}>
            <CatalogIcon icon={ServerStackIcon} />
            <Heading size="md">Catalog products</Heading>
          </HStack>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Package</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Open</Th>
              </Tr>
            </Thead>
            <Tbody>
              {products.map((product) => (
                <Tr key={product.id}>
                  <Td>
                    <Button
                      as={Link}
                      colorScheme="blue"
                      leftIcon={<Icon as={CubeIcon} boxSize={4} />}
                      size="sm"
                      to={product.id}
                      variant="link"
                    >
                      {product.name}
                    </Button>
                  </Td>
                  <Td>{product.owner}</Td>
                  <Td>
                    <Badge colorScheme={product.status === 'stable' ? 'green' : 'purple'}>
                      {product.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Icon as={ArrowTopRightOnSquareIcon} boxSize={5} color="gray.500" />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Stack>
  );
}

function ProductDetail() {
  return (
    <Card borderColor="blackAlpha.200" borderWidth="1px" rounded="lg">
      <CardBody>
        <Badge colorScheme="purple" mb={3}>
          Remote detail
        </Badge>
        <Heading as="h2" size="xl">
          Route rendered from catalog/Routes.
        </Heading>
        <Text color="gray.600" fontSize="lg" lineHeight="1.8" mt={4}>
          This view is intentionally owned by the remote app so MCP runtime tools
          can inspect components across the host boundary while preserving product
          ownership, migration status, and source-context routing.
        </Text>
        <Button as={Link} leftIcon={<Icon as={ArrowLeftIcon} boxSize={4} />} mt={6} to="/catalog">
          Back to catalog
        </Button>
      </CardBody>
    </Card>
  );
}

export default function CatalogRoutes() {
  return (
    <ChakraProvider theme={catalogTheme}>
      <Routes>
        <Route path="/" element={<CatalogIndex />} />
        <Route path=":productId" element={<ProductDetail />} />
      </Routes>
    </ChakraProvider>
  );
}
