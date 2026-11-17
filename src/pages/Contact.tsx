import { Instagram, Mail } from 'lucide-react'; import { Page } from '../components/ui'; import { CONTACT } from '../lib/evoluaData'
export default function Contact() {
  return (<Page eyebrow="Contato" title="Fale com o Evolua" lead="Quer conhecer melhor o projeto, levar a iniciação científica para sua escola ou tirar uma dúvida? Escreva para a gente.">
    <div className="grid gap-5 md:grid-cols-2">
      <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="card-i flex items-start gap-4"><span className="ico"><Instagram size={22} strokeWidth={1.8} /></span><span><b className="block text-navy">Instagram oficial</b><span className="text-slate-600">{CONTACT.instagramHandle}</span><span className="mt-3 block"><span className="btn-p btn-s">Abrir Instagram</span></span></span></a>
      <a href={'mailto:' + CONTACT.email} className="card-i flex items-start gap-4"><span className="ico"><Mail size={22} strokeWidth={1.8} /></span><span className="min-w-0"><b className="block text-navy">E-mail do projeto</b><span className="break-all text-slate-600">{CONTACT.email}</span><span className="mt-3 block"><span className="btn-p btn-s">Enviar e-mail</span></span></span></a></div></Page>)
}
