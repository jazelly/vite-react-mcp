import { ChakraProvider } from '@chakra-ui/react';
import { hearthHubTheme } from '@mfplayground/hearthhub-ui';
import { Route, Routes } from 'react-router-dom';
import { ProfileIndex } from './pages/ProfileIndex';

export default function ProfileRoutes() {
  return (
    <ChakraProvider theme={hearthHubTheme}>
      <Routes>
        <Route path="/" element={<ProfileIndex />} />
      </Routes>
    </ChakraProvider>
  );
}
