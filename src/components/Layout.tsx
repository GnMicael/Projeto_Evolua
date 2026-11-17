import { useLocation } from 'react-router-dom'; import { Pencil, Check } from 'lucide-react'; import { useEdit } from '../contexts/EditContext'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'; import { useState, useEffect } from 'react'; import { Menu, X, School, ChevronDown, UserRound, LayoutDashboard, LogOut } from 'lucide-react'; import { useAuth } from '../contexts/AuthContext'; import { logout } from '../services/api'
const items = [['/', 'Início'], ['/projeto', 'O projeto'], ['/pesquisa', 'Pesquisa'], ['/resultados', 'Resultados'], ['/entrevistas', 'Entrevistas'], ['/documentos', 'Documentos']]
const mi = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-navy hover:bg-sky'
function AccountMenu() {
  const [o, setO] = useState(false); const a = useAuth(); const nav = useNavigate()
  useEffect(() => { const c = () => setO(false); document.addEventListener('click', c); return () => document.removeEventListener('click', c) }, [])
  const ses = a.user && a.role !== 'visitor' ? a : null; const adm = a.role === 'admin'
  const name = ses ? (adm ? a.user?.displayName || 'Equipe Evolua' : a.school?.name || 'Minha escola') : ''
  return (<div className="relative ml-auto md:ml-0"><button className={`${ses ? 'btn-o' : 'btn-p'} !py-2.5`} aria-haspopup="menu" aria-expanded={o} onClick={e => { e.stopPropagation(); setO(!o) }}>
    {ses ? <><UserRound size={16} /><span className="max-w-[140px] truncate">{name}</span></> : 'Entrar'}<ChevronDown size={16} /></button>
    {o && <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      {ses ? <><Link role="menuitem" to={adm ? '/gestao' : '/escolas/painel'} className={mi}><LayoutDashboard size={18} className="text-brand" />Minha área</Link><button role="menuitem" className={mi + ' w-full'} onClick={() => { logout().then(() => nav('/')) }}><LogOut size={18} className="text-brand" />Sair</button></>
        : <Link role="menuitem" to="/escolas" className={mi}><School size={18} className="text-brand" /><span>Entrar com Google<small className="block font-normal text-slate-500">Escolas participantes</small></span></Link>}</div>}</div>)
}
function EditBar() {
  const a = useAuth(); const { editing, toggle } = useEdit(); const loc = useLocation()
  if (a.role !== 'admin' || loc.pathname.startsWith('/gestao')) return null
  return <button onClick={toggle} className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-xl ${editing ? 'bg-sun text-yellow-950' : 'bg-navy text-white'}`}>{editing ? <><Check size={16} />Concluir edição</> : <><Pencil size={16} />Editar páginas</>}</button>
}
export default function Layout() {
  const [open, setOpen] = useState(false); const a = useAuth(); const ses = a.user && a.role !== 'visitor' ? a : null
  return (<div className="min-h-screen font-sans text-slate-900">
    <div className="bg-navy py-2 text-xs text-blue-200"><div className="mx-auto flex max-w-6xl justify-between px-6"><span>Pesquisa educacional · escolas estaduais · desde 2023</span><span className="hidden sm:inline">Apenas dados agregados e aprovados</span></div></div>
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex h-[70px] max-w-6xl items-center gap-8 px-6">
      <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-navy"><span className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-brand from-55% to-sun to-55%" />Evolua</Link>
      <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-[70px] flex-col border-b bg-white p-4 md:static md:ml-auto md:flex md:flex-row md:border-0 md:p-0`}>
        {items.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-sky text-brand' : 'text-slate-700 hover:bg-sky'}`}>{l}</NavLink>)}</nav>
      <AccountMenu /><button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
    <Outlet />
    <footer className="bg-[#071a40] py-12 text-sm text-blue-200"><div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-4"><div className="sm:col-span-2"><b className="text-lg text-white">Evolua</b><p className="mt-2 max-w-sm">Pesquisa sobre os caminhos que a ciência abre para os projetos de vida de estudantes e ex-alunos das escolas estaduais.</p></div>
      <div className="flex flex-col gap-1"><b className="text-white">Navegação</b><Link to="/projeto">O projeto</Link><Link to="/resultados">Resultados</Link><Link to="/documentos">Biblioteca de documentos</Link></div>
      <div className="flex flex-col gap-1"><b className="text-white">Acesso</b>{ses ? <Link to={a.role === 'admin' ? '/gestao' : '/escolas/painel'}>Minha área</Link> : <Link to="/escolas">Área das escolas</Link>}<a href="https://www.instagram.com/evoluaimpactoprojetos">Instagram</a></div></div></footer><EditBar /></div>)
}
