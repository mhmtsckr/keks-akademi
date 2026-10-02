import './globals.css';
import { PwaRegister } from '@/app/components/PwaRegister';
import { MobileInstallBanner } from '@/app/components/MobileInstallBanner';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  icons: { icon: '/keks-logo.svg', apple: '/keks-logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body><PwaRegister/><MobileInstallBanner/>{children}</body></html>;
}
