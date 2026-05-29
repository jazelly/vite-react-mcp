import 'antd/dist/reset.css';
import './globals.css';

export const metadata = {
  title: 'Next Playground',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
