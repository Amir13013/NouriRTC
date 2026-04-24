import '../styles/globals.css';

export const metadata = {
  title: 'BOKA',
  description: 'Messagerie temps réel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
