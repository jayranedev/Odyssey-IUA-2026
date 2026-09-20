import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { BackendStatusProvider } from '../context/BackendStatusContext';
import BackendOfflineBanner from '../components/BackendOfflineBanner';
import BackendOfflineModal from '../components/BackendOfflineModal';

export const metadata = {
  title: "JugaadGPT Workshop",
  description: "Grassroots engineering platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <BackendStatusProvider>
          <AuthProvider>
            <BackendOfflineBanner />
            {children}
            <BackendOfflineModal />
          </AuthProvider>
        </BackendStatusProvider>
      </body>
    </html>
  );
}
