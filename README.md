# Connect · Acro Group

Sistema para um trader acompanhar a presença dos leads nas reuniões do Zoom durante 30 dias de acesso gratuito e priorizar o contato comercial pelo tempo assistido.

## Documentação

- [Projeto de ponta a ponta](docs/PROJETO.md): produto, fluxos, regras, operação e homologação.
- [Estrutura do backend](docs/BACKEND.md): arquitetura, dados, APIs, segurança, migração e evolução.

## Executar

Requisitos: Node.js 22, npm e PostgreSQL. Configure as variáveis do `.env.example` em `.env`, usando uma base de desenvolvimento.

```sh
npm ci
npm run db:migrate
npm run admin:create
npm run dev
```

`admin:create` exige `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo de 12 caracteres). O acesso comercial fica em `/admin/dashboard`; o painel técnico do Payload em `/admin`.

## Verificar

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Os testes usam dados sintéticos. Não iniciam reuniões nem enviam mensagens aos leads. As notificações pelo sistema/navegador, WhatsApp e e-mail ficaram para uma implementação separada, conforme solicitado.

Antes de usar com clientes, aplique a migração em homologação e execute o roteiro de reunião real do documento do projeto. O webhook precisa de uma URL HTTPS pública e das assinaturas configuradas no Zoom.
