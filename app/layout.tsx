import './globals.css';
import { PwaRegister } from '@/app/components/PwaRegister';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body><PwaRegister/>{children}</body></html>;
}
