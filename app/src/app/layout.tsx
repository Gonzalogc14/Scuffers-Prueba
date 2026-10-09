import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resultados Primer Semestre 2026',
  description: 'Ventas, Canales y Productos (enero - junio).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
