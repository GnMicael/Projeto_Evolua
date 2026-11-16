import { createContext, useContext, useEffect, useState, ReactNode } from 'react'; import { onAuthStateChanged, User } from 'firebase/auth'; import { doc, onSnapshot } from 'firebase/firestore'; import { auth, db } from '../lib/firebase'
interface A { user: User | null; role: 'visitor' | 'school' | 'admin'; school: any; loading: boolean }
const Ctx = createContext<A>({ user: null, role: 'visitor', school: null, loading: true })
export const useAuth = () => useContext(Ctx)
// Papel de administrador vem de custom claim (definida só pelo Admin SDK). Escola = documento schools/{uid}, acompanhado em tempo real.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<A>({ user: null, role: 'visitor', school: null, loading: true })
  useEffect(() => { let un = () => {}
    const off = onAuthStateChanged(auth, async u => { un(); un = () => {}
      if (!u) return setS({ user: null, role: 'visitor', school: null, loading: false })
      const tok = await u.getIdTokenResult(true); if (tok.claims.admin) return setS({ user: u, role: 'admin', school: null, loading: false })
      un = onSnapshot(doc(db, 'schools', u.uid), snap => setS({ user: u, role: snap.exists() ? 'school' : 'visitor', school: snap.exists() ? { id: snap.id, ...snap.data() } : null, loading: false }), () => setS({ user: u, role: 'visitor', school: null, loading: false })) })
    return () => { off(); un() } }, [])
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>
}
