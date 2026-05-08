import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import { Suspense, lazy, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const CatalogRoutes = lazy(() => import('catalog/Routes'));
const ProfileRoutes = lazy(() => import('profile/Routes'));

const navigation = [
  { to: '/', label: 'Workspace' },
  { to: '/catalog', label: 'Catalog remote' },
  { to: '/profile', label: 'Profile remote' },
  { to: '/diagnostics', label: 'Runtime diagnostics' },
];

function ShellHome() {
  const [activeTeam, setActiveTeam] = useState('checkout');
  const teams = ['checkout', 'catalog', 'platform'];

  const activeSummary = useMemo(
    () => ({
      checkout: 'Host-owned checkout routes and user workflow state.',
      catalog: 'Remote-owned product routes loaded through Module Federation.',
      platform: 'Shared build layer using @nrwl/webpack and React MCP.',
    }),
    [],
  );

  return (
    <section className="workspace-panel" id="shell-workspace">
      <div>
        <p className="section-label">Nx React Module Federation</p>
        <h1>Shell host with multiple federated remotes.</h1>
        <p className="hero-copy">
          This fixture mirrors an older Nx monorepo that still uses pnpm,
          TypeScript 4.8.4, React 18.2.0, React Router DOM 6.4.2, and
          per-application project.json files with root-managed webpack module
          federation.
        </p>
      </div>

      <div className="team-switcher" aria-label="Team runtime switcher">
        {teams.map((team) => (
          <button
            className={team === activeTeam ? 'selected' : ''}
            key={team}
            type="button"
            onClick={() => setActiveTeam(team)}
          >
            {team}
          </button>
        ))}
      </div>

      <div className="summary-grid">
        <article>
          <span>Active slice</span>
          <strong>{activeTeam}</strong>
          <p>{activeSummary[activeTeam as keyof typeof activeSummary]}</p>
        </article>
        <article>
          <span>Build executor</span>
          <strong>@nrwl/webpack:webpack</strong>
          <p>
            Each app owns project.json and a webpack hook, not package.json.
          </p>
        </article>
        <article>
          <span>Shared versions</span>
          <strong>React 18.2.0</strong>
          <p>
            React DOM and Router are strict singletons in federation config.
          </p>
        </article>
      </div>
    </section>
  );
}

function Diagnostics() {
  return (
    <section className="workspace-panel" id="runtime-diagnostics">
      <p className="section-label">Runtime diagnostics</p>
      <h2>MCP should see the host and remote trees.</h2>
      <div className="diagnostic-list">
        <LegacyRuntimeBadge />
        <div>
          <span>window.__VITE_REACT_MCP__</span>
          <strong>injected by webpack-react-mcp</strong>
        </div>
        <div>
          <span>Remote route</span>
          <strong>catalog/Routes + profile/Routes</strong>
        </div>
        <div>
          <span>Federation hook</span>
          <strong>root module-federation.js</strong>
        </div>
      </div>
    </section>
  );
}

export function App() {
  const location = useLocation();

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          MF Workspace
        </Link>
        <nav aria-label="Primary">
          {navigation.map((item) => (
            <Link
              className={location.pathname === item.to ? 'active' : ''}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ShellHome />} />
        <Route
          path="/catalog/*"
          element={
            <Suspense
              fallback={
                <section className="workspace-panel">
                  Loading catalog...
                </section>
              }
            >
              <CatalogRoutes />
            </Suspense>
          }
        />
        <Route
          path="/profile/*"
          element={
            <Suspense
              fallback={
                <section className="workspace-panel">
                  Loading profile...
                </section>
              }
            >
              <ProfileRoutes />
            </Suspense>
          }
        />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
