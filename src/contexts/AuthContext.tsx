import { createContext, useContext, useEffect, useState, ReactNode } from 'react'; import { onAuthStateChanged, User } from 'firebase/auth'; import { doc, onSnapshot } from 'firebase/firestore'; import { auth, db } from '../lib/firebase'
interface A { user: User | null; role: 'visitor' | 'school' | 'admin'; school: any; loading: boolean }
const Ctx = createContext<A>({ user: null, role: 'visitor', school: null, loading: true })
export const useAuth = () => useContext(Ctx)
// Papel de administrador vem de custom claim (definida só pelo Admin SDK). Escola = documento schools/{uid}, acompanhado em tempo real.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<A>({ user: null, role: 'visitor', school: null, loading: true })
  useEffect(() => { let un = () => {}, seq = 0
    const off = onAuthStateChanged(auth, async u => { const my = ++seq; un(); un = () => {}
      if (!u) return setS({ user: null, role: 'visitor', school: null, loading: false })
      // Se a renovação do token falhar (sem rede), segue como não-admin em vez de ficar em "Carregando…" para sempre.
      let admin = false; try { admin = !!(await u.getIdTokenResult(true)).claims.admin } catch { /* sem rede */ }
      if (my !== seq) return // outro login/logout aconteceu enquanto esperávamos: descarta este resultado
      if (admin) return setS({ user: u, role: 'admin', school: null, loading: false })
      un = onSnapshot(doc(db, 'schools', u.uid), snap => setS({ user: u, role: snap.exists() ? 'school' : 'visitor', school: snap.exists() ? { id: snap.id, ...snap.data() } : null, loading: false }), () => setS({ user: u, role: 'visitor', school: null, loading: false })) })
    return () => { seq++; off(); un() } }, [])
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>
}
