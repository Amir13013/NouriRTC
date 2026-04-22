import '../styles/globals.css';
import Image from 'next/image';
import LanguageSelector from '../components/LanguageSelector';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header>
          <div>
            <Image
              src="/logo-icon.png"
              alt="ChatFlow Logo"
              width={60}
              height={40}
              className="object-contain"
            />
            <h1>ChatFlow</h1>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" className="text-white hover:text-gray-300">Accueil</a>
            <a href="/inscription" className="text-white hover:text-gray-300">Inscription</a>
            <a href="/connexion" className="text-white hover:text-gray-300">Connexion</a>
            <LanguageSelector />
          </nav>
        </header>

        <main>{children}</main>

        <footer>
          <p>© 2026 ChatFlow</p>
        </footer>
      </body>
    </html>
  );
}
