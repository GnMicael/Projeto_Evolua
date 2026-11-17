import { useState } from 'react'; import { Chrome, ShieldAlert } from 'lucide-react'; import { Page } from '../components/ui'; import { signInWithGoogle, logout } from '../services/api'; import { authMsg } from '../lib/constants'; import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const a = useAuth(); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const login = async () => { setBusy(true); setErr(''); try { await signInWithGoogle() } catch (e: any) { setErr(authMsg(e)) } finally { setBusy(false) } }
  return (<Page eyebrow="Para escolas" title="Entrar com Google" lead="Use sua conta Google institucional. O acesso às pesquisas é liberado após a aprovação da equipe Evolua.">
    <div className="grid items-start gap-8 md:grid-cols-[420px_1fr]"><div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-navy/5">
      {a.user && a.role === 'visitor' && <div className="mb-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><ShieldAlert size={18} className="shrink-0" /><span>Seu perfil está sendo preparado para aprovação. <button className="font-semibold underline" onClick={() => logout()}>Sair</button></span></div>}
      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
      <button className="btn-p flex w-full items-center justify-center gap-3" disabled={busy} onClick={login}><Chrome size={18} />{busy ? 'Abrindo Google…' : 'Continuar com Google'}</button>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">Na primeira entrada, criamos seu cadastro institucional com os dados públicos da conta Google. A equipe Evolua aprovará o acesso.</p>
    </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600"><b className="text-navy">Como participar</b><p className="mt-2">Entre com o Google usado pela escola. Depois da aprovação, você poderá preencher e enviar as pesquisas.</p><p className="mt-3">A equipe Evolua também entra por este botão e é direcionada automaticamente para a gestão.</p><p className="mt-3">Tratamos apenas dados agregados de pesquisa, em conformidade com a LGPD.</p></div></div></Page>)
}
