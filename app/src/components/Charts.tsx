'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from 'recharts';

const num = (v: number, d = 0) => {
  const [e, f] = Math.abs(v).toFixed(d).split('.');
  return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '');
};

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 };

export type MesPunto = { mes: string; ventas: number; pedidos: number; ticket: number; incompleto: boolean };

export function VentasChart({ data }: { data: MesPunto[] }) {
  return (
    <div className="h-64" role="img" aria-label="Ventas mensuales en euros, de enero a junio de 2026">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} domain={[0, 'auto']} tickFormatter={(v) => num(Number(v))} width={64} />
          <Tooltip
            cursor={{ fill: '#1e293b66' }}
            contentStyle={tooltipStyle}
            formatter={(_v, _n, item) => {
              const p = item.payload as MesPunto;
              return [`${num(p.ventas, 2)} € · ${p.pedidos} pedidos · ticket ${num(p.ticket, 2)} €`, 'Ventas'];
            }}
          />
          <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.mes} fill="#E8532F" fillOpacity={d.incompleto ? 0.55 : 1} />
            ))}
            <LabelList dataKey="ventas" position="top" fill="#cbd5e1" fontSize={11} formatter={(v: number) => num(Number(v))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type IecPunto = { canal: string; iec: number; aviso: boolean };

export function IecChart({ data }: { data: IecPunto[] }) {
  return (
    <div style={{ height: 52 * data.length + 20 }} role="img" aria-label="Índice de eficiencia de canal por canal de pago">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" domain={[0, 'auto']} tickLine={false} />
          <YAxis type="category" dataKey="canal" stroke="#94a3b8" width={100} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#1e293b66' }}
            contentStyle={tooltipStyle}
            formatter={(v) => [`${num(Number(v), 1)} € de ingresos por euro invertido`, 'IEC']}
          />
          <Bar dataKey="iec" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.canal} fill={d.aviso ? '#f59e0b' : '#E8532F'} fillOpacity={d.aviso ? 0.6 : 1} />
            ))}
            <LabelList dataKey="iec" position="right" fill="#cbd5e1" fontSize={12} formatter={(v: number) => num(Number(v), 1)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
