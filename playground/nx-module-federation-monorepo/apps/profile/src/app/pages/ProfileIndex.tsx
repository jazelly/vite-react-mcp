import { Box, SimpleGrid, Stack } from '@chakra-ui/react';
import {
  AcademicCapIcon,
  BoltIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  MetricCard,
  RemotePageHeader,
  householdMembers,
} from '@mfplayground/hearthhub-ui';
import { HouseholdContacts } from '../components/HouseholdContacts';
import { HouseholdProfileSummary } from '../components/HouseholdProfileSummary';
import { PreferencePanel } from '../components/PreferencePanel';

export function ProfileIndex() {
  return (
    <Stack id="profile-remote" spacing={5}>
      <RemotePageHeader icon={UserCircleIcon} label="Profile remote" title="Federated team profile routes.">
        The profile remote owns the household context that makes every service
        visit feel prepared: authorized contacts, access instructions, care
        preferences, pet notes, and inspection-safe member cards for MCP selection
        across a remote boundary.
      </RemotePageHeader>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <MetricCard help="profile/Routes owns this full customer context." label="Remote owner" value="profile" />
        <MetricCard help="Three accountable contacts can approve work." label="Household leads" value={String(householdMembers.length)} />
        <MetricCard help="Stable member card ids remain selectable." label="Inspection scope" value="remote source" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <HouseholdContacts />
        <HouseholdProfileSummary />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <PreferencePanel icon={BoltIcon} title="Selection guarantee">
          The Sam Rivera card keeps a stable id for cross-remote MCP selection
          while still being wrapped by production-like Chakra layout, avatar,
          typography, and Heroicon components.
        </PreferencePanel>
        <PreferencePanel icon={AcademicCapIcon} title="Runtime exercise">
          Nested Chakra cards, tags, stats, lists, avatars, and icon wrappers remain
          visible to component tree, selection context, highlight, and source-code
          tools.
        </PreferencePanel>
        <PreferencePanel icon={ShieldCheckIcon} title="Privacy posture">
          Household notes are specific enough for service coordination but scoped
          to operational needs rather than exposing unnecessary personal detail.
        </PreferencePanel>
        <PreferencePanel icon={MapPinIcon} title="Route ownership">
          The profile remote can change household data capture without requiring the
          services catalog team to redeploy its marketplace routes.
        </PreferencePanel>
      </SimpleGrid>
    </Stack>
  );
}
