import './globals.css';

export const metadata = {
  title: 'KEKS Akademi',
  description: 'Kazandıran Eğitim ve Koçluk Sistemi',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
