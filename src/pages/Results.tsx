import { useState } from 'react'; import { collection, doc } from 'firebase/firestore'; import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { Lightbulb, MessagesSquare, Search, GraduationCap, Trophy, School, Quote } from 'lucide-react'
import { Page, Kpi } from '../components/ui'; import PieCard from '../components/PieCard'; import { db } from '../lib/firebase'; import { useCol, useDocData, summarize } from '../services/hooks'
import { FINDINGS, CONCLUSION, CHARTS, INTERVIEW_QUESTION, INTERVIEWS } from '../lib/evoluaData'
const ICONS: any = { Lightbulb, MessagesSquare, Search, GraduationCap, Trophy, School }
function SchoolsData() {
  const r = useCol<any>(collection(db, 'aggregatedResults'), []); const st = useDocData<any>(doc(db, 'publicStats', 'summary'), []); const [p, setP] = useState('')
  const rs = [...r.data].sort((a: any, b: any) => String(a.period).localeCompare(String(b.period))); const a = summarize(rs, p); const per = [...new Set(rs.map((x: any) => x.period))] as string[]
  const evo = per.map(x => ({ x, ...summarize(rs, x) })) // um ponto por período (duas pesquisas no mesmo período somam, não duplicam)
  const chart = (data: any[], bars: any[]) => <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="n" /><YAxis unit="%" domain={[0, 100]} /><Tooltip />{bars.length > 1 && <Legend />}{bars.map(b => <Bar key={b[0]} dataKey={b[0]} name={b[1]} fill={b[2]} radius={[6, 6, 0, 0]} />)}</BarChart></ResponsiveContainer></div>
  if (r.loading || r.error || !rs.length) return null // só aparece quando as escolas já tiverem envios aprovados
  return (<section className="mt-16"><span className="eyebrow">Pesquisa nas escolas</span><h2 className="mb-5 mt-2 text-3xl font-bold text-navy">Resultados enviados pelas escolas</h2>
    <label className="text-sm font-semibold">Período de referência<select className="field max-w-xs" value={p} onChange={e => setP(e.target.value)}><option value="">Todos os períodos</option>{per.map(x => <option key={x}>{x}</option>)}</select></label>
    <div className="grid gap-4 md:grid-cols-4"><Kpi v={p ? a.schools : st.data?.schools ?? 0} l="escolas participantes" /><Kpi v={a.t} l="estudantes alcançados" /><Kpi v={a.impact + '%'} l="impacto no projeto de vida" /><Kpi v={a.cont + '%'} l="continuidade na ciência" /></div>
    <div className="mt-6 grid gap-5 md:grid-cols-2"><div className="card"><h3 className="mb-2 font-bold text-navy">Impacto e continuidade</h3>{chart([{ n: 'Impacto', v: a.impact }, { n: 'Continuidade', v: a.cont }], [['v', '%', '#1d4ed8']])}</div>
      <div className="card"><h3 className="mb-2 font-bold text-navy">Perspectiva de universidade</h3>{chart([{ n: 'Interesse', antes: a.uniB, depois: a.uniA }], [['antes', 'Antes', '#facc15'], ['depois', 'Depois', '#1d4ed8']])}</div></div>
    <div className="card mt-5"><h3 className="mb-2 font-bold text-navy">Evolução por período</h3>{evo.length < 2 ? <p className="text-sm text-slate-500">Disponível quando houver ao menos dois períodos publicados.</p> : chart(evo.map(e => ({ n: e.x, impact: e.impact, cont: e.cont })), [['impact', 'Impacto', '#1d4ed8'], ['cont', 'Continuidade', '#facc15']])}</div>
    <p className="mt-4 text-sm text-slate-500">Origem: {a.n} envios aprovados e revisados pela equipe. Dados agregados; recortes com menos de 5 envios aprovados não são exibidos.</p></section>)
}
export default function Results() {
  return (<Page eyebrow="Resultados da pesquisa" title="O que a ciência na escola muda na vida dos jovens" lead="Os principais resultados e descobertas obtidos durante o desenvolvimento da pesquisa, a partir das respostas de alunos e ex-alunos.">
    <h2 className="mb-5 text-2xl font-bold text-navy">Principais descobertas</h2>
    <div className="grid gap-5 md:grid-cols-3">{FINDINGS.map(f => { const I = ICONS[f.icon]; return <div key={f.title} className="card"><span className="ico"><I size={22} strokeWidth={1.8} /></span><p className="mt-3 font-semibold leading-snug text-navy">{f.title}</p></div> })}</div>
    <div className="mt-6 rounded-3xl bg-navy p-7 text-blue-100 md:p-9"><span className="eyebrow !text-sun">Conclusão da pesquisa</span><p className="mt-3 max-w-3xl text-xl font-semibold leading-snug text-white">{CONCLUSION}</p></div>
    <section className="mt-16"><span className="eyebrow">Gráficos estatísticos</span><h2 className="mb-2 mt-2 text-3xl font-bold text-navy">O que dizem as respostas</h2><p className="mb-6 max-w-2xl text-slate-600">Resultados do questionário respondido por 9 participantes dos projetos científicos.</p>
      <div className="grid gap-5 md:grid-cols-2">{CHARTS.map(c => <PieCard key={c.id} chart={c} />)}</div></section>
    <section className="mt-16"><span className="eyebrow">Dados das entrevistas</span><h2 className="mb-2 mt-2 text-3xl font-bold text-navy">{INTERVIEW_QUESTION}</h2><p className="mb-6 max-w-2xl text-slate-600">Respostas dos participantes, publicadas sem identificação.</p>
      <div className="columns-1 gap-5 md:columns-2">{INTERVIEWS.map((t, i) => <blockquote key={i} className="card mb-5 break-inside-avoid"><Quote size={20} className="mb-2 text-brand" /><p className={t.length < 40 ? 'text-xl font-bold text-navy' : 'text-slate-700'}>{t}</p></blockquote>)}</div></section>
    <SchoolsData /></Page>)
}
