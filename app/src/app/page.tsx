import {
  TrendingUp, ShoppingBag, Euro, Users, Undo2, AlertTriangle, Mail, ArrowRightLeft, Layers, Tag, Globe2, CheckCircle2,
} from 'lucide-react';
import { QUERIES } from '@/lib/queries.generated';
import { seguro } from '@/lib/supabase';
import { eur, num, pct, mesCorto } from '@/lib/format';
import { VentasChart, IecChart, type MesPunto, type IecPunto } from '@/components/Charts';

export const dynamic = 'force-dynamic';

type Fila = Record<string, any>;

function Tarjeta({ titulo, valor, nota, icono }: { titulo: string; valor: string; nota: string; icono: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-2 flex items-center justify-between text-slate-400">
        <span className="text-xs font-medium uppercase tracking-wider">{titulo}</span>
        {icono}
      </div>
      <div className="num mb-1 text-2xl font-bold text-white md:text-3xl">{valor}</div>
      <p className="text-xs text-slate-400">{nota}</p>
    </div>
  );
}

function Seccion({ id, titulo, sub, icono, children }: { id: string; titulo: string; sub: string; icono?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-16 rounded-xl border border-slate-800 bg-slate-900 p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
        </div>
        {icono}
      </div>
      {children}
    </section>
  );
}

