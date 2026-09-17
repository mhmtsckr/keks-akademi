export const metadata = { title: 'KEKS Akademi', description: 'Kazandıran Eğitim ve Koçluk Sistemi' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body style={{fontFamily:'Arial, sans-serif',margin:0,background:'#f7f8fa',color:'#17202a'}}>{children}</body></html>;
}
