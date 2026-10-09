import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel comercial H1 2026 · Scuffers',
  description: 'Ventas, canales de adquisición y producto del primer semestre de 2026, con propuesta de inversión para el segundo semestre.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
