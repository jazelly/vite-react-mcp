import {
  Box,
  Button,
  Circle,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import {
  AppIcon,
  ShellPanel,
  trustedVendors,
} from '@mfplayground/hearthhub-ui';

export function TrustedVendorsPanel() {
  return (
    <ShellPanel
      action={
        <Button colorScheme="green" size="xs" variant="link">
          View all
        </Button>
      }
      title="Trusted Vendors"
    >
      <Table
        size="sm"
        sx={{
          'td, th': { fontSize: '11px', px: 2 },
          th: { letterSpacing: '0.04em' },
        }}
        variant="simple"
      >
        <Thead>
          <Tr>
            <Th>Vendor</Th>
            <Th>Categories</Th>
            <Th>Rating</Th>
            <Th>Perf.</Th>
            <Th>Last</Th>
          </Tr>
        </Thead>
        <Tbody>
          {trustedVendors.map((vendor) => (
            <Tr key={vendor.name}>
              <Td>
                <HStack>
                  <Circle bg={vendor.color} color="white" size="34px">
                    <AppIcon icon={vendor.icon} />
                  </Circle>
                  <Box>
                    <Text fontWeight={800}>{vendor.name}</Text>
                    <Text color="gray.500" fontSize="xs">
                      {vendor.category}
                    </Text>
                  </Box>
                </HStack>
              </Td>
              <Td>
                <HStack spacing={1}>
                  {vendor.serviceIcons.map((serviceIcon) => (
                    <Circle
                      bg="gray.100"
                      fontSize="xs"
                      key={serviceIcon}
                      size="22px"
                    >
                      {serviceIcon}
                    </Circle>
                  ))}
                </HStack>
              </Td>
              <Td>
                <HStack spacing={1}>
                  <Text>{vendor.rating}</Text>
                  <Text color="gold.500" letterSpacing="0" whiteSpace="nowrap">
                    ★★★★★
                  </Text>
                </HStack>
              </Td>
              <Td>
                <Text color="hearth.700" fontWeight={800}>
                  {vendor.performance}%
                </Text>
                <Text color="gray.500" fontSize="xs">
                  On-time
                </Text>
              </Td>
              <Td>{vendor.lastVisit}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button colorScheme="green" mt={3} size="sm" variant="link" w="100%">
        Browse All Vendors
      </Button>
    </ShellPanel>
  );
}
