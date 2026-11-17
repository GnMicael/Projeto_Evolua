export const MIN_SUBMISSIONS = 5
export const FIELDS: [string, string][] = [['total', 'Total de participantes'], ['impact', 'Perceberam impacto positivo no projeto de vida'], ['cont', 'Querem continuar em atividades científicas'], ['uniB', 'Interesse em universidade ANTES dos projetos'], ['uniA', 'Interesse em universidade DEPOIS dos projetos']]
export const LABEL: any = { pending: 'Aguardando', approved: 'Aprovado', rejected: 'Rejeitado', suspended: 'Suspenso', draft: 'Rascunho', correction: 'Correção pedida', published: 'Publicado', archived: 'Arquivado' }
export const QTYPES: any = { text: 'Texto', number: 'Número', yesno: 'Sim ou não', select: 'Seleção única' }
// Datas "AAAA-MM-DD" (campo date das entrevistas) são lidas como data local. Com new Date('2026-05-01') o JS usa
// UTC e, no fuso do Brasil, a tela mostrava o dia anterior (30/04).
export const fmt = (t: any) => {
  if (!t) return '—'
  let d: Date
  if (t.toDate) d = t.toDate()
  else if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t)) { const [y, m, day] = t.split('-').map(Number); d = new Date(y, m - 1, day) }
  else d = new Date(t)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
export const FIELD_SHORT: Record<string, string> = { total: 'Participantes', impact: 'Impacto', cont: 'Continuidade', uniB: 'Univ. antes', uniA: 'Univ. depois' }
export const authMsg = (e: any) => ({ 'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/email-already-in-use': 'Este e-mail já está cadastrado.', 'auth/weak-password': 'Senha muito fraca (mínimo de 8 caracteres).', 'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.', 'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.', 'auth/invalid-email': 'E-mail inválido.', 'auth/popup-closed-by-user': 'Login cancelado.', 'auth/cancelled-popup-request': 'Login cancelado.', 'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.', 'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase Authentication.', 'auth/operation-not-allowed': 'O login com Google não está ativado no Firebase.', 'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail usando outro método de login.', 'permission-denied': 'Você não tem permissão para esta ação.' } as any)[e?.code] || e?.message || 'Ocorreu um erro. Tente novamente.'
export const notify = (m: string, kind: 'ok' | 'err' = 'ok') => { const t = document.createElement('div'); t.textContent = m; t.setAttribute('role', 'status'); t.className = `fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg ${kind === 'err' ? 'bg-red-600' : 'bg-navy'}`; document.body.append(t); setTimeout(() => t.remove(), 3200) }
export const run = async (fn: () => Promise<any>, ok = '') => { try { await fn(); if (ok) notify(ok); return true } catch (e: any) { notify(authMsg(e), 'err'); return false } }
