# Evolua Backend

API REST em Node.js + JavaScript ESM + Express para o projeto Evolua. O backend usa o mesmo Firebase já preparado pelo frontend, mas mantém as credenciais administrativas exclusivamente no servidor.

## O que foi implementado

- `GET /health` para health check.
- Conteúdo público: conteúdo editável, entrevistas, documentos, pesquisas publicadas, resultados agregados e estatísticas públicas.
- Sessão: validação de Firebase ID token em `Authorization: Bearer <token>` e `GET /api/v1/me`.
- Cadastro de escola com conta de Authentication e documento `schools/{uid}` em estado `pending`.
- Área da escola: leitura de pesquisas publicadas, leitura de próprios envios e criação/edição de rascunhos ou envios pendentes.
- Área administrativa: escolas, aprovação/rejeição/suspensão, envios e revisão, pesquisas, conteúdo editável e administradores.
- CORS, Helmet, validação de payloads com Zod e respostas de erro padronizadas.
- Suporte aos emuladores Firebase por `FIRESTORE_EMULATOR_HOST` e `FIREBASE_AUTH_EMULATOR_HOST`.

## Configuração

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Preencha `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` e forneça credenciais de Admin SDK por `GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_SERVICE_ACCOUNT_JSON`. Nunca envie a chave de serviço ao Git ou ao frontend.

Para produção:

```bash
npm run build
npm start
```

A API inicia em `http://localhost:3001`. A especificação resumida está em `GET /api/v1/docs`.

## Autenticação

O frontend pode continuar usando Firebase Authentication e enviar o ID token obtido com `user.getIdToken()` para esta API. O backend verifica o token com `verifyIdToken(..., true)`, reconhece administradores pelo custom claim `admin` e reconhece escolas pelo documento `schools/{uid}`.

O endpoint de login com senha não foi duplicado no Node: a senha continua sendo tratada pelo Firebase Authentication, evitando armazenar ou implementar autenticação paralela. O endpoint de cadastro de escola existe para os casos em que o backend precise receber o formulário diretamente.

## Integração gradual

A versão atual do frontend já possui integração direta com Firebase em `src/services/api.ts`. A API REST foi criada como uma camada de servidor segura e pode ser adotada gradualmente por tela, substituindo chamadas diretas ao Firestore/Functions sem alterar o modelo de dados. Uploads de imagem e PDF continuam no Firebase Storage, conforme as regras já existentes.
