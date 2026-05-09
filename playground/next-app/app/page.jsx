'use client';

import { useMemo, useState } from 'react';
import {
  ArrowsClockwise,
  BellRinging,
  BracketsCurly,
  ChartLineUp,
  CheckCircle,
  Code,
  Database,
  GitBranch,
  MagnifyingGlass,
  RocketLaunch,
  ShieldCheck,
} from '@phosphor-icons/react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  Layout,
  List,
  Menu,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';

const { Content, Header, Sider } = Layout;
const { Text, Title } = Typography;

const navigation = [
  { key: 'overview', icon: <ChartLineUp size={18} />, label: 'Overview' },
  { key: 'selectors', icon: <MagnifyingGlass size={18} />, label: 'Selectors' },
  { key: 'pipelines', icon: <GitBranch size={18} />, label: 'Pipelines' },
  { key: 'security', icon: <ShieldCheck size={18} />, label: 'Security' },
];

const selectorRows = [
  {
    key: 'copy-target',
    selector: '#next-copy-target',
    owner: 'OperationsNarrative',
    confidence: 98,
    status: 'release gate',
  },
  {
    key: 'counter',
    selector: '#next-counter',
    owner: 'RunbookReplayAction',
    confidence: 94,
    status: 'stateful',
  },
  {
    key: 'title',
    selector: '#next-title',
    owner: 'IncidentCommandHeader',
    confidence: 91,
    status: 'narrative anchor',
  },
];

const incidents = [
  'Checkout conversion route promoted after hydration variance dropped below the release threshold',
  'Customer-risk panel retained stable selectors after Ant Design token overrides were applied',
  'Runbook replay captured source context from the incident narrative and primary action',
  'Selection source test content for Next.',
];

function AntShell({ children }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 8,
          colorPrimary: '#2557d6',
          colorSuccess: '#16803c',
          colorWarning: '#b76e00',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Button: { fontWeight: 700 },
          Card: { headerFontSize: 16 },
          Layout: {
            bodyBg: '#f5f7fb',
            headerBg: '#101828',
            siderBg: '#101828',
          },
          Menu: {
            darkItemBg: '#101828',
            darkItemSelectedBg: '#2557d6',
          },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>{children}</Layout>
    </ConfigProvider>
  );
}

function IconBadge({ icon, tone = '#2557d6' }) {
  return (
    <span
      style={{
        alignItems: 'center',
        background: `${tone}14`,
        border: `1px solid ${tone}28`,
        borderRadius: 8,
        color: tone,
        display: 'inline-flex',
        height: 38,
        justifyContent: 'center',
        width: 38,
      }}
    >
      {icon}
    </span>
  );
}

function MetricTile({ icon, label, value, suffix, tone }) {
  return (
    <Card>
      <Flex align="center" gap={14}>
        <IconBadge icon={icon} tone={tone} />
        <Statistic title={label} value={value} suffix={suffix} />
      </Flex>
    </Card>
  );
}

function SectionCard({ title, icon, extra, children }) {
  return (
    <Card
      title={
        <Space>
          <IconBadge icon={icon} />
          <span>{title}</span>
        </Space>
      }
      extra={extra}
    >
      {children}
    </Card>
  );
}

function SelectorTable({ rows }) {
  const columns = [
    {
      title: 'Selector',
      dataIndex: 'selector',
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      render: (value) => <Progress percent={value} size="small" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value) => <Tag color={value === 'stable' ? 'green' : 'blue'}>{value}</Tag>,
    },
  ];

  return <Table columns={columns} dataSource={rows} pagination={false} size="middle" />;
}

