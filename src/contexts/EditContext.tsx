import { createContext, useContext, useState, ReactNode } from 'react'; import { useAuth } from './AuthContext'
const C = createContext({ editing: false, toggle: () => {} })
export const useEdit = () => useContext(C)
// Modo de edição: só existe para administradores (as regras do Firebase também bloqueiam qualquer gravação de quem não é admin).
export function EditProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth(); const [on, setOn] = useState(false)
  return <C.Provider value={{ editing: role === 'admin' && on, toggle: () => setOn(v => !v) }}>{children}</C.Provider>
}
