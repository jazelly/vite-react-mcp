import '@mantine/core/styles.css';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Badge,
  Button,
  Card,
  Code,
  Container,
  Divider,
  Group,
  MantineProvider,
  NavLink,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  Title,
  createTheme,
} from '@mantine/core';
import {
  IconActivity,
  IconApi,
  IconBolt,
  IconBrandReact,
  IconBraces,
  IconChevronRight,
  IconClick,
  IconCode,
  IconHierarchy,
  IconLayoutDashboard,
  IconPlayerPlay,
  IconRefresh,
  IconRoute,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconTerminal2,
} from '@tabler/icons-react';

const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 8,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '800',
  },
});

const promptPresets = [
  {
    id: 'tree',
    label: 'Tree',
    tool: 'get-component-tree',
    prompt: 'Map the rendered React component tree for the live revenue-operations console and return source-aware nodes.',
  },
  {
    id: 'state',
    label: 'State',
    tool: 'get-component-states',
    prompt: 'Inspect prompt replay state, selected release checkpoint, and the generated MCP output preview.',
  },
  {
    id: 'source',
    label: 'Source',
    tool: 'get-react-source-code',
    prompt: 'Find the html setup panel that documents the customer-impact workflow and summarize the owning component.',
  },
];

const toolRows = [
  ['get-html-elements', 'Find incident, account, and selector elements in rendered HTML before an agent touches source files.', 'ready'],
  ['get-react-source-code', 'Resolve visible production copy to owning React components and source snippets.', 'ready'],
  ['highlight-component', 'Outline the component responsible for a live workflow region during browser QA.', 'live'],
  ['get-unnecessary-rerenders', 'Track wasted renders while filters, prompt presets, and output previews update.', 'beta'],
];

const timeline = [
  ['Webpack plugin', 'Inject runtime and overlay into a production-like engineering console.'],
  ['MCP bridge', 'Expose SSE tools on the same dev server port as the app under inspection.'],
  ['Browser page', 'Read fibers, DOM, state, selectors, copy, and source paths from the rendered workflow.'],
  ['Agent result', 'Return actionable context that can guide code edits without guessing from screenshots.'],
];

function IconFrame({ children, color = 'teal' }) {
  return (
    <ThemeIcon color={color} radius={8} size={42} variant="light">
      {children}
    </ThemeIcon>
  );
}

function MetricPanel({ icon, label, value, color = 'teal' }) {
  return (
    <Card withBorder padding="lg" radius={8}>
      <Group gap="md" wrap="nowrap">
        <IconFrame color={color}>{icon}</IconFrame>
        <div>
          <Text c="dimmed" fw={800} size="xs" tt="uppercase">
            {label}
          </Text>
          <Title order={3}>{value}</Title>
        </div>
      </Group>
    </Card>
  );
}

function SurfaceCard({ title, icon, badge, children }) {
  return (
    <Card withBorder radius={8} padding="lg">
      <Group justify="space-between" mb="md" align="flex-start">
        <Group gap="sm">
          <IconFrame>{icon}</IconFrame>
          <Title order={3}>{title}</Title>
        </Group>
        {badge ? <Badge variant="light">{badge}</Badge> : null}
      </Group>
      {children}
    </Card>
  );
}

