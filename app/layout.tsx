import './globals.css';
import { PwaRegister } from '@/app/components/PwaRegister';
import { MobileInstallBanner } from '@/app/components/MobileInstallBanner';
import { WhatsAppContact } from '@/app/components/WhatsAppContact';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  icons: {
    icon: [{url:'/keks-brand-navy-icon.webp',type:'image/webp',sizes:'160x160'}],
    shortcut: '/keks-brand-navy-icon.webp',
    apple: '/keks-brand-navy-icon.webp',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body><PwaRegister/><MobileInstallBanner/>{children}<WhatsAppContact/></body></html>;
}
