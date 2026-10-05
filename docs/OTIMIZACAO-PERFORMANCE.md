# Otimização e remoção do Payload — 02/10/2026

## Backend atual

Supabase é o único backend da aplicação. O Payload foi retirado da configuração do Next, das dependências, das rotas, da autenticação, das ações administrativas e do processamento de webhooks. `DATA_BACKEND` não alterna mais o backend.

Os arquivos antigos foram preservados em `legacy/payload/`, fora da compilação e do lint. Nenhuma tabela antiga em `public` foi apagada. Recuperar o legado exige restaurar código/dependências e reconciliar as escritas novas; não basta mudar uma variável.

O CMS de conteúdo da landing page fica para uma etapa futura, separado da aplicação. Não foi implementado nesta alteração.

## Mudanças de desempenho

- Autenticação, perfil e cliente Supabase reaproveitados dentro de cada renderização com `React.cache`; nenhum cache global de dados de usuários.
- Visitantes sem cookie de sessão não fazem requisições ao Supabase Auth.
- Landing page não espera autenticação/banco: a personalização da conta carrega depois por `/api/auth/me`, que mantém os cookies renovados sem bloquear a página pública.
- Removida a renderização dinâmica obrigatória do layout inteiro.
- Consultas independentes dos dashboards executadas em paralelo.
- Transações RLS mantêm a identidade por transação e reduzem uma ida ao banco.
- Total de presença por usuário calculado uma vez, evitando varrer todas as presenças para cada lead.
- Avisos, diários e histórico administrativo carregam sem bloquear os demais conteúdos.
- Estados de carregamento nas navegações do painel.
- Login compartilha o layout do frontend, evitando navegação entre raízes separadas.
- Atualizações periódicas não disparam outra renderização enquanto a anterior está pendente.
- SDK Zoom/Redux não utilizados removidos das dependências: o player existente continua em `/zoom.html`.

## Lentidão do ambiente local

Durante a análise, o servidor de desenvolvimento retornou a landing page em aproximadamente **14,14 segundos**. Essa é uma medição pontual, não um benchmark de produção.

Também foram encontrados arquivos `compressed,dataless` no diretório sincronizado pelo iCloud. O build falhou com `ETIMEDOUT` ao ler `src/app/auth/layout.tsx`. Isso é um problema de disponibilidade dos arquivos locais, independente do backend.

Marcar a pasta como **Manter Baixado** no Finder ou desenvolver em uma pasta fora do iCloud. Evitar executar builds/typecheck simultâneos, pois o build recria `.next/types`.

O antigo `node_modules.icloud-backup` permanece preservado e ignorado. A instalação atual foi refeita sem Payload; não depende mais do link temporário usado durante a migração.

## Conferência

```sh
npm install
npm test
npm run build
npm run typecheck
npm run lint
npm run supabase:verify
npm run start -- --port 3100
```

Comparar requisições frias e aquecidas separadamente, usando o build de produção. O login real no Zoom e uma reunião com entrada/saída ainda exigem homologação no navegador.

### Resultado observado

Uma cópia temporária dos mesmos fontes, fora do iCloud, passou em **28 testes**, build de produção, typecheck e lint (somente o aviso existente de `<img>` na listagem de produtos). Compilação: 5,4 s na primeira execução e 3,0 s com cache.

No servidor de produção local dessa cópia, a landing retornou em 92 ms na primeira requisição e 14/12/39 ms nas seguintes. Isso não é uma comparação equivalente aos 14,14 s do servidor de desenvolvimento original, nem uma garantia de tempo em produção remota.

Smoke HTTP aprovado: landing 200; sessão anônima `user:null` com `no-store`; assinatura Zoom/onboarding sem login 401; API antiga `/api/users` 404; `/admin` encaminha ao painel; código OAuth na raiz encaminha ao callback.

A verificação remota também confirmou que nenhuma das tabelas antigas continua acessível sem RLS pelas funções anônima/autenticada.

## Correção do retorno de login

O diagnóstico encontrou códigos OAuth emitidos, mas nenhuma sessão criada: os destinos registrados no Supabase apontavam para a raiz `http://localhost:3000/`. O código anterior também forçava o endereço público do ngrok mesmo quando o login começava em localhost.

O login agora mantém origem e cookies no mesmo host (localhost no desenvolvimento, domínio público configurado no acesso pelo túnel). Um código recebido por engano na raiz é encaminhado ao callback local. Falhas de troca de sessão são exibidas na tela de login, sem expor códigos ou tokens.

Em Supabase → Authentication → URL Configuration → Redirect URLs, cadastrar os callbacks completos para cada origem utilizada:

- `http://localhost:3000/api/auth/zoom/callback`
- `<NEXT_PUBLIC_APP_URL>/api/auth/zoom/callback`

No Zoom, o redirect continua sendo `https://vlktqilzuvawrkyyunge.supabase.co/auth/v1/callback`. Após ajustar, iniciar um novo login e não trocar de domínio durante o fluxo. Ver [configuração oficial de redirecionamentos](https://supabase.com/docs/guides/auth/redirect-urls).
