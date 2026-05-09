import {
  Bars3BottomLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FolderIcon,
  HomeModernIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { IconComponent } from './components';

export const primaryNavigation = [
  { to: '/', label: 'Home', icon: HomeModernIcon },
  { to: '/catalog', label: 'Services', icon: WrenchScrewdriverIcon },
  { to: '/profile', label: 'Household', icon: PuzzlePieceIcon },
  { to: '/diagnostics', label: 'Diagnostics', icon: Bars3BottomLeftIcon },
];

export const secondaryNavigation = [
  { label: 'Visits', count: '8', icon: CalendarDaysIcon },
  { label: 'Requests', count: '3', icon: ClipboardDocumentCheckIcon },
  { label: 'Vendors', icon: ShieldCheckIcon },
  { label: 'Subscriptions', icon: Bars3BottomLeftIcon },
  { label: 'Documents', icon: DocumentTextIcon },
  { label: 'Messages', count: '2', icon: EnvelopeIcon },
  { label: 'Billing', icon: CreditCardIcon },
  { label: 'Reports', icon: FolderIcon },
  { label: 'Settings', icon: Cog6ToothIcon },
];

export const shellStats = [
  { label: 'Open Requests', value: '3', delta: '+1', help: '2 urgent', tone: 'red' },
  { label: 'Upcoming Visits', value: '8', delta: '+2', help: 'Next 7 days', tone: 'red' },
  { label: 'Active Subscriptions', value: '12', delta: '-', help: 'Across 24 homes', tone: 'gray' },
  { label: 'Monthly Spend', value: '$18,540', delta: '↓ 8%', help: 'vs Apr 2025', tone: 'green' },
  { label: 'Vendor Rating', value: '4.8', delta: '☆', help: 'Average', tone: 'gold' },
];

export type Vendor = {
  category: string;
  color: string;
  icon: IconComponent;
  lastVisit: string;
  name: string;
  performance: number;
  rating: string;
  serviceIcons: string[];
};

export const trustedVendors: Vendor[] = [
  {
    name: 'Evergreen HVAC',
    category: 'HVAC',
    rating: '4.9',
    performance: 98,
    lastVisit: 'May 20, 2025',
    icon: HomeModernIcon,
    color: 'hearth.700',
    serviceIcons: ['❄', '🔥', '⚙'],
  },
  {
    name: 'Pinnacle Plumbing',
    category: 'Plumbing',
    rating: '4.8',
    performance: 96,
    lastVisit: 'May 18, 2025',
    icon: WrenchScrewdriverIcon,
    color: 'gray.600',
    serviceIcons: ['💧', '🔧'],
  },
  {
    name: 'Brightview Electric',
    category: 'Electrical',
    rating: '4.7',
    performance: 94,
    lastVisit: 'May 15, 2025',
    icon: SparklesIcon,
    color: 'gold.500',
    serviceIcons: ['⚡', '▣'],
  },
  {
    name: 'GreenScape Lawns',
    category: 'Landscaping',
    rating: '4.8',
    performance: 97,
    lastVisit: 'May 12, 2025',
    icon: ShieldCheckIcon,
    color: 'green.600',
    serviceIcons: ['🌿', '▲'],
  },
];

export const servicePlans = [
  {
    id: 'family-plus',
    name: 'Family Plus seasonal care',
    displayName: 'Home Essentials Plan',
    technicalName: 'React Router 6.4.2 route island',
    owner: 'services marketplace',
    status: 'Enrolling',
    price: '$89/mo',
    readiness: 92,
    homes: '12 homes',
    icon: HomeModernIcon,
    color: 'gold.600',
    summary:
      'Quarterly HVAC, plumbing, appliance, and safety checks bundled with emergency booking priority.',
  },
  {
    id: 'leak-watch',
    name: 'Leak watch response',
    displayName: 'HVAC Protection Plan',
    technicalName: 'Remote plan detail boundary',
    owner: 'home protection',
    status: 'Active',
    price: '$24/mo',
    readiness: 81,
    homes: '10 homes',
    icon: WrenchScrewdriverIcon,
    color: 'teal.600',
    summary:
      'Moisture sensor dispatch, same-day plumber coordination, and repair documentation for insurance claims.',
  },
  {
    id: 'plumbing-care',
    name: 'Plumbing Care Plan',
    displayName: 'Plumbing Care Plan',
    technicalName: 'Catalog remote service path',
    owner: 'home protection',
    status: 'Active',
    price: '$34/mo',
    readiness: 84,
    homes: '8 homes',
    icon: ShieldCheckIcon,
    color: 'blue.600',
    summary:
      'Annual plumbing inspection, fixture leak response, water heater reminders, and vetted provider coordination.',
  },
  {
    id: 'electrical-safety',
    name: 'Electrical Safety Plan',
    displayName: 'Electrical Safety Plan',
    technicalName: 'Catalog remote commerce path',
    owner: 'new home onboarding',
    status: 'Expiring Soon',
    price: '$42/mo',
    readiness: 68,
    homes: '6 homes',
    icon: SparklesIcon,
    color: 'orange.500',
    summary:
      'Outlet inspection, panel review, smoke detector checks, and priority scheduling for electrical repairs.',
  },
];

export const visitRows = [
  {
    date: 'May 28, 2025',
    time: '9:00 - 11:00 AM',
    service: 'HVAC Seasonal Tune-Up',
    home: '123 Maple Ridge Dr',
    vendor: 'Evergreen HVAC',
    tech: 'Alex Ramirez',
    status: 'Scheduled',
  },
  {
    date: 'May 29, 2025',
    time: '1:00 - 3:00 PM',
    service: 'Plumbing Inspection',
    home: '456 Hillcrest Ave',
    vendor: 'Pinnacle Plumbing',
    tech: 'Jordan Lee',
    status: 'Scheduled',
  },
  {
    date: 'May 30, 2025',
    time: '10:00 AM - 12:00 PM',
    service: 'Electrical Safety Check',
    home: '789 Cedar Ln',
    vendor: 'Brightview Electric',
    tech: 'Taylor Morgan',
    status: 'Scheduled',
  },
  {
    date: 'May 31, 2025',
    time: '8:00 - 10:00 AM',
    service: 'Lawn Treatment',
    home: '321 Oakwood Dr',
    vendor: 'GreenScape Lawns',
    tech: 'Casey Patel',
    status: 'Confirmed',
  },
];

export const readinessTasks = [
  ['AC system tune-up', 'Completed May 4', 'done'],
  ['Gutter cleaning', 'Completed May 10', 'done'],
  ['Deck inspection', 'Due Jun 1', 'warning'],
  ['Pool opening', 'Due Jun 7', 'open'],
  ['Irrigation check', 'Due Jun 14', 'open'],
] as const;

export const issueTriage = [
  ['No cool air on 2nd floor', '123 Maple Ridge Dr', 'High', 'Just now'],
  ['Kitchen faucet leak', '456 Hillcrest Ave', 'Medium', '1h ago'],
  ['Outdoor outlet not working', '789 Cedar Ln', 'Low', '3h ago'],
] as const;

export const routeOwners = [
  ['Alex Ramirez', '8 visits', 95],
  ['Jordan Lee', '7 visits', 88],
  ['Taylor Morgan', '6 visits', 81],
  ['Casey Patel', '5 visits', 76],
] as const;

export const vendorSignals = [
  'Background-checked providers with household access notes',
  'Arrival windows synced to the shell work queue',
  'Service detail pages owned by the catalog remote team',
];

export const householdMembers = [
  {
    name: 'Mira Chen',
    role: 'Primary homeowner',
    focus: 'Service approval and budget thresholds',
    note: 'Prefers text confirmations before technicians enter the home office.',
  },
  {
    name: 'Owen Park',
    role: 'Weekend coordinator',
    focus: 'Vendor access and visit handoff',
    note: 'Available for Saturday arrivals and outdoor project sign-off.',
  },
  {
    name: 'Sam Rivera',
    role: 'Care logistics lead',
    focus: 'Component inspection',
    note: 'Keeps inspection notes current for source-context and selector checks.',
  },
];

export const householdPreferences = [
  'Technicians can use the side gate after arrival is confirmed.',
  'Quiet hours are 1:00 PM to 3:00 PM for remote work and childcare.',
  'Use fragrance-free cleaning supplies in bedrooms and nursery.',
  'Pets must remain upstairs during plumbing and electrical visits.',
];
