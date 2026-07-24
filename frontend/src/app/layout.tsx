import { AuthProvider } from '@/lib/AuthContext';
import './global.css';

export const metadata = {
  title: 'Lab Inventory Management System',
  description: 'Sistem manajemen inventaris laboratorium modern, responsif, dan terpadu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
