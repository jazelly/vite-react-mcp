import '@mantine/core/styles.css';
import './App.css';

import { useMemo, useState } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import {
  IconArchive,
  IconArrowRight,
  IconBell,
  IconBolt,
  IconBrandReact,
  IconCalendarDue,
  IconChartBar,
  IconCheck,
  IconCircle,
  IconCircleDashed,
  IconCode,
  IconCommand,
  IconDots,
  IconFilter,
  IconFlag,
  IconGitBranch,
  IconLayoutSidebarLeftCollapse,
  IconMessage,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';

const theme = createTheme({
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  primaryColor: 'gray',
});

const navItems = [
  ['Inbox', '12'],
  ['Issues', '84'],
  ['Views', '7'],
  ['Roadmap', '3'],
  ['Archive', ''],
];

const issueRows = [
  {
    id: 'ISS-142',
    title: 'Unify workspace filters across list and board views',
    team: 'Platform',
    status: 'In Progress',
    priority: 'P1',
    assignee: 'Maya',
    due: 'Today',
    tone: 'pink',
  },
  {
    id: 'ISS-139',
    title: 'Move project health rollups into the issue detail rail',
    team: 'Product',
    status: 'Review',
    priority: 'P2',
    assignee: 'Noah',
    due: 'May 30',
    tone: 'violet',
  },
  {
    id: 'ISS-138',
    title: 'Add keyboard shortcuts to cycle through triage queues',
    team: 'Client',
    status: 'Todo',
    priority: 'P3',
    assignee: 'Iris',
    due: 'Jun 2',
    tone: 'amber',
  },
  {
    id: 'ISS-135',
    title: 'Expose source context when a selected row opens the inspector',
    team: 'Runtime',
    status: 'In Progress',
    priority: 'P1',
    assignee: 'Sam',
    due: 'Jun 3',
    tone: 'green',
  },
  {
    id: 'ISS-131',
    title: 'Preserve issue ordering after bulk reassignment',
    team: 'Data',
    status: 'Backlog',
    priority: 'P4',
    assignee: 'June',
    due: 'Jun 6',
    tone: 'slate',
  },
  {
    id: 'ISS-128',
    title: 'Create saved view for launch-blocking project work',
    team: 'Growth',
    status: 'Review',
    priority: 'P2',
    assignee: 'Leo',
    due: 'Jun 9',
    tone: 'amber',
  },
  {
    id: 'ISS-125',
    title: 'Render html fixture metadata in the webpack playground',
    team: 'MCP',
    status: 'Done',
    priority: 'P3',
    assignee: 'Ari',
    due: 'Done',
    tone: 'green',
  },
];

const featureCards = [
  {
    title: 'Issue command center',
    body: 'Plan, assign, comment, resolve, and review work from one dense project surface.',
    icon: IconCommand,
  },
  {
    title: 'Team workflows',
    body: 'Every status change, owner handoff, and milestone shift stays visible in context.',
    icon: IconUsers,
  },
  {
    title: 'Live analytics',
    body: 'Cycle time, priority drift, throughput, and workload stay close to the issue list.',
    icon: IconChartBar,
  },
];

const activity = [
  ['Maya moved ISS-142 to In Progress', '2m'],
  ['Noah linked ISS-139 to the mobile launch milestone', '14m'],
  ['Sam attached source context from webpack App.jsx', '31m'],
  ['Iris added a follow-up comment to ISS-138', '48m'],
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function Dot({ tone = 'slate' }) {
  return <span className={`status-dot status-dot-${tone}`} />;
}

function TopNav() {
  return (
    <header className="top-nav">
      <a className="brand" href="#workspace" aria-label="Go to homepage">
        <BrandMark />
        <span>ISSUEFLOW</span>
      </a>

      <nav className="top-links" aria-label="Primary">
        <a href="#workspace">Workspace</a>
        <a href="#issues">Issues</a>
        <a href="#analytics">Analytics</a>
        <a href="#selection">Source</a>
      </nav>

      <div className="nav-actions">
        <button className="icon-button" type="button" aria-label="Toggle theme">
          <IconMoon size={15} />
        </button>
        <button className="text-button" type="button">
          Log in
        </button>
        <button className="outline-button" type="button">
          Sign up
        </button>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="workspace-sidebar" aria-label="Workspace navigation">
      <div className="sidebar-heading">
        <div className="workspace-avatar">F</div>
        <div>
          <p>Forge</p>
          <span>Issue management</span>
        </div>
      </div>

      <div className="sidebar-search">
        <IconSearch size={14} />
        <span>Search issues</span>
        <kbd>K</kbd>
      </div>

      <div className="sidebar-list">
        {navItems.map(([label, count], index) => (
          <button
            className={`sidebar-item ${index === 1 ? 'is-active' : ''}`}
            key={label}
            type="button"
          >
            <span>{label}</span>
            {count ? <strong>{count}</strong> : null}
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="project-list">
        {['Product OS', 'Agent runtime', 'Mobile polish'].map((project) => (
          <button className="project-item" key={project} type="button">
            <IconCircleDashed size={14} />
            <span>{project}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function IssueList({ selectedIssueId, onSelectIssue }) {
  return (
    <section className="issue-list" id="issues" aria-label="Issue list">
      <div className="list-toolbar">
        <div>
          <p>Issues</p>
          <span>84 open across 6 teams</span>
        </div>
        <div className="toolbar-actions">
          <button type="button">
            <IconFilter size={14} />
            Filter
          </button>
          <button id="webpack-counter" type="button">
            <IconPlus size={14} />
            New issue
          </button>
        </div>
      </div>

      <div className="list-tabs" role="tablist" aria-label="Issue views">
        {['Active', 'Backlog', 'My issues', 'Blocked'].map((label, index) => (
          <button
            aria-selected={index === 0}
            className={index === 0 ? 'is-selected' : ''}
            key={label}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-head">
        <span>Issue</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Owner</span>
        <span>Due</span>
      </div>

      <div className="issue-rows">
        {issueRows.map((issue) => (
          <button
            className={`issue-row ${selectedIssueId === issue.id ? 'is-selected' : ''}`}
            key={issue.id}
            onClick={() => onSelectIssue(issue.id)}
            type="button"
          >
            <span className="issue-title-cell">
              <Dot tone={issue.tone} />
              <span>
                <strong>{issue.id}</strong>
                <em>{issue.title}</em>
              </span>
            </span>
            <span>{issue.status}</span>
            <span>{issue.priority}</span>
            <span>{issue.assignee}</span>
            <span>{issue.due}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Inspector({ issue }) {
  return (
    <aside className="inspector" aria-label="Issue detail">
      <div className="inspector-actions">
        <button type="button" aria-label="Notifications">
          <IconBell size={15} />
        </button>
        <button type="button" aria-label="More options">
          <IconDots size={15} />
        </button>
      </div>

      <div className="inspector-status">
        <Dot tone={issue.tone} />
        <span>{issue.id}</span>
      </div>

      <h2>{issue.title}</h2>
      <p id="webpack-copy-target">
        Selection source test content for Webpack html inspection. This detail
        panel keeps the selected issue, source ownership, selectors, comments,
        and timeline in one React surface for component selection demos.
      </p>

      <div className="detail-grid">
        <span>Status</span>
        <strong>{issue.status}</strong>
        <span>Priority</span>
        <strong>{issue.priority}</strong>
        <span>Assignee</span>
        <strong>{issue.assignee}</strong>
        <span>Due</span>
        <strong>{issue.due}</strong>
      </div>

      <div className="inspector-card">
        <div className="card-title">
          <IconGitBranch size={15} />
          Source context
        </div>
        <code>{'<main data-runtime="webpack" id="html-panel">'}</code>
        <code>{'<button id="webpack-counter">New issue</button>'}</code>
      </div>

      <div className="activity-list">
        <div className="card-title">
          <IconMessage size={15} />
          Activity
        </div>
        {activity.map(([text, time]) => (
          <div className="activity-item" key={text}>
            <IconCircle size={8} />
            <span>{text}</span>
            <em>{time}</em>
          </div>
        ))}
      </div>
    </aside>
  );
}

function WorkspacePreview() {
  const [selectedIssueId, setSelectedIssueId] = useState(issueRows[0].id);
  const selectedIssue = useMemo(
    () => issueRows.find((issue) => issue.id === selectedIssueId) || issueRows[0],
    [selectedIssueId],
  );

  return (
    <section className="workspace-shell" id="workspace">
      <div className="workspace-topbar">
        <button type="button" aria-label="Collapse sidebar">
          <IconLayoutSidebarLeftCollapse size={16} />
        </button>
        <div className="command-bar">
          <IconCommand size={15} />
          <span>Command center</span>
        </div>
        <div className="workspace-actions">
          <button type="button">
            <IconArchive size={14} />
            Archive
          </button>
          <button type="button">
            <IconSettings size={14} />
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <Sidebar />
        <IssueList
          onSelectIssue={setSelectedIssueId}
          selectedIssueId={selectedIssueId}
        />
        <Inspector issue={selectedIssue} />
      </div>
    </section>
  );
}

function AnalyticsPanel() {
  return (
    <section className="analytics-band" id="analytics">
      <div className="section-label">Built for issue velocity</div>
      <div className="analytics-header">
        <h2>Less process. More progress.</h2>
        <p>
          The workspace behaves like a dense production app: list filtering,
          issue selection, ownership metadata, source context, and activity all
          stay visible without leaving the page.
        </p>
      </div>

      <div className="feature-grid">
        {featureCards.map(({ title, body, icon: Icon }) => (
          <article className="feature-card" key={title}>
            <Icon size={18} />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SelectionPanel() {
  return (
    <section className="selection-panel" id="selection">
      <div className="quote-card">
        <p>
          "We replaced scattered planning docs with one issue workspace. The
          team can see the next decision, the owner, and the source context
          without asking where anything lives."
        </p>
        <div>
          <span className="avatar">JK</span>
          <span>
            <strong>Jamie Kim</strong>
            <em>Engineering Lead, Acme Corp</em>
          </span>
        </div>
      </div>

      <div className="runtime-card">
        <div className="card-title">
          <IconBrandReact size={16} />
          React selection demo
        </div>
        <h2>Point the toolkit at any issue row.</h2>
        <p>
          Use the Agentic React floating selector to capture this issue
          management UI. The webpack runtime exposes component state, html
          selectors, and source snippets from the same app surface.
        </p>
        <div className="runtime-actions">
          <button type="button">
            <IconBolt size={14} />
            Enable selection
          </button>
          <button type="button">
            <IconCode size={14} />
            Inspect html panel
          </button>
        </div>
      </div>
    </section>
  );
}

function AppContent() {
  return (
    <main className="app-page">
      <TopNav />

      <section className="hero">
        <div className="wireframe-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-copy">
          <h1 id="webpack-title">Issue tracking for teams that ship fast</h1>
          <p>
            Plan work, manage ownership, and resolve project issues without
            slowing down the team.
          </p>
          <a className="primary-cta" href="#workspace">
            Open workspace
            <IconArrowRight size={16} />
          </a>
        </div>
        <WorkspacePreview />
      </section>

      <AnalyticsPanel />
      <SelectionPanel />

      <footer className="footer">
        <a className="brand" href="#workspace">
          <BrandMark />
          <span>ISSUEFLOW</span>
        </a>
        <span>© 2026</span>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AppContent />
    </MantineProvider>
  );
}
