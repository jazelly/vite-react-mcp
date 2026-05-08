import { LegacyRuntimeBadge } from '@mfplayground/legacy-react-widget';
import { Link, Route, Routes } from 'react-router-dom';

const products = [
  {
    id: 'mf-compiler',
    name: 'Federated compiler shell',
    owner: 'platform',
    status: 'stable',
  },
  {
    id: 'router-642',
    name: 'React Router 6.4.2 route island',
    owner: 'catalog',
    status: 'adopting',
  },
  {
    id: 'legacy-react',
    name: 'React 17 dependency edge',
    owner: 'migration',
    status: 'tracked',
  },
];

function CatalogIndex() {
  return (
    <section className="remote-panel" id="catalog-remote">
      <div className="remote-header">
        <div>
          <p className="section-label">Catalog remote</p>
          <h2>Federated product routes.</h2>
        </div>
        <LegacyRuntimeBadge />
      </div>

      <table className="product-table">
        <caption>Catalog products</caption>
        <thead>
          <tr className="product-row heading">
            <th scope="col">Package</th>
            <th scope="col">Owner</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr className="product-row" key={product.id}>
              <td>
                <Link to={product.id}>{product.name}</Link>
              </td>
              <td>{product.owner}</td>
              <td>{product.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProductDetail() {
  return (
    <section className="remote-panel">
      <p className="section-label">Remote detail</p>
      <h2>Route rendered from catalog/Routes.</h2>
      <p className="remote-copy">
        This view is intentionally owned by the remote app so MCP runtime tools
        can inspect components across the host boundary.
      </p>
      <Link className="back-link" to="/catalog">
        Back to catalog
      </Link>
    </section>
  );
}

export default function CatalogRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CatalogIndex />} />
      <Route path=":productId" element={<ProductDetail />} />
    </Routes>
  );
}
