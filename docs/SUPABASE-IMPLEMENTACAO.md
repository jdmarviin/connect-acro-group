# Implementação Supabase

O projeto de destino é `vlktqilzuvawrkyyunge`. O modelo ativo usa `connect` para os dados da aplicação e `private` para credenciais, eventos brutos, auditoria e mapeamento legado. As tabelas antigas em `public` foram preservadas, mas o site não executa mais Payload.

As seis migrations e a importação foram aplicadas. A verificação remota confirmou 34 tabelas com RLS, isolamento de perfis, proteção de papéis/trial, Zoom Auth habilitado e Data API `connect` exposta sem acesso anônimo. A sexta migration retira das funções `anon`/`authenticated` o acesso às tabelas legadas, sem apagá-las.

## Entregas no código

- Seis migrations SQL versionadas: estrutura do plano, RLS, workflows, formulários iniciais, preservação dos totais históricos e bloqueio da API do legado.
- Login Zoom pelo Supabase Auth, callback PKCE, renovação de sessão e logout.
- As credenciais OAuth do Zoom são removidas dos cookies antes de persistir a sessão; credenciais de hosts ficam criptografadas em `private.zoom_credentials`.
- Adaptador de leitura para preservar os painéis existentes, aplicando RLS com a identidade autenticada.
- Criação/sincronização de salas Zoom, emissão de tickets e webhook transacional no modelo novo.
- Onboarding normalizado, formulário diário por ocorrência, histórico de respostas e observações administrativas.
- Avisos internos persistentes e leitura individual.
- Gestão de produtos com checkout externo.
- Estrutura de cursos, módulos, aulas, matrículas, progresso, pedidos e transações. Aulas respeitam matrícula e regras de liberação.
- Rotinas para atualizar progresso e liberar matrículas quando um serviço confiável confirma um pedido.
- Script de importação do Payload com simulação, mapa de IDs e reconciliação das presenças.

Pagamentos externos, envio por WhatsApp/e-mail/Web Push, player de cursos, comunidade e gamificação continuam como fases futuras do plano. As tabelas de suporte não significam que esses provedores estejam integrados.

## Regras adotadas

- Trial: 30 dias a partir do cadastro original; importação/login não reiniciam o prazo.
- Onboarding: obrigatório e imutável após o envio.
- Diário: uma versão atribuída por ocorrência encerrada; opcional, sem prazo de expiração.
- Respondem os participantes identificados que têm entrada registrada naquela ocorrência.
- Reflexões são liberadas também em dias sem operação. O encerramento da reunião, não o resultado financeiro, determina sua criação.
- Presenças incompletas não ganham duração inventada. Registros antigos ambíguos preservam número Zoom, UUID e minutos originais sem associação arbitrária.
- Nenhum job de expurgo foi ativado; eventos e tickets permanecem até definir retenção.
- Segundos usam `numeric(16,4)` para preservar frações históricas.
- As versões antigas arredondavam algumas presenças para minutos inteiros. Relatórios priorizam `legacy_duration_minutes` nos registros importados, mantendo os segundos calculados para auditoria; novas sessões usam segundos exatos.

## Configuração

Variáveis necessárias:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://vlktqilzuvawrkyyunge.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave pública>
SUPABASE_SECRET_KEY=<chave administrativa apenas para importação>
DATABASE_URI=<URI PostgreSQL do projeto>
ZOOM_TOKEN_ENCRYPTION_KEY=<segredo aleatório estável>
```

`DATABASE_URI` é a conexão PostgreSQL do servidor; neste ambiente usa o Session pooler. `PAYLOAD_SECRET` só é usado pelo importador para recriptografar tokens antigos, não pelo site. `LEGACY_DATABASE_URI` é opcional quando a origem for diferente de `DATABASE_URI`.

1. No Supabase, habilitar Zoom em Authentication → Sign In / Providers. Usar o mesmo aplicativo Zoom de `ZOOM_CLIENT_ID` e `ZOOM_CLIENT_SECRET` para que a renovação de tokens funcione.
2. No aplicativo Zoom, autorizar `https://vlktqilzuvawrkyyunge.supabase.co/auth/v1/callback`. Preservar os escopos necessários a criação de reuniões, PMI e ZAK.
3. Em Authentication → URL Configuration, configurar a URL do Connect e permitir `<APP_URL>/api/auth/zoom/callback` como redirect.
4. Em Settings → Data API, adicionar o schema `connect` aos schemas expostos. Nunca expor `private`.
5. Manter o webhook no endpoint `<APP_URL>/api/webhooks/zoom`.

