import './globals.css';
import { PwaRegister } from '@/app/components/PwaRegister';
import { MobileInstallBanner } from '@/app/components/MobileInstallBanner';
import { MobileAppShell } from '@/app/components/MobileAppShell';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  applicationName: 'KEKS Akademi',
  appleWebApp: { capable: true, title: 'KEKS Akademi', statusBarStyle: 'black-translucent' as const },
  formatDetection: { telephone: false },
  icons: { icon: '/keks-robot-logo.svg', apple: '/keks-robot-logo.svg' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#071d37',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body><PwaRegister/><MobileInstallBanner/><MobileAppShell/>{children}</body></html>;
}
