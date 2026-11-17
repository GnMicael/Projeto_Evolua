# Evolua — pendências

## Feito (versão gratuita, plano Spark)
- [x] Somente Firebase Authentication (Google) + Firestore + Hosting. Sem Cloud Functions e sem Storage (ambos exigem Blaze).
- [x] Resultados públicos (`aggregatedResults`), `publicStats` e `auditLogs` gravados pelo painel do administrador.
- [x] Fotos reduzidas e guardadas no Firestore; PDFs por link (Drive etc.).
- [x] Administradores definidos só por script (`backend/`), sem tela no site.
- [x] Edição do cadastro das escolas: administrador edita; escola edita quando o administrador libera.

## Antes de coletar dados reais
- [ ] Revisão jurídica/LGPD (termos de uso, política de privacidade, consentimento de menores).
- [ ] Testar as regras com o Emulator Suite (`npm run emulators`).
- [ ] Revisão metodológica da pesquisa.
- [ ] Domínio/e-mail institucional para os templates do Firebase Auth.
