import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Routes from './app/Routes';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element for profile remote');
}

createRoot(rootElement).render(
  <MemoryRouter>
    <Routes />
  </MemoryRouter>,
);
