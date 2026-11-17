Evolua — plataforma de pesquisa educacional
React + TypeScript + Vite + Tailwind no frontend; Firebase (Authentication, Firestore, Storage, Cloud Functions) no backend.
Sem dados de demonstração e sem logins fixos: tudo vem do seu projeto Firebase.
1. Criar o projeto Firebase
Em console.firebase.google.com, crie um projeto e adicione um app Web.
Ative Authentication > Google, Firestore (modo produção), Storage e, para as funções, o plano Blaze (pago por uso; há cota gratuita).
Copie .env.example para .env e preencha com as chaves do app Web. Escolha a região do Firestore e das funções de forma compatível (padrão das funções: us-central1; ajuste VITE_FUNCTIONS_REGION se mudar).
2. Instalar e publicar o backend
Plain Text
npm install
cd functions && npm install && cd ..
npm install -g firebase-tools && firebase login
firebase use --add            # escolha o projeto
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
3. Criar o primeiro administrador (uma vez)
Gere uma chave de serviço (Console > Configurações > Contas de serviço) e não a envie ao repositório:
Plain Text
GOOGLE_APPLICATION_CREDENTIALS=./chave-servico.json FIREBASE_PROJECT_ID=seu-projeto npm run make-admin -- admin@exemplo.com "SenhaForte123" "Nome"
Depois, outros administradores podem ser criados pela equipe responsável no Firebase/Cloud Function. Não existe login administrativo público nesta aplicação; a área de gestão continua protegida pelo custom claim admin.
Como escolher os administradores
Ative o provedor Google em Authentication > Sign-in method > Google.
Cada pessoa que será administradora deve entrar uma vez no site pelo botão Continuar com Google. Isso cria a conta no Firebase Authentication.
No servidor, configure as credenciais do Firebase Admin SDK e execute cd backend && npm install.
Promova a conta pelo e-mail: npm run set-admin -- pessoa@gmail.com. O comando grava admin: true nas custom claims, preserva outras claims e registra o perfil em adminProfiles.
Peça à pessoa para sair e entrar novamente com Google. Depois disso, ao entrar por /escolas, o custom claim direcionará a conta para a gestão.
Para remover alguém, execute npm run remove-admin -- pessoa@gmail.com. O Firebase Console permite localizar a conta em Authentication > Users, mas a custom claim admin deve ser alterada pelo Admin SDK; ela não deve ser simulada somente no React.
4. Rodar
npm run dev → http://localhost:5173
Para testar sem tocar no projeto real: VITE_USE_EMULATORS=true e npm run emulators (o script make-admin funciona com FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099).
5. Publicar o site
Vercel: importe o repositório, defina as mesmas variáveis VITE_* e faça o deploy (npm run build, pasta dist). Adicione o domínio em Authentication > Domínios autorizados.
Como funciona
Escola: entra com Google → o primeiro acesso cria um perfil pending usando os dados públicos da conta → admin aprova em Gestão > Escolas → escola preenche a pesquisa (rascunho/envio) → admin revisa (aprova, pede correção, rejeita).
Resultados públicos: a Cloud Function onSubmissionWrite recalcula, a partir de TODOS os envios aprovados, o documento aggregatedResults/{pesquisa}; abaixo de 5 envios aprovados nada é publicado. Respostas individuais nunca ficam públicas.
Segurança: papéis por custom claim (admin) e por documento schools/{uid}; regras em firestore.rules e storage.rules; escolas só acessam os próprios envios e não alteram campos de revisão; agregados, estatísticas e logs só são escritos por funções. O frontend não exibe nem oferece login administrativo.
Versionamento: editar as perguntas de uma pesquisa incrementa version; cada envio guarda a versão e as perguntas respondidas.
Conteúdo editável: Gestão > Conteúdo grava siteContent/main; entrevistas (com foto) e PDFs vão para o Storage.
Pendências recomendadas antes de coletar dados reais
Revisão jurídica/LGPD (termos de uso, política de privacidade, consentimento de menores), testes automatizados das regras com o Emulator Suite, revisão metodológica da pesquisa e domínio/e-mail institucional para os templates do Firebase Auth.
## Edição do site pelo administrador
Com o login administrativo, aparece o botão **Editar páginas** (canto inferior direito). Ligado, é possível, direto nas páginas:
- editar os textos (título e subtítulo da página inicial, apresentação, objetivos, justificativa, público, história, importância, agradecimentos) e **restaurar o texto padrão**;
- adicionar, trocar e remover a **foto de destaque** da página inicial;
- adicionar, editar a legenda, trocar e **excluir** fotos da **galeria** (página O projeto; também em Gestão > Galeria);
- adicionar, editar e excluir **perguntas frequentes**.
Tudo é gravado no Firestore (`siteContent/main`, `gallery`) e no Storage (`public/gallery`, `public/site`), então permanece salvo. Publique as regras novamente: `firebase deploy --only firestore:rules,storage`.
