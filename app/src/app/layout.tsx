import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scuffers · Resultados del primer semestre 2026',
  description: 'Ventas, canales y producto de enero a junio de 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
