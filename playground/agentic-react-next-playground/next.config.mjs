import withAgenticReactNext from '@jazelly/agentic-react/next';

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
};

export default withAgenticReactNext(nextConfig);
