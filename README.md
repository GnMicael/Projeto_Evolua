# Evolua — plataforma de pesquisa educacional

React + TypeScript + Vite + Tailwind no frontend; Firebase (Authentication, Firestore, Storage, Cloud Functions) no backend.
Sem dados de demonstração e sem logins fixos: tudo vem do seu projeto Firebase.

## 1. Criar o projeto Firebase
1. Em console.firebase.google.com, crie um projeto e adicione um app **Web**.
2. Ative **Authentication > E-mail/senha**, **Firestore** (modo produção), **Storage** e, para as funções, o plano **Blaze** (pago por uso; há cota gratuita).
3. Copie `.env.example` para `.env` e preencha com as chaves do app Web.
   Escolha a região do Firestore e das funções de forma compatível (padrão das funções: `us-central1`; ajuste `VITE_FUNCTIONS_REGION` se mudar).

## 2. Instalar e publicar o backend
```
npm install
cd functions && npm install && cd ..
npm install -g firebase-tools && firebase login
firebase use --add            # escolha o projeto
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

## 3. Criar o primeiro administrador (uma vez)
Gere uma chave de serviço (Console > Configurações > Contas de serviço) e **não a envie ao repositório**:
```
GOOGLE_APPLICATION_CREDENTIALS=./chave-servico.json FIREBASE_PROJECT_ID=seu-projeto npm run make-admin -- admin@exemplo.com "SenhaForte123" "Nome"
```
Depois, outros administradores são criados em Gestão > Administradores (usa Cloud Function). Não existe cadastro público de administradores.

## 4. Rodar
`npm run dev` → http://localhost:5173
Para testar sem tocar no projeto real: `VITE_USE_EMULATORS=true` e `npm run emulators` (o script make-admin funciona com `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`).

## 5. Publicar o site
Vercel: importe o repositório, defina as mesmas variáveis `VITE_*` e faça o deploy (`npm run build`, pasta `dist`). Adicione o domínio em Authentication > Domínios autorizados.

## Como funciona
- **Escola**: cria conta (status `pending`) → admin aprova em Gestão > Escolas → escola preenche a pesquisa (rascunho/envio) → admin revisa (aprova, pede correção, rejeita).
- **Resultados públicos**: a Cloud Function `onSubmissionWrite` recalcula, a partir de TODOS os envios aprovados, o documento `aggregatedResults/{pesquisa}`; abaixo de 5 envios aprovados nada é publicado. Respostas individuais nunca ficam públicas.
- **Segurança**: papéis por custom claim (`admin`) e por documento `schools/{uid}`; regras em `firestore.rules` e `storage.rules`; escolas só acessam os próprios envios e não alteram campos de revisão; agregados, estatísticas e logs só são escritos por funções.
- **Versionamento**: editar as perguntas de uma pesquisa incrementa `version`; cada envio guarda a versão e as perguntas respondidas.
- **Conteúdo editável**: Gestão > Conteúdo grava `siteContent/main`; entrevistas (com foto) e PDFs vão para o Storage.

## Pendências recomendadas antes de coletar dados reais
Revisão jurídica/LGPD (termos de uso, política de privacidade, consentimento de menores), testes automatizados das regras com o Emulator Suite, revisão metodológica da pesquisa e domínio/e-mail institucional para os templates do Firebase Auth.
