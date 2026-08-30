import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giang AI Thumbnail',
  description: 'AI Thumbnail Studio cho YouTube & BĐS',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
