import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartData } from '../lib/evoluaData'
const COLORS = ['#1d4ed8', '#facc15', '#0ea5e9', '#0b2559', '#f97316', '#10b981']
const pct = (v: number, t: number) => (t ? Math.round((v / t) * 1000) / 10 : 0)
const br = (n: number) => String(n).replace('.', ',')
/* Gráfico de pizza + legenda acessível (a legenda mostra também as opções com 0 respostas). */
export default function PieCard({ chart }: { chart: ChartData }) {
  const data = chart.options.map((o, i) => ({ ...o, color: COLORS[i % COLORS.length], p: pct(o.value, chart.total) }))
  const shown = data.filter(d => d.value > 0)
  return (<figure className="card flex flex-col" aria-label={chart.title}>
    <figcaption className="mb-1 text-[15px] font-bold leading-snug text-navy">{chart.title}</figcaption>
    <span className="mb-3 text-xs text-slate-500">{chart.total} respostas</span>
    <div className="h-56" role="img" aria-label={shown.map(d => `${d.label}: ${br(d.p)}%`).join('; ')}>
      <ResponsiveContainer><PieChart><Pie data={shown} dataKey="value" nameKey="label" outerRadius="92%" stroke="#fff" strokeWidth={2} labelLine={false} isAnimationActive={false}
        label={(p: any) => { const R = Math.PI / 180, r = p.innerRadius + (p.outerRadius - p.innerRadius) * 0.6, x = p.cx + r * Math.cos(-p.midAngle * R), y = p.cy + r * Math.sin(-p.midAngle * R)
          return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={p.payload.color === '#facc15' ? '#422006' : '#fff'}>{br(p.payload.p)}%</text> }}>
        {shown.map(d => <Cell key={d.label} fill={d.color} />)}</Pie>
        <Tooltip formatter={(v: any, _n: any, e: any) => [`${v} de ${chart.total} (${br(e.payload.p)}%)`, '']} separator="" /></PieChart></ResponsiveContainer></div>
    <ul className="mt-3 space-y-2 text-sm text-slate-600">{data.map(d => <li key={d.label} className={`flex items-start gap-2 ${d.value ? '' : 'opacity-60'}`}>
      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} /><span className="flex-1">{d.label}</span><b className="shrink-0 text-navy">{br(d.p)}%</b></li>)}</ul>
  </figure>)
}