function Fallo({ errores }: { errores: string[] }) {
  if (!errores.length) return null;
  return (
    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300" role="alert">
      <strong>No se han podido cargar algunos datos.</strong> Las cifras que faltan se muestran como «–».
      <ul className="mt-1 list-disc pl-5 text-xs text-red-300/80">
        {errores.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

const TH = 'py-3 px-3 text-xs font-medium uppercase tracking-wider';

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
  const maxPendAntes = Math.max(0, ...Object.entries(pendPorMes).filter(([m]) => m !== ultimoMes).map(([, v]) => v));
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
  const tiktok = pagados.find((c) => c.canal === 'TikTok Ads');
  const iecPuntos: IecPunto[] = pagados.map((c) => ({ canal: c.canal, iec: Number(c.iec), aviso: c.canal === 'TikTok Ads' }));
  const diag = (c: Fila) => {
    if (c.gasto_eur === null) return 'Sin gasto asignado, no tiene IEC';
    if (c.canal === 'TikTok Ads') return `Gasto de solo ${eur(c.gasto_eur)}: el ratio no es fiable`;
    if (mejorFiable && c.canal === mejorFiable.canal) return 'Mayor retorno con gasto relevante';
    if (peorIec && masGasto && c.canal === peorIec.canal && c.canal === masGasto.canal) return 'Más gasto y menor retorno';
    return 'Retorno intermedio';
  };

  // Categorías y productos
  const retiradosDeporte = cats.data.find((c) => c.category === 'Deporte');
  const maxCod = Math.max(1, ...cods.data.map((c) => Number(c.ingreso_eur)));

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Scuffers</span>
            <span className="text-xs text-slate-400">Primer semestre de 2026 · enero a junio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Panel comercial y presupuesto del segundo semestre</h1>
        </div>
        <div className="max-w-md rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-300">
          <span className="mb-0.5 block font-semibold text-accent">Criterio de cálculo</span>
          Pedidos <code className="rounded bg-slate-800 px-1 py-0.5 text-white">delivered</code> creados del 01/01/2026 al 30/06/2026 (hora de Madrid), sin eliminados
          y sin {num(K.pedidos_menores_1_eur)} pedidos con subtotal inferior a 1 €. Venta = <code className="rounded bg-slate-800 px-1 py-0.5 text-white">total_amount_cents</code> (IVA y envío incluidos).
        </div>
      </header>

      <nav className="sticky top-0 z-10 -mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/90 px-4 py-2 text-xs backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:px-10" aria-label="Secciones">
        {[['#ventas', 'Ventas · Dirección'], ['#canales', 'Canales · Marketing'], ['#producto', 'Producto'], ['#promos', 'Promociones · Ecommerce']].map(([h, t]) => (
          <a key={h} href={h} className="whitespace-nowrap rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-accent hover:text-white">{t}</a>
        ))}
      </nav>

      <Fallo errores={errores} />

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cifras de cabecera">
        <Tarjeta titulo="Ventas" valor={eur(K.ventas_eur)} nota="Importe facturado, IVA y envío incluidos" icono={<Euro className="h-5 w-5 text-emerald-400" />} />
        <Tarjeta titulo="Pedidos" valor={num(K.pedidos)} nota="Pedidos entregados" icono={<ShoppingBag className="h-5 w-5 text-blue-400" />} />
        <Tarjeta titulo="Ticket medio" valor={eur(K.ticket_medio_eur)} nota="Ventas entre pedidos entregados" icono={<TrendingUp className="h-5 w-5 text-purple-400" />} />
        <Tarjeta titulo="Clientes activos" valor={num(C.clientes_activos)} nota={`${pct(C.tasa_recompra_pct)} ha comprado más de una vez`} icono={<Users className="h-5 w-5 text-amber-400" />} />
        <Tarjeta titulo="Tasa de devolución" valor={pct(C.tasa_devolucion_pct, 2)} nota={`${num(C.reembolsados)} reembolsados de ${num(C.entregados_y_reembolsados)} (entregados y reembolsados)`} icono={<Undo2 className="h-5 w-5 text-rose-400" />} />
      </section>

      <Seccion id="ventas" titulo="Evolución de las ventas" sub="Ventas mensuales de pedidos entregados. El eje parte de cero." icono={<TrendingUp className="h-5 w-5 text-slate-400" />}>
        <VentasChart data={serie} />
        {pendUltimo > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {mesCorto(ultimoMes)} tiene {pendUltimo} pedidos pendientes de entrega que aún no cuentan como venta (ningún mes anterior pasa de {maxPendAntes}). La barra se muestra más clara por este motivo.
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400"><tr><th className={TH}>Mes</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ventas</th><th className={`${TH} text-right`}>Ticket medio</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {mensual.data.map((m) => (
                <tr key={m.mes}><td className="px-3 py-2">{mesCorto(m.mes)}</td><td className="num px-3 py-2 text-right">{num(m.pedidos)}</td><td className="num px-3 py-2 text-right">{eur(m.ventas_eur)}</td><td className="num px-3 py-2 text-right">{eur(m.ticket_medio_eur)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {paises.data.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Globe2 className="h-4 w-4 text-slate-400" />Ventas por país del pedido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400"><tr><th className={TH}>País</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Clientes</th><th className={`${TH} text-right`}>Ventas</th><th className={`${TH} text-right`}>% ventas</th><th className={`${TH} text-right`}>Ticket medio</th><th className={`${TH} text-right`}>Pedidos por cliente</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {paises.data.map((p) => (
                    <tr key={p.country}><td className="px-3 py-2 font-semibold text-white">{p.country}</td><td className="num px-3 py-2 text-right">{num(p.pedidos)}</td><td className="num px-3 py-2 text-right">{num(p.clientes)}</td><td className="num px-3 py-2 text-right">{eur(p.ventas_eur)}</td><td className="num px-3 py-2 text-right">{pct(p.pct_ventas)}</td><td className="num px-3 py-2 text-right">{eur(p.ticket_medio_eur)}</td><td className="num px-3 py-2 text-right">{num(p.pedidos_por_cliente, 1)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Seccion>

      <Seccion id="canales" titulo="Recomendación de inversión prioritaria" sub="Índice de Eficiencia de Canal (IEC) = ingresos atribuidos al canal entre su inversión, del 1 de marzo al 30 de junio (el modelo de atribución cambió en marzo)." icono={<ArrowRightLeft className="h-5 w-5 text-slate-400" />}>
        {masGasto && peorIec && mejorFiable && (
          <p className="mb-5 text-sm leading-relaxed text-slate-300">
            <strong className="text-white">{masGasto.canal}</strong> concentra el {pct(masGasto.pct_del_gasto)} del gasto con un IEC de {num(masGasto.iec, 1)}{masGasto.canal === peorIec.canal ? ', el más bajo de los canales de pago' : ''}.{' '}
            <strong className="text-white">{mejorFiable.canal}</strong> devuelve {num(mejorFiable.iec, 1)} € por euro con solo el {pct(mejorFiable.pct_del_gasto)} del gasto.
            {tiktok && <> TikTok Ads sale con {num(tiktok.iec, 1)}, pero con {eur(tiktok.gasto_eur)} de inversión en total: no es una señal para escalarlo.</>}
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-white">IEC por canal de pago</h3>
            <IecChart data={iecPuntos} />
            <p className="mt-1 text-xs text-slate-500">En ámbar, TikTok Ads: el gasto es tan pequeño que infla el ratio.</p>
          </div>
          <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-white"><CheckCircle2 className="h-5 w-5 text-accent" /><h3 className="font-bold">Propuesta para el segundo semestre</h3></div>
              <p className="mb-3 text-sm leading-relaxed text-slate-300">
                Mover <strong className="text-white">{eur(R.traslado_eur, 0)}</strong> (el 25 % del gasto de Meta Ads en H2) a Email, en dos fases de {eur(Number(R.traslado_eur) / 2, 0)}. Si Email mantuviera su IEC, atribuiría unos <strong className="text-emerald-400">{eur(R.ingresos_si_email_mantiene_su_iec_eur, 0)}</strong> y Meta dejaría de atribuir unos {eur(R.ingresos_que_deja_de_atribuir_meta_eur, 0)}.
              </p>
              <p className="text-xs leading-relaxed text-slate-400">
                Compensa mientras los euros adicionales de Email rindan más que los de Meta (IEC {num(R.iec_meta, 1)}), es decir, más del {pct(R.iec_minimo_email_pct_del_medio, 0)} de su IEC medio ({num(R.iec_email, 1)}). Si no se cumple en la primera fase, se detiene. Además, probar TikTok con 100 € al mes durante dos meses.
              </p>
            </div>
            <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Simulación lineal, no una previsión. Detalle en la conclusión 1.8 del README.</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
              <tr>
                <th className={TH}>Puesto</th><th className={TH}>Canal</th>
                <th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ingresos</th><th className={`${TH} text-right`}>Gasto</th>
                <th className={`${TH} text-right`}>% del gasto</th><th className={`${TH} text-right`}>IEC</th><th className={`${TH} text-right`}>Ticket medio</th><th className={TH}>Lectura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[...pagados, ...sinGasto].map((c, i) => (
                <tr key={c.canal} className="hover:bg-slate-800/50">
                  <td className="num px-3 py-3 text-slate-400">{c.gasto_eur === null ? '–' : i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-white">{c.canal}{c.canal === 'Email' && <Mail className="ml-1.5 inline h-3.5 w-3.5 text-emerald-400" />}</td>
                  <td className="num px-3 py-3 text-right">{num(c.pedidos)}</td>
                  <td className="num px-3 py-3 text-right">{eur(c.ingresos_eur)}</td>
                  <td className="num px-3 py-3 text-right">{c.gasto_eur === null ? '–' : eur(c.gasto_eur)}</td>
                  <td className="num px-3 py-3 text-right">{c.pct_del_gasto === null ? '–' : pct(c.pct_del_gasto)}</td>
                  <td className="num px-3 py-3 text-right font-bold text-white">{c.iec === null ? 'n/d' : num(c.iec, 1)}</td>
                  <td className="num px-3 py-3 text-right">{eur(c.ticket_medio_eur)}</td>
                  <td className="px-3 py-3 text-xs">
                    {c.canal === 'TikTok Ads' ? <span className="inline-flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3.5 w-3.5" />{diag(c)}</span> : <span className="text-slate-400">{diag(c)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Instagram Ads se suma a Meta Ads y Newsletter a Email. El ticket medio se muestra como contexto y el ranking se ordena por IEC, porque el ticket no dice si un canal compensa su inversión. Organic y Direct no tienen gasto registrado.
        </p>
      </Seccion>

      <Seccion id="producto" titulo="Categorías y productos activos" sub="Ingreso de líneas (cantidad por precio, sin IVA ni envío) de las referencias vigentes del catálogo. La sudadera cuenta con sus dos fichas unidas." icono={<Layers className="h-5 w-5 text-slate-400" />}>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.data.map((c) => (
            <div key={c.category} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">{c.category}</span>
              <div className="num mb-1 text-xl font-bold text-white">{eur(c.ingreso_lineas_eur)}</div>
              <div className="flex justify-between border-t border-slate-900 pt-2 text-xs text-slate-400">
                <span>{num(c.unidades)} unidades</span>
                <span className="font-semibold text-accent">{pct(c.pct)}</span>
              </div>
              {Number(c.ingreso_retirados_eur) > 0 && <p className="mt-2 text-xs text-amber-300">Además, {eur(c.ingreso_retirados_eur)} de fichas retiradas (fuera de esta cifra)</p>}
            </div>
          ))}
        </div>
        {retiradosDeporte && (
          <p className="mb-5 text-xs text-slate-400">Deporte solo lleva a la venta desde el 1 de mayo, así que su peso del semestre está infravalorado. El análisis de la conclusión 1.5 lo compara en mayo y junio.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400"><tr><th className={TH}>Producto</th><th className={TH}>Categoría</th><th className={`${TH} text-right`}>Unidades</th><th className={`${TH} text-right`}>Ingreso</th><th className={`${TH} text-right`}>Valoración media</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {prods.data.map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-800/50">
                  <td className="px-3 py-2.5 font-semibold text-white">{p.name}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.category}</td>
                  <td className="num px-3 py-2.5 text-right">{num(p.unidades)}</td>
                  <td className="num px-3 py-2.5 text-right">{eur(p.ingreso_lineas_eur)}</td>
                  <td className="num px-3 py-2.5 text-right">{p.valoracion_media === null ? 'sin reseñas' : <>{num(p.valoracion_media, 2)} <span className="text-xs text-slate-500">({num(p.resenas)})</span></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">La valoración cuenta una reseña por cliente y producto (la más reciente anterior al 30 de junio). Entre paréntesis, número de reseñas. Con pocas reseñas la media es poco fiable.</p>
      </Seccion>

      <Seccion id="promos" titulo="Ingreso por código promocional" sub="Pedidos de la base cruzados con los códigos que pasaron por el checkout. El ingreso es el total del pedido." icono={<Tag className="h-5 w-5 text-slate-400" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400"><tr><th className={TH}>Código</th><th className={`${TH} text-right`}>Descuento</th><th className={`${TH} text-right`}>Pedidos</th><th className={`${TH} text-right`}>Ingreso</th><th className={`${TH} text-right`}>% de las ventas</th><th className={TH} aria-label="Peso relativo"></th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {cods.data.map((c) => (
                <tr key={c.codigo} className="hover:bg-slate-800/50">
                  <td className="px-3 py-2.5 font-semibold text-white">{c.codigo}</td>
                  <td className="num px-3 py-2.5 text-right">{c.discount_pct === null ? '–' : `${num(c.discount_pct)} %`}</td>
                  <td className="num px-3 py-2.5 text-right">{num(c.pedidos)}</td>
                  <td className="num px-3 py-2.5 text-right">{eur(c.ingreso_eur)}</td>
                  <td className="num px-3 py-2.5 text-right">{pct(c.pct_de_las_ventas)}</td>
                  <td className="w-40 px-3 py-2.5"><div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-accent" style={{ width: `${(Number(c.ingreso_eur) / maxCod) * 100}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">Ningún código se refleja en los importes de la base, así que el ingreso es el del pedido completo y no el neto de descuento. Un pedido con dos códigos aparece bajo cada uno, por lo que las filas suman más que el total de ventas.</p>
      </Seccion>

      <footer className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
        Datos consolidados por el equipo de BI de Scuffers
      </footer>
    </div>
  );
}
