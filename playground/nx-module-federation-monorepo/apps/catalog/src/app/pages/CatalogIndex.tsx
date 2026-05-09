import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import { Grid, Stack } from '@chakra-ui/react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { RemotePageHeader } from '@mfplayground/hearthhub-ui';
import { CatalogSummaryCards } from '../components/CatalogSummaryCards';
import { MarketplaceQualityBar } from '../components/MarketplaceQualityBar';
import { ServicePlanTable } from '../components/ServicePlanTable';

export function CatalogIndex() {
  return (
    <Stack id="catalog-remote" spacing={5}>
      <RemotePageHeader
        action={<LegacyRuntimeBadge />}
        icon={WrenchScrewdriverIcon}
        label="Catalog remote"
        title="Federated product routes."
      >
        The services marketplace team owns the plan inventory, vendor
        availability, enrollment copy, and detail pages that help a household
        choose practical coverage before a repair becomes urgent.
      </RemotePageHeader>

      <CatalogSummaryCards />

      <Grid gap={4} templateColumns={{ base: '1fr', xl: '1.25fr 0.75fr' }}>
        <ServicePlanTable />
        <MarketplaceQualityBar />
      </Grid>
    </Stack>
  );
}
