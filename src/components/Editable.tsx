import { useState, ReactNode } from 'react'; import { collection } from 'firebase/firestore'; import { Pencil, Trash2, Plus, ImagePlus, X } from 'lucide-react'
import { db } from '../lib/firebase'; import { useCol, useContent } from '../services/hooks'; import { useEdit } from '../contexts/EditContext'; import * as api from '../services/api'; import { run, notify } from '../lib/constants'; import { DEFAULT_FAQ } from '../lib/defaults'
const box = 'rounded-xl border-2 border-dashed border-brand bg-sky/40 p-3'
/* Texto editável no próprio site (somente administradores em modo de edição) */
export function EditableText({ field, as, className = '', render }: { field: string; as?: any; className?: string; render?: (v: string) => ReactNode }) {
  const T: any = as || 'p'; const ct = useContent(); const { editing } = useEdit(); const v = String(ct[field] ?? ''); const [open, setOpen] = useState(false); const [d, setD] = useState(v); const [busy, setBusy] = useState(false)
  const body = render ? render(v) : <T className={className}>{v}</T>
  if (!editing) return <>{body}</>
  if (open) return (<div className={box}><textarea className="field !mb-2 min-h-[110px]" value={d} onChange={e => setD(e.target.value)} />{field === 'thanks' && <p className="mb-2 text-xs text-slate-500">Um nome por linha.</p>}
    <div className="flex flex-wrap gap-2"><button className="btn-p btn-s" disabled={busy} onClick={async () => { setBusy(true); if (await run(() => api.saveContent({ [field]: d.trim() }), 'Alteração salva.')) setOpen(false); setBusy(false) }}>Salvar</button><button className="btn-o btn-s" onClick={() => setOpen(false)}>Cancelar</button>
      <button className="btn-o btn-s !text-red-700" onClick={async () => { if (confirm('Voltar ao texto padrão do site?')) { await run(() => api.resetContent(field), 'Texto padrão restaurado.'); setOpen(false) } }}>Restaurar padrão</button></div></div>)
  return (<div className="relative rounded-xl outline-dashed outline-2 outline-offset-4 outline-brand/40 hover:outline-brand">{body}<button className="btn-y btn-s absolute -top-5 right-0 shadow" onClick={() => { setD(v); setOpen(true) }}><Pencil size={13} />Editar</button></div>)
}
/* Foto única do site (ex.: foto de destaque da página inicial) */
export function EditableImage({ field, className = '' }: { field: string; className?: string }) {
  const ct = useContent(); const { editing } = useEdit(); const url = ct[field], path = ct[field + 'Path']
  if (!editing) return url ? <img src={url} alt="" className={className} /> : null
  return (<div className="mb-5">{url ? <img src={url} alt="" className={className} /> : <div className="grid h-44 place-items-center rounded-2xl border-2 border-dashed border-brand/50 text-sm text-slate-500">Nenhuma foto de destaque</div>}
    <div className="mt-2 flex gap-2"><label className="btn-y btn-s cursor-pointer"><ImagePlus size={13} />{url ? 'Trocar foto' : 'Adicionar foto'}<input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await run(() => api.saveContentImage(field, f, path), 'Foto salva.') }} /></label>
      {url && <button className="btn-o btn-s !text-red-700" onClick={() => confirm('Remover esta foto?') && run(() => api.removeContentImage(field, path), 'Foto removida.')}><Trash2 size={13} />Remover</button>}</div></div>)
}
/* Perguntas frequentes editáveis (adicionar, editar e excluir) */
export function Faq() {
  const ct = useContent(); const { editing } = useEdit(); const items: any[] = Array.isArray(ct.faq) ? ct.faq : DEFAULT_FAQ; const [ed, setEd] = useState<number | null>(null); const [q, setQ] = useState(''); const [a, setA] = useState('')
  const save = async (i: number) => { if (!q.trim() || !a.trim()) return notify('Preencha a pergunta e a resposta.', 'err'); const l = [...items]; l[i] = { q: q.trim(), a: a.trim() }; if (await run(() => api.saveContent({ faq: l }), 'Pergunta salva.')) setEd(null) }
  const editor = (i: number) => (<div key={'e' + i} className={box + ' my-3'}><input className="field" placeholder="Pergunta" value={q} onChange={e => setQ(e.target.value)} /><textarea className="field min-h-[80px]" placeholder="Resposta" value={a} onChange={e => setA(e.target.value)} /><div className="flex gap-2"><button className="btn-p btn-s" onClick={() => save(i)}>Salvar</button><button className="btn-o btn-s" onClick={() => setEd(null)}>Cancelar</button></div></div>)
  return (<div className="max-w-3xl">{items.map((it, i) => ed === i ? editor(i) : <details key={i} className="border-b border-slate-200 py-4"><summary className="cursor-pointer font-semibold text-navy">{it.q}</summary><p className="mt-2 text-slate-600">{it.a}</p>
    {editing && <div className="mt-3 flex gap-2"><button className="btn-o btn-s" onClick={() => { setEd(i); setQ(it.q); setA(it.a) }}><Pencil size={13} />Editar</button><button className="btn-o btn-s !text-red-700" onClick={() => confirm('Excluir esta pergunta?') && run(() => api.saveContent({ faq: items.filter((_, j) => j !== i) }), 'Pergunta excluída.')}><Trash2 size={13} />Excluir</button></div>}</details>)}
    {ed === items.length && editor(items.length)}{editing && ed === null && <button className="btn-y btn-s mt-4" onClick={() => { setEd(items.length); setQ(''); setA('') }}><Plus size={13} />Adicionar pergunta</button>}</div>)
}
/* Galeria de fotos do projeto */
export function Gallery({ forceEdit = false }: { forceEdit?: boolean }) {
  const { editing } = useEdit(); const ed = editing || forceEdit; const r = useCol<any>(collection(db, 'gallery'), []); const list = [...r.data].sort((x: any, y: any) => (x.createdAt?.seconds || 0) - (y.createdAt?.seconds || 0))
  const [big, setBig] = useState<any>(null); const [cap, setCap] = useState<any>(null); const [busy, setBusy] = useState(false)
  const add = async (e: any) => { e.preventDefault(); const fm = e.target; setBusy(true); const ok = await run(() => api.saveGalleryItem(null, fm.caption.value.trim(), fm.photo.files[0]), 'Foto adicionada.'); setBusy(false); if (ok) fm.reset() }
  if (!ed && !list.length) return null
  const content = (<>
    {ed && <form onSubmit={add} className={box + ' mb-6 flex flex-wrap items-end gap-3'}><label className="text-sm font-semibold">Foto<input name="photo" type="file" accept="image/*" required className="field !mb-0" /></label><label className="min-w-[220px] flex-1 text-sm font-semibold">Legenda (opcional)<input name="caption" className="field !mb-0" /></label><button className="btn-p" disabled={busy}><Plus size={16} />{busy ? 'Enviando…' : 'Adicionar foto'}</button></form>}
    {!list.length ? <p className="text-slate-500">Nenhuma foto ainda.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p: any) => <figure key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button type="button" className="block w-full" onClick={() => setBig(p)}><img src={p.image} alt={p.caption || ''} loading="lazy" className="aspect-[4/3] w-full object-cover" /></button>
      <figcaption className="p-3 text-sm text-slate-600">{cap?.id === p.id ? <div className="flex gap-2"><input className="field !mb-0 !py-2" value={cap.text} onChange={e => setCap({ id: p.id, text: e.target.value })} /><button className="btn-p btn-s" onClick={async () => { if (await run(() => api.saveGalleryItem(p, cap.text.trim()), 'Legenda salva.')) setCap(null) }}>OK</button><button className="btn-o btn-s" onClick={() => setCap(null)}><X size={13} /></button></div> : (p.caption || (ed ? <span className="text-slate-400">Sem legenda</span> : null))}
        {ed && cap?.id !== p.id && <div className="mt-2 flex flex-wrap gap-2"><button className="btn-o btn-s" onClick={() => setCap({ id: p.id, text: p.caption || '' })}><Pencil size={13} />Legenda</button><label className="btn-o btn-s cursor-pointer"><ImagePlus size={13} />Trocar<input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await run(() => api.saveGalleryItem(p, p.caption || '', f), 'Foto trocada.') }} /></label><button className="btn-o btn-s !text-red-700" onClick={() => confirm('Excluir esta foto?') && run(() => api.deleteItem('gallery', p), 'Foto excluída.')}><Trash2 size={13} />Excluir</button></div>}</figcaption></figure>)}</div>}
    {big && <div className="fixed inset-0 z-[60] grid place-items-center bg-navy/80 p-4" onClick={() => setBig(null)}><figure className="max-w-4xl" onClick={e => e.stopPropagation()}><img src={big.image} alt={big.caption || ''} className="max-h-[80vh] rounded-xl" />{big.caption && <figcaption className="mt-2 text-center text-sm text-white">{big.caption}</figcaption>}</figure></div>}</>)
  if (forceEdit) return content
  return <section className="py-14"><div className="mx-auto max-w-6xl px-6"><span className="eyebrow">Galeria</span><h2 className="mb-6 mt-2 text-3xl font-bold text-navy">Momentos do projeto</h2>{content}</div></section>
}
