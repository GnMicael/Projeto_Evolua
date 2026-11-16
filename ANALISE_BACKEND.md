# Análise técnica do Evolua

## Situação encontrada

O projeto é um frontend React + JavaScript + Vite + Tailwind. A versão enviada já tinha uma integração Firebase bastante avançada: Authentication para login, Firestore para escolas, pesquisas, envios, conteúdo, entrevistas e documentos, Storage para arquivos e Cloud Functions para agregados públicos, auditoria e administração de contas.

As chamadas estavam concentradas em `src/services/api.ts` e as leituras em tempo real em `src/services/hooks.ts`. Portanto, não era necessário criar outro modelo de dados ou outra autenticação; o risco principal seria duplicar regras e deixar credenciais administrativas no navegador.

## Solução criada

Foi adicionada a pasta `backend/`, um serviço Node.js + JavaScript ESM + Express que usa o Firebase Admin SDK. O servidor valida Firebase ID tokens, reconhece o custom claim `admin`, consulta o perfil `schools/{uid}` e aplica autorização específica para escola aprovada e gestão.

A API cobre os fluxos públicos, cadastro de escola, sessão/perfil, área da escola, revisão de envios, escolas, pesquisas, conteúdo editável e administradores. A API não recebe o login comum com senha: o Firebase Authentication continua responsável por essa etapa, e o Node valida o token emitido pelo Firebase. Isso evita uma segunda base de senhas e mantém a compatibilidade com o frontend atual.

Uploads continuam no Storage, porque o projeto já tem regras e funções para arquivos. A camada REST foi preparada para adoção gradual sem quebrar a integração Firebase existente.

## Segurança e operação

As credenciais administrativas ficam fora do código, por `GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_SERVICE_ACCOUNT_JSON`. O backend inclui Helmet, CORS configurável, limite de JSON, validação com Zod, respostas de erro padronizadas e health check. O Storage é inicializado de forma lazy, então o serviço pode subir para endpoints que não usam arquivos mesmo antes de preencher o bucket.

## Validação executada

O backend passou em `npm run build`, `GET /health` e `GET /api/v1/docs`. O frontend original também passou no build de produção do Vite.
