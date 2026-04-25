import "./globals.css";

export const metadata = {
  title: "JugaadGPT Workshop",
  description: "Grassroots engineering platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
