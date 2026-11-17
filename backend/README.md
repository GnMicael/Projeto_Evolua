# Scripts de administrador do Evolua

Esta pasta **não é um servidor**. É só um conjunto de comandos que rodam na sua máquina, com o Firebase Admin SDK,
para escolher quem é administrador. Não precisa do plano Blaze, nem de hospedagem, nem de deploy.

Quem é administrador? Toda conta Google com a *custom claim* `admin: true`. As regras do Firestore e o site leem essa claim.
Por segurança, ela só pode ser definida com o Admin SDK, por isso **não existe tela no site para isso**.

## Pré-requisitos
1. A pessoa entrou uma vez no site com **Continuar com Google** (cria a conta no Authentication).
2. Chave de serviço: Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada.
   Guarde fora do repositório (ex.: `C:\chaves\evolua-chave.json`).

## Comandos (PowerShell, dentro da pasta `backend`)
```powershell
npm install

$env:GOOGLE_APPLICATION_CREDENTIALS="C:\chaves\evolua-chave.json"
$env:FIREBASE_PROJECT_ID="evolua-8faa4"

npm run set-admin -- pessoa@gmail.com      # promove
npm run remove-admin -- pessoa@gmail.com   # remove a permissão
npm run list-admins                        # lista quem é admin agora
```
As duas linhas `$env:` valem só para aquele terminal. Em vez delas, você pode copiar `.env.example` para `.env` e preencher.

Depois de promover ou remover, a pessoa precisa **sair e entrar de novo** com o Google para o token se atualizar.
