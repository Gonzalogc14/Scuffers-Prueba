// Formato español con separador de miles también en números de 4 cifras (9.780 y no 9780)
export function num(v: unknown, dec = 0): string {
  const n = Number(v);
  if (v === null || v === undefined || Number.isNaN(n)) return '–';
  const [ent, frac] = Math.abs(n).toFixed(dec).split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '−' : '') + miles + (frac ? ',' + frac : '');
}
export const eur = (v: unknown, dec = 2) => (v === null || v === undefined ? '–' : `${num(v, dec)} €`);
export const pct = (v: unknown, dec = 1) => (v === null || v === undefined ? '–' : `${num(v, dec)} %`);

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const mesCorto = (ym: string) => MESES[Number(ym.slice(5, 7)) - 1] ?? ym;
