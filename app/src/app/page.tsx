import { AlertTriangle } from 'lucide-react';
import { QUERIES } from '@/lib/queries.generated';
import { seguro } from '@/lib/supabase';
import { eur, num, pct, mesCorto } from '@/lib/format';
import { VentasChart, IecChart, type MesPunto, type IecPunto } from '@/components/Charts';

export const dynamic = 'force-dynamic';

type Fila = Record<string, any>;

const PAISES: Record<string, string> = { DE: 'Alemania', ES: 'España' };

const TH = 'py-3 px-3 text-[13px] font-medium uppercase tracking-wider';
const TD = 'num px-3 py-3 text-right';

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string; nota: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-2 text-[13px] font-medium uppercase tracking-wider text-slate-400">{titulo}</div>
      <div className="num mb-1 whitespace-nowrap text-2xl font-bold text-white">{valor}</div>
      <p className="text-sm text-slate-400">{nota}</p>
    </div>
  );
}

function Seccion({ id, titulo, sub, children }: { id: string; titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-slate-800 py-10">
      <h2 className="text-xl font-bold text-white">{titulo}</h2>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Fallo({ errores }: { errores: string[] }) {
  if (!errores.length) return null;
  return (
    <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300" role="alert">
      <strong>No se han podido cargar algunos datos.</strong>
      <ul className="mt-1 list-disc pl-5 text-red-300/80">{errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
    </div>
  );
}

export default async function Panel() {
  const [kc, kcl, mensual, pend, canales, h2, cats, prods, cods, paises] = await Promise.all([
    seguro<Fila>(QUERIES.kpis_cabecera),
    seguro<Fila>(QUERIES.kpis_clientes),
    seguro<Fila>(QUERIES.evolucion_mensual),
    seguro<Fila>(QUERIES.pedidos_pendientes),
    seguro<Fila>(QUERIES.canales),
    seguro<Fila>(QUERIES.reparto_h2),
    seguro<Fila>(QUERIES.categorias),
    seguro<Fila>(QUERIES.productos),
    seguro<Fila>(QUERIES.codigos_promocionales),
    seguro<Fila>(QUERIES.paises),
  ]);
  const errores = [kc, kcl, mensual, pend, canales, h2, cats, prods, cods, paises].map((r) => r.error).filter(Boolean) as string[];

  const K = kc.data[0] ?? {};
  const C = kcl.data[0] ?? {};
  const R = h2.data[0] ?? {};

  // Evolución
  const pendPorMes: Record<string, number> = {};
  pend.data.forEach((p) => { pendPorMes[p.mes] = (pendPorMes[p.mes] ?? 0) + Number(p.pedidos); });
  const ultimoMes = mensual.data.length ? mensual.data[mensual.data.length - 1].mes : '';
  const pendUltimo = pendPorMes[ultimoMes] ?? 0;
  const serie: MesPunto[] = mensual.data.map((m) => ({
    mes: mesCorto(m.mes), ventas: Number(m.ventas_eur), pedidos: Number(m.pedidos), ticket: Number(m.ticket_medio_eur),
    incompleto: m.mes === ultimoMes && pendUltimo > 0,
  }));

  // Canales
  const pagados = canales.data.filter((c) => c.gasto_eur !== null);
  const sinGasto = canales.data.filter((c) => c.gasto_eur === null);
  const fiables = pagados.filter((c) => c.canal !== 'TikTok Ads');
  const mejorFiable = fiables.length ? fiables.reduce((a, b) => (Number(b.iec) > Number(a.iec) ? b : a)) : null;
  const masGasto = pagados.length ? pagados.reduce((a, b) => (Number(b.pct_del_gasto) > Number(a.pct_del_gasto) ? b : a)) : null;
  const peorIec = pagados.length ? pagados.reduce((a, b) => (Number(b.iec) < Number(a.iec) ? b : a)) : null;
  const iecPuntos: IecPunto[] = pagados.map((c) => ({ canal: c.canal, iec: Number(c.iec), aviso: c.canal === 'TikTok Ads' }));

  // Productos
  const TOP = 10;
  const prodsTop = prods.data.slice(0, TOP);
  const prodsResto = prods.data.slice(TOP);
  const maxCod = Math.max(1, ...cods.data.map((c) => Number(c.ingreso_eur)));

  const FilaProducto = ({ p }: { p: Fila }) => (
    <tr key={p.product_id} className="hover:bg-slate-800/40">
      <td className="px-3 py-3 font-semibold text-white">{p.name}</td>
      <td className="px-3 py-3 text-slate-400">{p.category}</td>
      <td className={TD}>{num(p.unidades)}</td>
      <td className={TD}>{eur(p.ingreso_lineas_eur)}</td>
      <td className={TD}>{p.valoracion_media === null ? '–' : <>{num(p.valoracion_media, 2)} <span className="text-slate-500">({num(p.resenas)})</span></>}</td>
    </tr>
  );
  const CabeceraProductos = (
    <thead className="border-b border-slate-800 text-slate-400">
      <tr><th className={TH}>Producto</th><th className={TH}>Categoría</th><th className={`${TH} text-right`}>Unidades</th><th className={`${TH} text-right`}>Ingreso</th><th className={`${TH} text-right`}>Valoración</th></tr>
    </thead>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">Prueba Técnica Scuffers</p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Resultados Primer Semestre 2026</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          Pedidos entregados de enero a junio, sin eliminados ni pedidos de menos de 1 €. Ventas con IVA y envío incluidos.
        </p>
      </header>

      <nav className="sticky top-0 z-10 -mx-4 mb-8 flex gap-6 overflow-x-auto border-b border-slate-800 bg-[#0b1220]/90 px-4 py-3 text-sm backdrop-blur sm:-mx-6 sm:px-6" aria-label="Secciones">
        {[['#ventas', 'Ventas'], ['#canales', 'Canales'], ['#producto', 'Producto'], ['#promos', 'Promociones']].map(([h, t]) => (
          <a key={h} href={h} className="whitespace-nowrap text-slate-300 hover:text-accent">{t}</a>
        ))}
      </nav>

      <Fallo errores={errores} />

      <section className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cifras de cabecera">
        <Tarjeta titulo="Ventas" valor={eur(K.ventas_eur)} nota="IVA y envío incluidos" />
        <Tarjeta titulo="Pedidos" valor={num(K.pedidos)} nota="Entregados" />
        <Tarjeta titulo="Ticket medio" valor={eur(K.ticket_medio_eur)} nota="Ventas entre pedidos" />
        <Tarjeta titulo="Clientes activos" valor={num(C.clientes_activos)} nota={`${pct(C.tasa_recompra_pct)} repite`} />
        <Tarjeta titulo="Devoluciones" valor={pct(C.tasa_devolucion_pct, 2)} nota={`${num(C.reembolsados)} de ${num(C.entregados_y_reembolsados)} pedidos`} />
      </section>

      <Seccion id="ventas" titulo="Evolución de las ventas">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <VentasChart data={serie} />
            {pendUltimo > 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                {mesCorto(ultimoMes)} incluye {pendUltimo} pedidos pendientes que aún no cuentan como venta.
              </p>
            )}
          </div>
          <div className="overflow-x-auto lg:col-span-2">
            <table className="w-full text-left text-[15px] text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400"><tr><th className={TH}>Mes</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ventas</th><th className={`${TH} text-right`}>Ticket</th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {mensual.data.map((m) => (
                  <tr key={m.mes}><td className="px-3 py-3">{mesCorto(m.mes)}</td><td className={TD}>{num(m.pedidos)}</td><td className={TD}>{eur(m.ventas_eur)}</td><td className={TD}>{eur(m.ticket_medio_eur)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {paises.data.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-3 text-base font-semibold text-white">Por país del pedido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[15px] text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400"><tr><th className={TH}>País</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ventas</th><th className={`${TH} text-right`}>% ventas</th><th className={`${TH} text-right`}>Ticket medio</th></tr></thead>
                <tbody className="divide-y divide-slate-800/70">
                  {paises.data.map((p) => (
                    <tr key={p.country}><td className="px-3 py-3 font-semibold text-white">{PAISES[p.country] ?? p.country}</td><td className={TD}>{num(p.pedidos)}</td><td className={TD}>{eur(p.ventas_eur)}</td><td className={TD}>{pct(p.pct_ventas)}</td><td className={TD}>{eur(p.ticket_medio_eur)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Seccion>

      <Seccion id="canales" titulo="Recomendación de inversión prioritaria" sub="IEC: ingresos atribuidos al canal entre su inversión, de marzo a junio.">
        {masGasto && peorIec && mejorFiable && (
          <p className="mb-6 max-w-5xl text-base leading-relaxed text-slate-200">
            <strong className="text-white">{masGasto.canal}</strong> concentra el {pct(masGasto.pct_del_gasto)} del gasto con un IEC de {num(masGasto.iec, 1)}
            {masGasto.canal === peorIec.canal ? ', el más bajo' : ''}. <strong className="text-white">{mejorFiable.canal}</strong> devuelve {num(mejorFiable.iec, 1)} con el {pct(mejorFiable.pct_del_gasto)} del gasto.
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3"><IecChart data={iecPuntos} /></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
            <h3 className="mb-3 text-base font-semibold text-white">Propuesta para el segundo semestre</h3>
            <p className="mb-3 text-[15px] leading-relaxed text-slate-300">
              Mover <strong className="text-white">{eur(R.traslado_eur, 0)}</strong> de Meta Ads a Email, en dos fases de {eur(Number(R.traslado_eur) / 2, 0)}.
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-slate-300">
              Si Email mantiene su IEC, atribuiría unos <strong className="text-emerald-400">{eur(R.ingresos_si_email_mantiene_su_iec_eur, 0)}</strong> y Meta dejaría de atribuir {eur(R.ingresos_que_deja_de_atribuir_meta_eur, 0)}.
            </p>
            <p className="text-sm text-slate-400">Es una simulación, no una previsión. Además, se puede probar TikTok con 100 € al mes durante dos meses.</p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-[15px] text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className={TH}>#</th><th className={TH}>Canal</th>
                <th className={`${TH} text-right`}>Gasto</th><th className={`${TH} text-right`}>% gasto</th>
                <th className={`${TH} text-right`}>Ingresos</th><th className={`${TH} text-right`}>IEC</th><th className={`${TH} text-right`}>Ticket medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[...pagados, ...sinGasto].map((c, i) => (
                <tr key={c.canal} className="hover:bg-slate-800/40">
                  <td className="num px-3 py-3 text-slate-500">{c.gasto_eur === null ? '' : i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-white">
                    {c.canal}
                    {c.canal === 'TikTok Ads' && <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-amber-400"><AlertTriangle className="h-4 w-4" />gasto muy bajo</span>}
                  </td>
                  <td className={TD}>{c.gasto_eur === null ? '–' : eur(c.gasto_eur)}</td>
                  <td className={TD}>{c.pct_del_gasto === null ? '–' : pct(c.pct_del_gasto)}</td>
                  <td className={TD}>{eur(c.ingresos_eur)}</td>
                  <td className={`${TD} font-bold text-white`}>{c.iec === null ? '–' : num(c.iec, 1)}</td>
                  <td className={TD}>{eur(c.ticket_medio_eur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">El ranking va por IEC. El ticket medio es solo contexto. Organic y Direct no tienen gasto registrado.</p>
      </Seccion>

      <Seccion id="producto" titulo="Categorías y productos" sub="Productos activos del catálogo. Ingreso de líneas, sin IVA ni envío.">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.data.map((c) => (
            <div key={c.category} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-1 text-[13px] font-medium uppercase tracking-wider text-slate-400">{c.category}</div>
              <div className="num text-2xl font-bold text-white">{eur(c.ingreso_lineas_eur)}</div>
              <div className="mt-1 flex justify-between text-sm text-slate-400">
                <span>{num(c.unidades)} uds.</span>
                <span>{pct(c.pct)} del total</span>
              </div>
              {Number(c.ingreso_retirados_eur) > 0 && <p className="mt-2 text-sm text-amber-400">+{eur(c.ingreso_retirados_eur)} de productos retirados</p>}
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] text-slate-300">
            {CabeceraProductos}
            <tbody className="divide-y divide-slate-800/70">{prodsTop.map((p) => <FilaProducto key={p.product_id} p={p} />)}</tbody>
          </table>
          {prodsResto.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:text-accent">Ver los {prodsResto.length} productos restantes</summary>
              <table className="w-full text-left text-[15px] text-slate-300">
                <tbody className="divide-y divide-slate-800/70">{prodsResto.map((p) => <FilaProducto key={p.product_id} p={p} />)}</tbody>
              </table>
            </details>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500">Valoración: media con una reseña por cliente y producto, y entre paréntesis el número de reseñas.</p>
      </Seccion>

      <Seccion id="promos" titulo="Ingreso por código promocional">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400"><tr><th className={TH}>Código</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ingreso</th><th className={`${TH} text-right`}>% ventas</th><th className={TH} aria-label="Peso relativo"></th></tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {cods.data.map((c) => (
                <tr key={c.codigo} className="hover:bg-slate-800/40">
                  <td className="px-3 py-3 font-semibold text-white">{c.codigo}{c.discount_pct !== null && <span className="ml-2 font-normal text-slate-500">{num(c.discount_pct)} %</span>}</td>
                  <td className={TD}>{num(c.pedidos)}</td>
                  <td className={TD}>{eur(c.ingreso_eur)}</td>
                  <td className={TD}>{pct(c.pct_de_las_ventas)}</td>
                  <td className="w-40 px-3 py-3"><div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-accent" style={{ width: `${(Number(c.ingreso_eur) / maxCod) * 100}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">Ingreso del pedido completo, sin descontar el código. Un pedido con dos códigos aparece en ambos.</p>
      </Seccion>
    </div>
  );
}