export default function HomePage() {
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState('Live');
  const [activeNav, setActiveNav] = useState('overview');

  const health = useMemo(() => Math.min(99, 87 + count), [count]);

  return (
    <AntShell>
      <Sider breakpoint="lg" collapsedWidth="0" width={244}>
        <Flex vertical style={{ minHeight: '100%', padding: 18 }}>
          <Space align="center" size={12} style={{ color: '#fff', marginBottom: 22 }}>
            <IconBadge icon={<RocketLaunch size={20} weight="duotone" />} tone="#7dd3fc" />
            <strong>Next Ops</strong>
          </Space>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activeNav]}
            items={navigation}
            onClick={({ key }) => setActiveNav(key)}
          />
            <Card size="small" style={{ marginTop: 'auto' }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Runtime bridge</Text>
              <Badge status="processing" text="MCP connected" />
              <Text type="secondary" style={{ display: 'block' }}>
                Inspecting command-center routes, release gates, and selector provenance.
              </Text>
            </Space>
          </Card>
        </Flex>
      </Sider>

      <Layout>
        <Header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', paddingInline: 24 }}>
          <Space size={12}>
            <Badge color="#22c55e" />
            <Text style={{ color: '#fff', fontWeight: 700 }}>Production selector lab</Text>
          </Space>
          <Segmented value={mode} onChange={setMode} options={['Live', 'Replay', 'Audit']} />
        </Header>

        <Content style={{ padding: 24 }}>
          <Card
            styles={{ body: { padding: 0 } }}
            style={{ marginBottom: 24, overflow: 'hidden' }}
          >
            <div
              style={{
                background:
                  'linear-gradient(90deg, rgba(8, 18, 38, 0.92), rgba(8, 18, 38, 0.64), rgba(8, 18, 38, 0.08)), url(/generated/runtime-command-center.png)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                minHeight: 360,
                padding: 32,
              }}
            >
              <Flex align="flex-start" justify="space-between" gap={24} wrap>
                <div>
                  <Tag color="blue">Next.js + Ant Design + Phosphor</Tag>
                  <Title
                    id="next-title"
                    level={1}
                    style={{ color: '#fff', letterSpacing: 0, margin: '18px 0 0', maxWidth: 720 }}
                  >
                    Next Playground
                  </Title>
                  <Text
                    id="next-copy-target"
                    style={{ color: 'rgba(255,255,255,0.84)', display: 'block', fontSize: 17, lineHeight: 1.7, marginTop: 14, maxWidth: 740 }}
                  >
                    Selection source test content for Next.
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.76)', display: 'block', fontSize: 15, lineHeight: 1.7, marginTop: 14, maxWidth: 740 }}>
                    This command center models a real release-readiness workflow:
                    selector confidence, hydration safety, customer-risk telemetry,
                    runbook replay, and incident audit trails are all rendered through
                    nested Ant Design components.
                  </Text>
                </div>
                <Button
                  id="next-counter"
                  icon={<ArrowsClockwise size={18} weight="bold" />}
                  onClick={() => setCount((value) => value + 1)}
                  size="large"
                  type="primary"
                >
                  Count: {count}
                </Button>
              </Flex>
            </div>
          </Card>

          <Flex align="flex-start" justify="space-between" gap={24} wrap>
            <div>
              <Title level={2} style={{ letterSpacing: 0, margin: 0 }}>
                Release intelligence workspace
              </Title>
              <Text style={{ display: 'block', fontSize: 16, lineHeight: 1.7, marginTop: 10, maxWidth: 820 }}>
                The seeded data represents a mature product engineering scenario:
                a customer-facing deployment is moving through verification while
                selectors, source context, alerts, and ownership are reviewed in one
                operational surface.
              </Text>
            </div>
          </Flex>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <MetricTile icon={<ChartLineUp size={22} />} label="Selector health" value={health} suffix="%" tone="#2557d6" />
            </Col>
            <Col xs={24} md={8}>
              <MetricTile icon={<Database size={22} />} label="Hydrated islands" value={12 + count} tone="#7c3aed" />
            </Col>
            <Col xs={24} md={8}>
              <MetricTile icon={<BellRinging size={22} />} label="Open notices" value={3} tone="#b76e00" />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} xl={15}>
              <SectionCard
                title="Selector registry"
                icon={<BracketsCurly size={20} weight="duotone" />}
                extra={<Tag color="blue">{mode}</Tag>}
              >
                <SelectorTable rows={selectorRows} />
              </SectionCard>
            </Col>
            <Col xs={24} xl={9}>
              <SectionCard title="Inspection workflow" icon={<Code size={20} weight="duotone" />}>
                <Tabs
                  items={[
                    {
                      key: 'timeline',
                      label: 'Timeline',
                      children: (
                        <Timeline
                          items={incidents.map((item, index) => ({
                            color: index === incidents.length - 1 ? 'green' : 'blue',
                            children: item,
                          }))}
                        />
                      ),
                    },
                    {
                      key: 'form',
                      label: 'Runbook',
                      children: (
                        <Form layout="vertical">
                          <Form.Item label="Query">
                            <Input prefix={<MagnifyingGlass size={16} />} defaultValue="#next-copy-target" />
                          </Form.Item>
                          <Form.Item label="Expected component">
                            <Input prefix={<CheckCircle size={16} />} defaultValue="HomePage" />
                          </Form.Item>
                        </Form>
                      ),
                    },
                  ]}
                />
              </SectionCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={10}>
              <SectionCard title="Release checklist" icon={<ShieldCheck size={20} weight="duotone" />}>
                <List
                  dataSource={[
                    'Hydration stable on account overview, billing, and entitlement routes',
                    'Runtime globals injected before runbook replay begins',
                    'Copy context available for selectors used in release gates',
                    'Selection mode verified against source-owned narrative and action components',
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <CheckCircle color="#16803c" size={18} weight="fill" />
                        {item}
                      </Space>
                    </List.Item>
                  )}
                />
              </SectionCard>
            </Col>
            <Col xs={24} lg={14}>
              <Alert
                showIcon
                type="info"
                message="Ant Design and Phosphor wrappers are intentionally nested."
                description="This playground now resembles a production operations app, giving component selection and MCP source lookups a deeper library-heavy tree to inspect."
              />
              <Descriptions
                bordered
                column={{ xs: 1, md: 3 }}
                items={[
                  { key: 'ui', label: 'UI library', children: 'Ant Design' },
                  { key: 'icons', label: 'Icon set', children: 'Phosphor Icons' },
                  { key: 'state', label: 'Local state', children: `counter ${count}` },
                ]}
                size="small"
                style={{ marginTop: 16 }}
              />
            </Col>
          </Row>
        </Content>
      </Layout>
    </AntShell>
  );
}
