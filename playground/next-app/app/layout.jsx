export const metadata = {
  title: 'Next Playground',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__VITE_REACT_MCP_BRIDGE_URL__ = window.__VITE_REACT_MCP_BRIDGE_URL__ || 'ws://127.0.0.1:51426/__vite_react_mcp_bridge';",
          }}
        />
        {children}
      </body>
    </html>
  );
}
