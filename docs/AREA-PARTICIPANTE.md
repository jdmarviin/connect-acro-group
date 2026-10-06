# Área do participante

As páginas do participante usam o visual escuro/azul da landing e uma navegação lateral. No celular, o botão do cabeçalho abre um menu modal com foco de teclado contido. O seletor PT/HT é preservado, com crioulo como idioma padrão.

## Rotas

- `/dashboard`: resumo de participação, gráfico dos últimos 7/14/30 dias, progresso dos 30 dias de teste, reuniões disponíveis e participações recentes.
- `/dashboard/reunioes`: salas abertas, recorrentes e agendadas.
- `/dashboard/historico`: histórico pesquisável, agrupado por ocorrência Zoom (reconexões não contam como reuniões distintas).
- `/dashboard/historico/[id]`: entradas e saídas de uma ocorrência do próprio usuário.
- `/dashboard/pesquisas`: questionários pendentes e respostas enviadas, incluindo o cadastro inicial.
- `/dashboard/diario/[id]`: resposta do questionário ou leitura das respostas já enviadas.
- `/dashboard/produtos`: produtos disponíveis.

Os gráficos e contagens usam dados reais. O tempo exibido considera sessões com entrada e saída confirmadas. Um registro sem saída permanece pendente. Usuários com teste expirado continuam podendo consultar histórico e pesquisas; alunos ativos não recebem indicação de teste expirado.

## Questionário diário

A migração `20261006000000_daily_reflections.sql` é obrigatória para estas páginas. Ela acrescenta `reflection_day` às atribuições de formulários e um índice único por `(user_id, reflection_day)`. Aplicar pelo fluxo normal: `npm run supabase:status` e `npm run supabase:migrate`.

A criação acontece no banco quando existe uma entrada confirmada e:

- o Zoom confirma a saída do participante; ou
- a reunião é encerrada com horário de fim confirmado.

Apenas abrir a sala, entrar ou aguardar o anfitrião não cria questionário. O dia é o da saída (ou encerramento), no fuso `America/Sao_Paulo`, consistente com os horários exibidos no sistema. Reconexões, múltiplas reuniões, reenvios de webhook e alteração da versão do formulário não criam um segundo questionário para o mesmo usuário/dia. Outra pessoa recebe sua própria atribuição.

O redirecionamento de saída abre `/dashboard/pesquisas?afterMeeting=1`. Essa página consulta atualizações enquanto o webhook pode estar a caminho; a URL não cria questionários e não comprova presença. O envio continua pelo RPC `submit_form`, protegido por RLS, autenticação, janela de resposta e bloqueio de reenvio após submissão.

A migração preserva respostas anteriores e seus dados: a primeira resposta de cada dia é vinculada à atribuição diária, e respostas históricas adicionais continuam consultáveis. Notificações antigas de diário são marcadas como lidas e substituídas por um aviso diário deduplicado.
