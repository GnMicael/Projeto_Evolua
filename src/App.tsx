import { Routes, Route, Navigate } from 'react-router-dom'; import Layout from './components/Layout'; import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'; import { Projeto, Pesquisa } from './pages/Static'; import Results from './pages/Results'; import { Interviews, Documents } from './pages/Library'
import Login from './pages/Login'; import SchoolArea from './pages/SchoolArea'; import Admin from './pages/Admin'
const Wait = () => <div className="grid min-h-[40vh] place-items-center text-slate-500">Carregando…</div>
const Guard = ({ role, children }: { role: 'school' | 'admin'; children: JSX.Element }) => { const a = useAuth(); if (a.loading) return <Wait />; return a.role === role ? children : <Navigate to={role === 'admin' ? '/gestao/login' : '/escolas'} replace /> }
export default function App() {
  const a = useAuth()
  return (<Routes><Route element={<Layout />}>
    <Route index element={<Home />} /><Route path="projeto" element={<Projeto />} /><Route path="pesquisa" element={<Pesquisa />} /><Route path="resultados" element={<Results />} />
    <Route path="entrevistas" element={<Interviews />} /><Route path="documentos" element={<Documents />} />
    <Route path="escolas" element={a.loading ? <Wait /> : a.role === 'school' ? <Navigate to="/escolas/painel" replace /> : a.role === 'admin' ? <Navigate to="/gestao" replace /> : <Login kind="school" />} />
    <Route path="gestao/login" element={a.loading ? <Wait /> : a.role === 'admin' ? <Navigate to="/gestao" replace /> : <Login kind="admin" />} />
    <Route path="escolas/painel" element={<Guard role="school"><SchoolArea /></Guard>} /><Route path="gestao" element={<Guard role="admin"><Admin /></Guard>} />
    <Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>)
}
