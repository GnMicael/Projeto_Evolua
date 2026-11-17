import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { addDoc, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, getCountFromServer, query, where, serverTimestamp, arrayUnion, deleteField } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'; import { imageToDataUrl, safeUrl } from '../lib/files'; import { MIN_SUBMISSIONS } from '../lib/constants'
const uidOf = () => auth.currentUser?.uid
/* Autenticação: todos entram com Google. Administrador = custom claim "admin", definida só pelos scripts em backend/ (Admin SDK). */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  const token = await result.user.getIdTokenResult(true)
  if (!token.claims.admin) {
    const schoolRef = doc(db, 'schools', result.user.uid)
    const school = await getDoc(schoolRef)
    if (!school.exists()) {
      const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'Nova escola'
      await setDoc(schoolRef, { name: displayName, responsibleName: result.user.displayName || displayName, institutionalEmail: result.user.email || '', status: 'pending', createdAt: serverTimestamp() })
    }
  }
  return result
}
export const logout = () => signOut(auth)
/* Auditoria e estatísticas públicas: no plano gratuito não há Cloud Functions, então o painel do administrador grava. */
const audit = (action: string, resource: string, resourceId: string) =>
  addDoc(collection(db, 'auditLogs'), { userId: uidOf(), action, resource, resourceId, timestamp: serverTimestamp() }).catch(() => {})