O acesso ao banco privado usa PostgreSQL pelo servidor. A Data API usa a sessão Supabase com RLS. Nenhuma chave administrativa é enviada ao navegador.

## Comandos

```sh
npm run supabase:inspect
npm run supabase:status
npm run supabase:test
npm run supabase:migrate
npm run supabase:import
npm run supabase:import -- --apply
npm run supabase:verify
npm run typecheck
npm run lint
npm test
npm run build
```

`supabase:status` apenas mostra migrations pendentes. `supabase:import` sem `--apply` apenas inspeciona a origem.

As migrations são registradas em `private.connect_migrations` com checksum. Alterar uma migration já aplicada é rejeitado; mudanças posteriores devem usar outro arquivo. A configuração local da CLI fica em `supabase/config.toml`; os formulários são inseridos pela migration e não por um seed exclusivo de desenvolvimento.

O importador cria/reutiliza identidades pela API administrativa Auth, sem escrever diretamente nas tabelas gerenciadas. Cada lote de dados de negócio é transacional. Uma falha pode deixar identidades Auth criadas, mas a repetição reutiliza essas identidades e o mapa de IDs.

A importação deve ocorrer antes do corte, em janela sem mudanças no legado. Não repita uma importação depois que usuários começarem a escrever no modelo novo: ela é destinada à migração, não à sincronização contínua.

## Estado atual e recuperação

Supabase é o único backend. `DATA_BACKEND` não alterna mais a implementação. Reiniciar/reimplantar a aplicação após instalar as dependências atualizadas. O login real de owner/lead e uma reunião Zoom ainda precisam de homologação no navegador.

As rotas/API Payload foram removidas. O painel próprio continua em `/admin/dashboard`; usuários em `/admin/usuarios` e produtos em `/admin/produtos`. O diário aparece no dashboard após o encerramento de uma ocorrência com presença identificada.

O código anterior está em `legacy/payload/`, excluído da compilação. Uma recuperação exige restaurar código/dependências e reconciliar dados escritos após a migração; mudar uma variável não restaura o legado. Não excluir as tabelas antigas durante a homologação. O futuro CMS da landing page não está implementado.

## Resultado da importação

- 4 usuários e suas identidades Auth; trial original preservado.
- 2 cadastros antigos de reunião normalizados em 1 sala e 1 ocorrência.
- 22 presenças, 79,8666 minutos históricos, 31 tickets e 34 eventos.
- 1 credencial de host recriptografada e 1 produto.
- 2 respostas de onboarding e 1 atribuição de diário.
- 20 presenças antigas sem vínculo inequívoco com a ocorrência ficaram preservadas sem associação forçada. Seus metadados e minutos continuam disponíveis; não geram elegibilidade de diário por aproximação.

Detalhes de desempenho e cuidados com o iCloud: [OTIMIZACAO-PERFORMANCE.md](OTIMIZACAO-PERFORMANCE.md).

## Validação

Os testes de banco executam as migrations reais em PostgreSQL embarcado. Apenas `auth.users`, `auth.uid()` e os papéis gerenciados pelo Supabase são simulados.

Cobertura: isolamento de usuários, segredo privado, trial imutável, owner único/protegido, onboarding atômico, perguntas publicadas imutáveis, diário e presença atrasada, deduplicação/reconexão/ordem invertida de webhooks, remoção de tokens Zoom dos cookies e matrícula/progresso de cursos.

Ainda é necessária a homologação com chamadas Zoom reais para confirmar escopos e entrega dos eventos. Testes sintéticos não simulam autorização externa do provedor.

Referências usadas: [Auth SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Zoom Auth](https://supabase.com/docs/guides/auth/social-login/auth-zoom) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
