import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp, arrayUnion, deleteField } from 'firebase/firestore'
import { ref as sref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; import { httpsCallable } from 'firebase/functions'
import { auth, db, storage, functions } from '../lib/firebase'; import { resizeImage, safeName } from '../lib/files'
const uidOf = () => auth.currentUser?.uid
/* Autenticação: participantes usam somente Google; administradores continuam protegidos por custom claim no Firebase. */
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
/* Escolas (admin) */
export const setSchoolStatus = (id: string, status: string) => updateDoc(doc(db, 'schools', id), { status, statusBy: uidOf(), statusAt: serverTimestamp() })
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
export const reviewSubmission = (id: string, status: string, notes: string) => updateDoc(doc(db, 'submissions', id), { status, reviewNotes: notes, reviewedBy: uidOf(), reviewedAt: serverTimestamp(), history: arrayUnion({ at: Date.now(), status, notes, by: uidOf() }) })
/* Entrevistas */
export async function saveInterview(cur: any, f: any, file?: File) {
  const r = cur ? doc(db, 'interviews', cur.id) : doc(collection(db, 'interviews')); let image = cur?.image || '', imagePath = cur?.imagePath || ''
  if (file) { const blob = await resizeImage(file), path = `public/interviews/${r.id}/${Date.now()}-${safeName(file.name.replace(/\.[^.]+$/, ''))}.jpg`, s = sref(storage, path); await uploadBytes(s, blob, { contentType: 'image/jpeg' }); image = await getDownloadURL(s); if (imagePath) deleteObject(sref(storage, imagePath)).catch(() => {}); imagePath = path }
  const d = { title: f.title, participant: f.participant, category: f.category, date: f.date, content: f.content, image, imagePath, publicationStatus: f.publish ? 'published' : 'draft', updatedAt: serverTimestamp() }
  return cur ? updateDoc(r, d) : setDoc(r, { ...d, consent: true, consentAt: serverTimestamp(), createdAt: serverTimestamp() })
}
export async function deleteItem(col: string, item: any) { if (item.imagePath) await deleteObject(sref(storage, item.imagePath)).catch(() => {}); if (item.storagePath) await deleteObject(sref(storage, item.storagePath)).catch(() => {}); return deleteDoc(doc(db, col, item.id)) }
/* Documentos */
export async function saveDocument(cur: any, f: any, file?: File) {
  const r = cur ? doc(db, 'documents', cur.id) : doc(collection(db, 'documents')); let url = cur?.url || '', storagePath = cur?.storagePath || ''
  if (file) { if (file.type !== 'application/pdf') throw new Error('Selecione um arquivo PDF.'); if (file.size > 10 * 1024 * 1024) throw new Error('PDF acima de 10 MB.'); const path = `public/documents/${r.id}/${Date.now()}-${safeName(file.name)}`, s = sref(storage, path); await uploadBytes(s, file, { contentType: 'application/pdf' }); url = await getDownloadURL(s); if (storagePath) deleteObject(sref(storage, storagePath)).catch(() => {}); storagePath = path }
  if (!cur && !file) throw new Error('Anexe o arquivo PDF.')
  const d = { title: f.title, category: f.category, description: f.description, url, storagePath, updatedAt: serverTimestamp() }
  return cur ? updateDoc(r, d) : setDoc(r, { ...d, publicationStatus: 'draft', createdAt: serverTimestamp() })
}
/* Conteúdo e administradores */
export const saveContent = (c: any) => setDoc(doc(db, 'siteContent', 'main'), { ...c, updatedAt: serverTimestamp() }, { merge: true })
export const createAdmin = (d: { name: string; email: string }) => httpsCallable(functions, 'createAdmin')(d)
export const removeAdmin = (uid: string) => httpsCallable(functions, 'removeAdmin')({ uid })
export const resetContent = (field: string) => setDoc(doc(db, 'siteContent', 'main'), { [field]: deleteField() }, { merge: true })
export async function saveContentImage(field: string, file: File, oldPath?: string) {
  const blob = await resizeImage(file), path = `public/site/${field}/${Date.now()}.jpg`, s = sref(storage, path); await uploadBytes(s, blob, { contentType: 'image/jpeg' }); const url = await getDownloadURL(s)
  await saveContent({ [field]: url, [field + 'Path']: path }); if (oldPath) deleteObject(sref(storage, oldPath)).catch(() => {}) }
export async function removeContentImage(field: string, oldPath?: string) { if (oldPath) await deleteObject(sref(storage, oldPath)).catch(() => {}); return setDoc(doc(db, 'siteContent', 'main'), { [field]: deleteField(), [field + 'Path']: deleteField() }, { merge: true }) }
export async function saveGalleryItem(cur: any, caption: string, file?: File) {
  const r = cur ? doc(db, 'gallery', cur.id) : doc(collection(db, 'gallery')); let image = cur?.image || '', imagePath = cur?.imagePath || ''
  if (file) { const blob = await resizeImage(file), path = `public/gallery/${r.id}/${Date.now()}.jpg`, s = sref(storage, path); await uploadBytes(s, blob, { contentType: 'image/jpeg' }); image = await getDownloadURL(s); if (imagePath) deleteObject(sref(storage, imagePath)).catch(() => {}); imagePath = path }
  if (!image) throw new Error('Selecione uma foto.')
  const d = { caption, image, imagePath, updatedAt: serverTimestamp() }; return cur ? updateDoc(r, d) : setDoc(r, { ...d, createdAt: serverTimestamp() }) }