export async function refreshPublicStats() {
  const n = (await getCountFromServer(query(collection(db, 'schools'), where('status', '==', 'approved')))).data().count
  await setDoc(doc(db, 'publicStats', 'summary'), { schools: n, updatedAt: serverTimestamp() })
}
// Recalcula os agregados públicos a partir de TODOS os envios aprovados (idempotente). Abaixo de 5 envios nada é publicado.
export async function recomputeResults(surveyId: string) {
  const subs = (await getDocs(query(collection(db, 'submissions'), where('surveyId', '==', surveyId), where('status', '==', 'approved')))).docs.map(d => d.data())
  const ref = doc(db, 'aggregatedResults', surveyId)
  if (subs.length < MIN_SUBMISSIONS) { await deleteDoc(ref); return }
  const sum = (k: string) => subs.reduce((a, s: any) => a + (Number(s.vals?.[k]) || 0), 0)
  await setDoc(ref, { surveyId, period: subs[0].period, approvedSubmissionCount: subs.length, schoolCount: new Set(subs.map((s: any) => s.schoolId)).size, participants: sum('total'), impactNum: sum('impact'), contNum: sum('cont'), uniBNum: sum('uniB'), uniANum: sum('uniA'), updatedAt: serverTimestamp() })
}
export async function recomputeAll() {
  const ids = (await getDocs(collection(db, 'surveys'))).docs.map(d => d.id)
  for (const id of ids) await recomputeResults(id)
  await refreshPublicStats()
}
/* Escolas */
export async function setSchoolStatus(id: string, status: string) {
  await updateDoc(doc(db, 'schools', id), { status, statusBy: uidOf(), statusAt: serverTimestamp() })
  await Promise.all([audit('school:' + status, 'schools', id), refreshPublicStats().catch(() => {})])
}
type SchoolData = { name: string; responsibleName: string; institutionalEmail: string }
const cleanSchool = (d: SchoolData): SchoolData => {
  const name = d.name.trim(), responsibleName = d.responsibleName.trim(), institutionalEmail = d.institutionalEmail.trim()
  if (name.length < 2 || name.length > 180) throw new Error('Informe o nome da escola (2 a 180 caracteres).')
  if (responsibleName.length < 2 || responsibleName.length > 120) throw new Error('Informe o nome do responsável (2 a 120 caracteres).')
  if (institutionalEmail.length > 254 || (institutionalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(institutionalEmail))) throw new Error('E-mail inválido.')
  return { name, responsibleName, institutionalEmail }
}
// Administrador edita o cadastro de qualquer escola.
export async function updateSchoolAsAdmin(id: string, d: SchoolData) {
  await updateDoc(doc(db, 'schools', id), { ...cleanSchool(d), updatedAt: serverTimestamp(), updatedBy: uidOf() })
  await audit('school:edit', 'schools', id)
}
// Administrador libera (ou bloqueia) a edição do cadastro pela própria escola.
export async function setSchoolEditEnabled(id: string, enabled: boolean) {
  await updateDoc(doc(db, 'schools', id), { editEnabled: enabled, updatedAt: serverTimestamp(), updatedBy: uidOf() })
  await audit(enabled ? 'school:edit-enabled' : 'school:edit-disabled', 'schools', id)
}
// Escola edita o próprio cadastro (só quando liberado). Ao salvar, a liberação é consumida.
export const updateOwnSchool = (id: string, d: SchoolData) => updateDoc(doc(db, 'schools', id), { ...cleanSchool(d), editEnabled: false, updatedAt: serverTimestamp() })
/* Pesquisas */
export async function saveSurvey(cur: any, f: any, questions: any[]) {
  if (cur) { const changed = JSON.stringify(cur.questions || []) !== JSON.stringify(questions); return updateDoc(doc(db, 'surveys', cur.id), { title: f.title, period: f.period, instructions: f.instructions, questions, version: (cur.version || 1) + (changed ? 1 : 0), updatedAt: serverTimestamp() }) }
  return setDoc(doc(collection(db, 'surveys')), { title: f.title, period: f.period, instructions: f.instructions, questions, version: 1, status: 'draft', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}
export const setStatus = (col: string, id: string, status: string) => updateDoc(doc(db, col, id), col === 'surveys' ? { status, updatedAt: serverTimestamp() } : { publicationStatus: status, updatedAt: serverTimestamp() })
/* Envios */
export async function saveSubmission(school: any, survey: any, vals: any, extra: any, send: boolean) {
  const r = doc(db, 'submissions', `${survey.id}_${school.id}`), snap = await getDoc(r)
  const d: any = { schoolId: school.id, schoolName: school.name, surveyId: survey.id, surveyTitle: survey.title, period: survey.period, surveyVersion: survey.version || 1, vals, extra, questionsSnapshot: (survey.questions || []).map((q: any) => ({ id: q.id, label: q.label })), status: send ? 'pending' : 'draft', updatedAt: serverTimestamp() }
  if (send) d.submittedAt = serverTimestamp()
  if (snap && snap.exists()) return updateDoc(r, d)
  return setDoc(r, { ...d, reviewNotes: '', createdAt: serverTimestamp() })
}
export async function reviewSubmission(m: any, status: string, notes: string) {
  await updateDoc(doc(db, 'submissions', m.id), { status, reviewNotes: notes, reviewedBy: uidOf(), reviewedAt: serverTimestamp(), history: arrayUnion({ at: Date.now(), status, notes, by: uidOf() }) })
  await audit('review:' + status, 'submissions', m.id)
  if (status === 'approved' || m.status === 'approved') {
    try { await recomputeResults(m.surveyId) } catch { throw new Error('Revisão salva, mas os resultados públicos não foram atualizados. Use "Recalcular resultados" no Painel.') }
  }
}
/* Entrevistas (foto guardada no Firestore) */
export async function saveInterview(cur: any, f: any, file?: File) {
  const r = cur ? doc(db, 'interviews', cur.id) : doc(collection(db, 'interviews')); let image = cur?.image || ''
  if (file) image = await imageToDataUrl(file)
  const d = { title: f.title, participant: f.participant, category: f.category, date: f.date, content: f.content, image, publicationStatus: f.publish ? 'published' : 'draft', updatedAt: serverTimestamp() }
  return cur ? updateDoc(r, d) : setDoc(r, { ...d, consent: true, consentAt: serverTimestamp(), createdAt: serverTimestamp() })
}
export const deleteItem = (col: string, item: any) => deleteDoc(doc(db, col, item.id))
/* Documentos (PDF hospedado fora; o Firestore guarda o link) */
export async function saveDocument(cur: any, f: any) {
  const r = cur ? doc(db, 'documents', cur.id) : doc(collection(db, 'documents')); const url = safeUrl(f.url)
  if (!url) throw new Error('Informe o link (http ou https) do PDF.')
  const d = { title: f.title, category: f.category, description: f.description, url, updatedAt: serverTimestamp() }
  return cur ? updateDoc(r, d) : setDoc(r, { ...d, publicationStatus: 'draft', createdAt: serverTimestamp() })
}
/* Conteúdo do site */
export const saveContent = (c: any) => setDoc(doc(db, 'siteContent', 'main'), { ...c, updatedAt: serverTimestamp() }, { merge: true })
export const resetContent = (field: string) => setDoc(doc(db, 'siteContent', 'main'), { [field]: deleteField() }, { merge: true })
export async function saveContentImage(field: string, file: File) { return saveContent({ [field]: await imageToDataUrl(file) }) }
export const removeContentImage = (field: string) => setDoc(doc(db, 'siteContent', 'main'), { [field]: deleteField(), [field + 'Path']: deleteField() }, { merge: true })
export async function saveGalleryItem(cur: any, caption: string, file?: File) {
  const r = cur ? doc(db, 'gallery', cur.id) : doc(collection(db, 'gallery')); let image = cur?.image || ''
  if (file) image = await imageToDataUrl(file)
  if (!image) throw new Error('Selecione uma foto.')
  const d = { caption, image, updatedAt: serverTimestamp() }; return cur ? updateDoc(r, d) : setDoc(r, { ...d, createdAt: serverTimestamp() }) }
