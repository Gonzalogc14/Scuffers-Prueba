// Regenera src/lib/queries.generated.ts a partir de ../sql/dashboard/*.sql
// Los .sql son la fuente de verdad: el panel ejecuta exactamente esas consultas.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const dir = join(aqui, '..', '..', 'sql', 'dashboard');
const ficheros = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let out = '// Archivo generado con "npm run sync-queries". No editar a mano.\n// Fuente: sql/dashboard/*.sql\n\nexport const QUERIES = {\n';
for (const f of ficheros) {
  // La API solo acepta consultas que empiecen por select o with, así que se quitan los comentarios
  const sql = readFileSync(join(dir, f), 'utf8').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim().replace(/;$/, '');
  out += `  ${f.replace('.sql', '')}: ${JSON.stringify(sql)},\n`;
}
out += '} as const;\n';
writeFileSync(join(aqui, '..', 'src', 'lib', 'queries.generated.ts'), out);
console.log(`${ficheros.length} consultas sincronizadas`);
