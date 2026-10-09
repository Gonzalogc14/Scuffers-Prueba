'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from 'recharts';

const num = (v: number, d = 0) => {
  const [e, f] = Math.abs(v).toFixed(d).split('.');
  return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '');
};

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 14 };
const tick = { fill: '#94a3b8', fontSize: 14 };

export type MesPunto = { mes: string; ventas: number; pedidos: number; ticket: number; incompleto: boolean };

export function VentasChart({ data }: { data: MesPunto[] }) {
  return (
    <div className="h-72" role="img" aria-label="Ventas mensuales en euros, de enero a junio de 2026">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="mes" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} domain={[0, 'auto']} tickFormatter={(v) => num(Number(v))} width={64} />
          <Tooltip
            cursor={{ fill: '#1e293b66' }}
            contentStyle={tooltipStyle}
            formatter={(_v, _n, item) => {
              const p = item.payload as MesPunto;
              return [`${num(p.ventas, 2)} € · ${p.pedidos} pedidos`, 'Ventas'];
            }}
          />
          <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.mes} fill="#E8532F" fillOpacity={d.incompleto ? 0.5 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type IecPunto = { canal: string; iec: number; aviso: boolean };

export function IecChart({ data }: { data: IecPunto[] }) {
  return (
    <div style={{ height: 56 * data.length + 24 }} role="img" aria-label="Índice de eficiencia de canal por canal de pago">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" tick={tick} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <YAxis type="category" dataKey="canal" tick={{ fill: '#e2e8f0', fontSize: 14 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip
            cursor={{ fill: '#1e293b66' }}
            contentStyle={tooltipStyle}
            formatter={(v) => [`${num(Number(v), 1)} € por euro invertido`, 'IEC']}
          />
          <Bar dataKey="iec" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.canal} fill={d.aviso ? '#64748b' : '#E8532F'} />
            ))}
            <LabelList dataKey="iec" position="right" fill="#e2e8f0" fontSize={14} formatter={(v: number) => num(Number(v), 1)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
