import { ChakraProvider, Text } from '@chakra-ui/react';
import { PuzzlePieceIcon, TruckIcon } from '@heroicons/react/24/outline';
import { SectionCard, hearthHubTheme } from '@mfplayground/hearthhub-ui';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppFrame } from './components/AppFrame';
import { Diagnostics } from './pages/Diagnostics';
import { ShellHome } from './pages/ShellHome';

const CatalogRoutes = lazy(() => import('catalog/Routes'));
const ProfileRoutes = lazy(() => import('profile/Routes'));

export function App() {
  return (
    <ChakraProvider theme={hearthHubTheme}>
      <AppFrame>
        <Routes>
          <Route path="/" element={<ShellHome />} />
          <Route
            path="/catalog/*"
            element={
              <Suspense
                fallback={
                  <SectionCard icon={TruckIcon} title="Loading services catalog...">
                    <Text>Loading services catalog...</Text>
                  </SectionCard>
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
                  <SectionCard icon={PuzzlePieceIcon} title="Loading household profile...">
                    <Text>Loading household profile...</Text>
                  </SectionCard>
                }
              >
                <ProfileRoutes />
              </Suspense>
            }
          />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppFrame>
    </ChakraProvider>
  );
}
