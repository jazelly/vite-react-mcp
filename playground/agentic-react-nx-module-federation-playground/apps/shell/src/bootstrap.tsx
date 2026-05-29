import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
  },
]);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element for Nx module federation shell');
}

createRoot(rootElement).render(<RouterProvider router={router} />);
