import withReactMcpNext from 'vite-react-mcp/next';

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
};

export default withReactMcpNext(nextConfig);
