import './globals.css';
import { PwaRegister } from '@/app/components/PwaRegister';
import { MobileInstallBanner } from '@/app/components/MobileInstallBanner';
import { WhatsAppContact } from '@/app/components/WhatsAppContact';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  icons: {
    icon: [{url:'/keks-official-2026-square.webp',type:'image/webp',sizes:'192x192'}],
    shortcut: '/keks-official-2026-square.webp',
    apple: '/keks-official-2026-square.webp',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body><PwaRegister/><MobileInstallBanner/>{children}<WhatsAppContact/></body></html>;
}
