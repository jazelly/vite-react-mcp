import { Grid, Stack } from '@chakra-ui/react';
import { HeroPanel } from '../components/dashboard/HeroPanel';
import { RightRail } from '../components/dashboard/RightRail';
import { ServicePlansPanel } from '../components/dashboard/ServicePlansPanel';
import { StatsStrip } from '../components/dashboard/StatsStrip';
import { TrustedVendorsPanel } from '../components/dashboard/TrustedVendorsPanel';
import { VisitTable } from '../components/dashboard/VisitTable';

export function ShellHome() {
  return (
    <Grid
      id="shell-workspace"
      gap={4}
      templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 365px' }}
    >
      <Stack spacing={4}>
        <HeroPanel />
        <StatsStrip />
        <Grid gap={4} templateColumns={{ base: '1fr', xl: '1.2fr 0.78fr' }}>
          <TrustedVendorsPanel />
          <ServicePlansPanel />
        </Grid>
        <VisitTable />
      </Stack>
      <RightRail />
    </Grid>
  );
}
