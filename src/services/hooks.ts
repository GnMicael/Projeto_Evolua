import { useEffect, useState } from 'react'; import { Query, DocumentReference, doc, onSnapshot } from 'firebase/firestore'; import { db } from '../lib/firebase'; import { DEFAULT_CONTENT } from '../lib/defaults'
export function useCol<T = any>(q: Query | null, deps: any[] = []) {
  const [s, setS] = useState<{ data: T[]; loading: boolean; error: string }>({ data: [], loading: !!q, error: '' })
  useEffect(() => { if (!q) { setS({ data: [], loading: false, error: '' }); return } setS(p => ({ ...p, loading: true }))
    return onSnapshot(q, snap => setS({ data: snap.docs.map(d => ({ id: d.id, ...d.data() })) as any, loading: false, error: '' }), err => setS({ data: [], loading: false, error: err.message })) // eslint-disable-next-line
  }, deps)
  return s
}
export function useDocData<T = any>(ref: DocumentReference | null, deps: any[] = []) {
  const [s, setS] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: !!ref })
  useEffect(() => { if (!ref) { setS({ data: null, loading: false }); return } return onSnapshot(ref, snap => setS({ data: snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null, loading: false }), () => setS({ data: null, loading: false })) // eslint-disable-next-line
  }, deps)
  return s
}
// Campo apagado no painel (texto vazio) volta ao texto padrão em vez de deixar a página em branco.
export const useContent = () => { const { data } = useDocData<any>(doc(db, 'siteContent', 'main'), []); const filled = Object.fromEntries(Object.entries(data || {}).filter(([, v]) => (typeof v === 'string' ? v.trim() !== '' : v != null))); return { ...DEFAULT_CONTENT, ...filled } as any }
export function summarize(rs: any[], period?: string) {
  const l = rs.filter(r => !period || r.period === period), sum = (k: string) => l.reduce((a, r) => a + (r[k] || 0), 0), t = sum('participants'), p = (k: string) => (t ? Math.round(sum(k) / t * 100) : 0)
  return { n: sum('approvedSubmissionCount'), t, impact: p('impactNum'), cont: p('contNum'), uniB: p('uniBNum'), uniA: p('uniANum'), schools: sum('schoolCount') }
}
