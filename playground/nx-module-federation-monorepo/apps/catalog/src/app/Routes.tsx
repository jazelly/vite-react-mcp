import { ChakraProvider } from '@chakra-ui/react';
import { hearthHubTheme } from '@mfplayground/hearthhub-ui';
import { Route, Routes } from 'react-router-dom';
import { CatalogIndex } from './pages/CatalogIndex';
import { ProductDetail } from './pages/ProductDetail';

export default function CatalogRoutes() {
  return (
    <ChakraProvider theme={hearthHubTheme}>
      <Routes>
        <Route path="/" element={<CatalogIndex />} />
        <Route path=":productId" element={<ProductDetail />} />
      </Routes>
    </ChakraProvider>
  );
}
