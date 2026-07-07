import "./globals.css";
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: "JugaadGPT Workshop",
  description: "Grassroots engineering platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