function PromptConsole() {
  const [activePrompt, setActivePrompt] = useState(promptPresets[0]);
  const [prompt, setPrompt] = useState(promptPresets[0].prompt);
  const [runCount, setRunCount] = useState(0);

  const output = useMemo(
    () => [
      `$ ${activePrompt.tool} --runtime webpack`,
      `status: ${runCount === 0 ? 'ready' : `completed run ${runCount}`}`,
      `prompt: ${prompt}`,
      'component: MantinePromptConsole',
      'source: src/App.jsx',
    ],
    [activePrompt, prompt, runCount],
  );

  const choosePreset = (preset) => {
    setActivePrompt(preset);
    setPrompt(preset.prompt);
  };

  return (
    <SurfaceCard
      badge="interactive"
      icon={<IconTerminal2 size={22} />}
      title="Prompt console"
    >
      <Tabs value={activePrompt.id} onChange={(id) => choosePreset(promptPresets.find((item) => item.id === id) || promptPresets[0])}>
        <Tabs.List grow>
          {promptPresets.map((preset) => (
            <Tabs.Tab key={preset.id} value={preset.id} leftSection={<IconSparkles size={16} />}>
              {preset.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Textarea
        label="Agent instruction"
        mt="md"
        minRows={4}
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
      />

      <Group justify="space-between" mt="md">
        <Group gap="xs">
          <Badge color="green" leftSection={<IconActivity size={12} />}>
            bridge ready
          </Badge>
          <Badge color="grape">Mantine wrapped</Badge>
        </Group>
        <Button
          id="webpack-counter"
          leftSection={<IconPlayerPlay size={18} />}
          onClick={() => setRunCount((value) => value + 1)}
        >
          Run prompt ({runCount})
        </Button>
      </Group>

      <Paper bg="dark.8" c="green.2" mt="md" p="md" radius={8}>
        <Code block c="green.2" bg="transparent">
          {output.join('\n')}
        </Code>
      </Paper>
    </SurfaceCard>
  );
}

function ToolTable() {
  return (
    <Table.ScrollContainer minWidth={620}>
      <Table verticalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tool</Table.Th>
            <Table.Th>Production behavior</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {toolRows.map(([name, description, status]) => (
            <Table.Tr key={name}>
              <Table.Td>
                <Code>{name}</Code>
              </Table.Td>
              <Table.Td>{description}</Table.Td>
              <Table.Td>
                <Badge color={status === 'ready' ? 'green' : 'blue'}>{status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function AppContent() {
  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: 260, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            <IconFrame color="cyan">
              <IconBrandReact size={22} />
            </IconFrame>
            <Text fw={900}>vite-react-mcp</Text>
          </Group>
          <Group gap="xs">
            <ActionIcon variant="subtle" aria-label="Refresh runtime">
              <IconRefresh size={20} />
            </ActionIcon>
            <Badge color="green">webpack live</Badge>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          <NavLink active label="Overview" leftSection={<IconLayoutDashboard size={18} />} />
          <NavLink label="Selectors" leftSection={<IconClick size={18} />} />
          <NavLink label="Source" leftSection={<IconCode size={18} />} />
          <NavLink label="Bridge" leftSection={<IconApi size={18} />} />
        </Stack>
        <Divider my="md" />
        <Card withBorder radius={8} padding="md">
          <RingProgress
            size={120}
            thickness={10}
            sections={[
              { value: 68, color: 'teal' },
              { value: 18, color: 'violet' },
              { value: 10, color: 'orange' },
            ]}
            label={<Text ta="center" fw={900}>96%</Text>}
          />
          <Text c="dimmed" mt="xs" size="sm">
            Runtime coverage across html, component tree, and source lookup flows.
          </Text>
        </Card>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="md">
            <MetricPanel icon={<IconHierarchy size={22} />} label="Component branches" value="42" />
            <MetricPanel icon={<IconBraces size={22} />} label="Source matches" value="18" color="violet" />
            <MetricPanel icon={<IconShieldCheck size={22} />} label="Selector stability" value="99%" color="green" />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            <Stack gap="md">
              <Paper withBorder radius={8} p={{ base: 'lg', md: 34 }}>
                <Badge color="cyan" variant="light" mb="md">
                  Webpack + Mantine + Tabler
                </Badge>
                <Title id="webpack-title" order={1} lh={0.95}>
                  Let agents inspect your live React app.
                </Title>
                <Text c="dimmed" mt="md" size="lg">
                  This playground is seeded as a release operations console for a
                  regulated marketplace: customer-impact notes, selector provenance,
                  runtime bridge health, source lookup, and HTML inspection all live in
                  nested Mantine components with Tabler icon actions.
                </Text>
                <Group mt="xl">
                  <Button leftSection={<IconBolt size={18} />} component="a" href="#tools">
                    Review tools
                  </Button>
                  <Button variant="default" leftSection={<IconSearch size={18} />} component="a" href="#html-panel">
                    Inspect html panel
                  </Button>
                </Group>
              </Paper>

              <Card withBorder radius={8} p={0} style={{ overflow: 'hidden' }}>
                <Card.Section>
                  <img
                    alt=""
                    src="/generated/webpack-runtime-console.png"
                    style={{ aspectRatio: '16 / 9', display: 'block', objectFit: 'cover', width: '100%' }}
                  />
                </Card.Section>
                <Stack p="lg" gap="xs">
                  <Title order={3}>Runtime inspection scenario</Title>
                  <Text c="dimmed">
                    The generated visual anchors a concrete workflow: component
                    hierarchy, DOM heatmap, terminal output, runtime bridge events,
                    and source snippets are all represented as real UI concepts.
                  </Text>
                </Stack>
              </Card>

              <SurfaceCard title="Bridge timeline" icon={<IconRoute size={22} />} badge="runtime">
                <Timeline active={3} bulletSize={28} lineWidth={2}>
                  {timeline.map(([title, body]) => (
                    <Timeline.Item key={title} title={title} bullet={<IconChevronRight size={14} />}>
                      <Text c="dimmed" size="sm">
                        {body}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </SurfaceCard>
            </Stack>

            <PromptConsole />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="md">
            <SurfaceCard title="Tool registry" icon={<IconApi size={22} />} badge="MCP">
              <div id="tools">
                <ToolTable />
              </div>
            </SurfaceCard>

            <SurfaceCard title="Install surface" icon={<IconCode size={22} />} badge="html fixture">
              <Stack id="html-panel" gap="md">
                <Text id="webpack-copy-target" c="dimmed">
                  Selection source test content for Webpack. This html-heavy panel
                  represents a real release review handoff: support-impact copy,
                  selector anchors, runtime state, source ownership, and MCP output
                  are kept together for agent-driven investigation.
                </Text>
                <Code block>{`<main data-runtime="webpack">
  <section id="html-panel">
    <button id="webpack-counter">Run prompt</button>
  </section>
</main>`}</Code>
                <Progress.Root size="xl">
                  <Progress.Section value={52} color="teal">
                    <Progress.Label>runtime</Progress.Label>
                  </Progress.Section>
                  <Progress.Section value={28} color="violet">
                    <Progress.Label>selectors</Progress.Label>
                  </Progress.Section>
                  <Progress.Section value={20} color="orange">
                    <Progress.Label>html</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Stack>
            </SurfaceCard>
          </SimpleGrid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AppContent />
    </MantineProvider>
  );
}
