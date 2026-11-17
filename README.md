# Evolua — plataforma de pesquisa educacional

React + TypeScript + Vite + Tailwind. Backend 100% gratuito no Firebase **plano Spark**: Authentication (Google) + Firestore + Hosting.
Não usa Cloud Functions nem Cloud Storage (os dois exigem o plano Blaze).

## 1. Criar o projeto Firebase (gratuito)
1. Em console.firebase.google.com crie o projeto e adicione um app Web.
2. Authentication → Sign-in method → ative **Google**.
3. Firestore Database → criar (modo produção).
4. Copie `.env.example` para `.env` e preencha com as chaves do app Web.

## 2. Instalar e publicar
```bash
npm install
npm install -g firebase-tools && firebase login
firebase use evolua-8faa4
npm run deploy        # build + regras/índices do Firestore + Hosting
```
Em Authentication → Configurações → Domínios autorizados, adicione o domínio do site (`evolua-8faa4.web.app` já vem autorizado).
Se preferir Vercel, importe o repositório, defina as variáveis `VITE_*` e faça o deploy (`vercel.json` já tem o fallback de rotas); lembre de autorizar o domínio.
Para publicar só as regras: `firebase deploy --only firestore`.

## 3. Definir administradores (somente por script)
Administrador = conta Google com a claim `admin`. Não há tela no site para isso. Veja [`backend/README.md`](./backend/README.md):
```powershell
cd backend
npm install
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\chaves\evolua-chave.json"
$env:FIREBASE_PROJECT_ID="evolua-8faa4"
npm run set-admin -- pessoa@gmail.com
```
A pessoa precisa ter entrado antes com Google e deve sair e entrar de novo depois de promovida.

## 4. Rodar localmente
`npm run dev` → http://localhost:5173. Para testar sem tocar no projeto real: `VITE_USE_EMULATORS=true` e `npm run emulators`.

## Como funciona
- **Escola**: entra com Google → cadastro `pending` (o nome inicial vem da conta Google) → administrador aprova em Gestão › Escolas → escola preenche e envia → administrador revisa.
- **Edição do cadastro da escola**: em Gestão › Escolas o administrador pode **Editar cadastro** (nome, responsável, e-mail) ou **Liberar edição**. Com a edição liberada, a escola vê o formulário em Perfil (ou na tela de aguardando aprovação) e, ao salvar, a liberação é encerrada. O administrador pode **Bloquear edição** a qualquer momento.
- **Resultados públicos**: sem Cloud Functions, o painel recalcula `aggregatedResults/{pesquisa}` ao aprovar um envio, e `publicStats/summary` ao mudar a situação de uma escola. Abaixo de 5 envios aprovados nada é publicado (também exigido pelas regras). O botão **Recalcular resultados** (Gestão › Painel) refaz tudo se algo ficar fora de sincronia.
- **Auditoria**: o painel grava `auditLogs` com cada revisão/ação sobre escolas.
- **Fotos**: reduzidas no navegador (JPEG, até ~330 KB) e guardadas no Firestore (galeria, entrevistas, foto de destaque).
- **PDFs**: hospedados fora (ex.: Google Drive com "Qualquer pessoa com o link"); o Firestore guarda só o link.
- **Segurança**: papéis por claim `admin` e por documento `schools/{uid}`; regras em `firestore.rules`. Respostas individuais nunca ficam públicas.

## Limites do plano gratuito (Spark)
Firestore: 50 mil leituras/dia, 20 mil gravações/dia e 1 GiB armazenados (as fotos contam). Hosting: 10 GB armazenados e 360 MB/dia de transferência. Suficiente para o porte do projeto; acompanhe em Firebase Console › Uso.

## Pendências antes de coletar dados reais
Revisão jurídica/LGPD, testes das regras no Emulator Suite, revisão metodológica e e-mail institucional para os templates do Firebase Auth.
