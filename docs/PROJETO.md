# Connect — projeto de ponta a ponta

## 1. Objetivo e escopo

O Connect permite que um trader acompanhe quanto tempo cada lead permanece em suas reuniões de operações no Zoom. O lead recebe 30 dias gratuitos a partir da criação da conta. O trader consulta o interesse demonstrado e decide quem contatar para oferecer seus produtos.

O sistema registra presença, não resultados financeiros, atenção visual, intenção de compra comprovada ou rentabilidade. O tempo é uma medida de participação e auxilia a decisão comercial.

**Decisão de escopo:** notificações pelo sistema/navegador, WhatsApp e e-mail serão implementadas separadamente. Nenhum desses canais está enviando avisos nesta entrega. O início e o encerramento das reuniões já são registrados para permitir essa integração futura.

## 2. Perfis

| Perfil | Funcionalidades |
| --- | --- |
| Visitante | Conhecer o produto e iniciar autenticação com Zoom |
| Lead ativo | Completar cadastro, consultar reuniões, entrar em reunião ao vivo e ver seu histórico |
| Lead expirado | Entrar na conta e consultar o histórico; não recebe nova autorização de reunião |
| Owner (único) | Administrar o sistema, conectar sua sala pessoal padrão e criar/iniciar reuniões |
| Administrador/trader | Criar reuniões no Zoom pelo sistema, iniciar salas cadastradas e consultar indicadores e relatórios de leads |
| Administrador técnico | Consultar registros brutos e participantes não identificados no Payload |

Owners e administradores também têm entradas, saídas e duração armazenadas. Seus registros ficam disponíveis para auditoria técnica, mas não entram nos painéis comerciais, ranking, contagem de participantes ou relatórios de leads. Um acesso direto ao relatório individual de um administrador retorna página não encontrada.

## 3. Jornada do lead

1. Acessa `/` ou `/auth` e escolhe entrar com Zoom.
2. O servidor cria um estado aleatório de autenticação e redireciona ao OAuth do Zoom.
3. O callback valida esse estado, troca o código pelo token e consulta o perfil do Zoom.
4. Se o e-mail ainda não existe, cria um usuário com papel `user`. A data de criação é definida pelo servidor.
5. Se já existe, reutiliza a conta e atualiza o vínculo Zoom, sem reiniciar os 30 dias. Um vínculo Zoom divergente é rejeitado.
6. Uma sessão autenticada em cookie HttpOnly permite usar a aplicação e a autenticação do Payload.
7. O lead preenche WhatsApp e o questionário sobre sua experiência, profissão, disponibilidade, objetivos e expectativas.
8. O painel apresenta primeiro a sala pessoal do owner, além das reuniões agendadas e recorrentes sem data fixa, compartilhadas com todos os leads ativos.
9. Ao entrar em uma sala, o servidor verifica sessão, cadastro e prazo. Se o administrador ainda não iniciou, exibe uma espera que consulta o estado a cada cinco segundos. O evento `meeting.started` libera a entrada automaticamente.
10. O servidor emite uma assinatura de participante do Meeting SDK e um identificador aleatório para associar a presença ao usuário.
11. Os eventos do Zoom registram entrada e saída. O histórico passa a mostrar os dados confirmados no banco.

### Microfone: segurar para falar

No player do Connect, participantes, admins e owner entram sem transmitir áudio. Depois de conectar o áudio e autorizar o microfone, devem manter o botão **Segure para falar** pressionado com mouse ou toque; com o botão em foco, também podem segurar Espaço ou Enter. Soltar, perder o foco, trocar de aba ou cancelar o toque fecha o microfone. Um clique não mantém o áudio aberto.

A regra vale também para salas pessoais e reuniões já cadastradas quando abertas no player. Reuniões novas são criadas com `mute_upon_entry` no Zoom. Quem entra pelo aplicativo externo do Zoom usa os controles desse aplicativo; o Connect não impõe seu botão nesse caminho.

## 4. Regra dos 30 dias

- Início: `users.createdAt`, gravado no servidor no primeiro cadastro.
- Fim: início + 30 × 24 horas, independentemente do fuso do navegador.
- Condição: acesso permitido enquanto `agora < fim`.
- No instante do vencimento, novas autorizações são bloqueadas.
- Alterar o perfil, sair, entrar novamente ou refazer o cadastro complementar não renova o prazo.
- Owners e administradores não têm limite de trial.
- O histórico continua acessível ao lead depois do vencimento.
- Não foi implementada cobrança, renovação paga ou extensão manual de acesso.

O bloqueio protege as autorizações emitidas pelo Connect. Uma assinatura já emitida possui janela de validade do SDK (30 minutos), e o vencimento não expulsa automaticamente alguém que já está na reunião. Links Zoom compartilhados fora da plataforma também precisam das restrições do próprio Zoom, como autenticação e sala de espera. Expulsão automática e controle de inscrições externas são evoluções separadas.

## 5. Jornada do trader

1. Um operador define `OWNER_EMAIL` e executa `npm run owner:create`. O comando promove a conta existente com esse e-mail ou cria uma conta com `OWNER_PASSWORD`. O banco impede um segundo owner; o painel não permite excluir nem rebaixar o proprietário.
2. O owner entra com Zoom e autoriza perfil, leitura/criação/exclusão de reuniões e leitura do token ZAK. O sistema importa seu PMI como sala permanente sem data fixa, exibida primeiro no painel.
3. Outros administradores são criados pelo owner no painel técnico `/admin/collections/users` ou pelo comando `npm run admin:create`.
4. Em `/admin/meetings/new`, o administrador informa título, tipo (agendada ou recorrente sem data fixa) e duração. O horário local é convertido para UTC.
5. O servidor cria a reunião real pela API Zoom na conta conectada do administrador, com entrada antes do host desabilitada e sala de espera habilitada. A reunião fica visível para todos os leads ativos. Falhas são exibidas; uma falha de persistência tenta desfazer apenas a reunião recém-criada.
6. Owner ou admin pode iniciar uma sala cadastrada pelo sistema. O servidor obtém o ZAK da conta anfitriã vinculada e emite assinatura SDK com papel 1 apenas para gestores. Participantes recebem papel 0.
7. `meeting.started` libera a sala para participantes. Ao encerrar uma sala permanente, ela volta ao estado de espera; cada chamada ganha um registro de ocorrência com UUID próprio.
8. O painel administrativo mostra salas, histórico de chamadas, ranking e relatórios. O relatório da sala permanente agrega as ocorrências; o de uma chamada considera seu UUID.
9. O lead vê a contagem de dias, horas e minutos restantes, a data de expiração e seu histórico de presenças confirmadas, mesmo após vencer o trial.

Reuniões legadas sem conta anfitriã vinculada continuam podendo ser iniciadas pelo aplicativo Zoom. O sistema não fornece ZAK para uma conta diferente do anfitrião registrado. A entrada como host usa [assinatura e ZAK conforme o Zoom](https://developers.zoom.us/docs/meeting-sdk/web/client-view/meetings-webinars/).

## 6. Coleta de presença

A fonte oficial é `/api/webhooks/zoom`:

- `meeting.participant_joined`: registra a entrada.
- `meeting.participant_left`: registra a saída e calcula os minutos.
- `meeting.started` e `meeting.ended`: atualizam a disponibilidade da reunião.

A assinatura HMAC e a idade da requisição são verificadas. Um recibo único no banco e uma transação impedem que reenvios confirmados contem duas vezes. Uma saída recebida antes da entrada pode ser reconciliada; entradas repetidas da mesma sessão não abrem novos registros.

A identificação prioriza o `customer_key` emitido pelo servidor para o SDK, depois o identificador permanente da conta Zoom e, como alternativa, o e-mail. Não associa usuários por nome, pois pessoas diferentes podem ter o mesmo nome. O `user_id` da conexão Zoom identifica a participação na reunião, não a conta permanente.

Cada reconexão tem seu próprio intervalo. O UUID distingue ocorrências do mesmo número Zoom. Quando falta uma saída, o tempo permanece pendente; o sistema não supõe que o lead ficou até o encerramento. Eventos brutos permanecem no painel técnico para investigação.

O endpoint antigo que aceitava duração enviada pelo navegador retorna `410`. Registros antigos `web-sdk-*` são preservados e excluídos dos indicadores. Dados antigos sem UUID usam reunião + dia de Brasília como compatibilidade; reuniões repetidas no mesmo dia não podem ser separadas com precisão sem recuperar os dados originais.

Referência dos campos e eventos: [Webhooks de reuniões do Zoom](https://developers.zoom.us/docs/api/meetings/events/).

## 7. Indicadores comerciais

| Indicador | Cálculo |
| --- | --- |
| Tempo assistido | Soma dos minutos confirmados das sessões do lead |
| Pontuação | `min(100, round(minutos / 600 × 100))` |
| Frio | Menos de 180 minutos |
| Morno | De 180 até menos de 420 minutos |
| Quente | 420 minutos ou mais |
| Ranking | Maior tempo assistido primeiro, inclusive acima de 600 minutos |
| Leads ativos | Usuários com papel `user` e prazo ainda válido |
| Participantes por reunião | Leads identificados distintos; reconexões não aumentam essa contagem |

A pontuação usa uma referência fixa de 600 minutos; não é a porcentagem da duração das reuniões oferecidas. Pessoas sem vínculo confirmado ficam fora das métricas, para evitar misturar convidados ou administradores desconhecidos com os leads.

Os tempos acumulam todos os registros válidos do lead. Sessões simultâneas em dois dispositivos são somadas como participações; deduplicar intervalos sobrepostos por pessoa é uma possível evolução, caso o negócio queira medir tempo cronológico único.

## 8. Telas e rotas

| Rota | Finalidade |
| --- | --- |
| `/` e `/auth` | Apresentação e login Zoom |
| `/onboarding` | Questionário inicial |
| `/dashboard` | Trial, reuniões reais e histórico próprio |
| `/reuniao/:zoomId` | Sala incorporada, com autorização no servidor |
| `/reuniao/:zoomId/relatorio` | Presença do usuário autenticado, armazenada no banco |
| `/admin/dashboard` | Ranking e indicadores comerciais |
| `/admin/meetings/new` | Cadastro de reunião real |
| `/admin/meetings/:id` | Presença e tempo por lead na reunião |
| `/admin/users/:id` | Relatório individual de um lead |
| `/admin` | Painel técnico Payload |

O antigo feed social demonstrativo redireciona ao painel. O histórico fictício e o relatório baseado apenas no armazenamento local do navegador foram substituídos.

## 9. Configuração operacional

1. Instalar Node.js 22, dependências e disponibilizar PostgreSQL dedicado.
2. Copiar as variáveis de `.env.example` para `.env` com valores do ambiente.
3. Aplicar `npm run db:migrate` inicialmente em homologação; não usar sincronização automática de esquema em produção.
4. Configurar o owner com `npm run owner:create` e os admins com `npm run admin:create`.
5. Configurar a URL de callback OAuth exatamente como `<APP_URL>/api/auth/zoom/callback`.
6. Habilitar leitura de perfil/PMI, leitura/criação/exclusão de reuniões e leitura de ZAK; habilitar o Meeting SDK no mesmo aplicativo Zoom. O sistema usa `ZOOM_CLIENT_ID` como `sdkKey` e `ZOOM_CLIENT_SECRET` como `sdkSecret`, compartilhando o par com OAuth. Reautorizar owner e admins após mudar os escopos.
7. Configurar a URL HTTPS pública `<APP_URL>/api/webhooks/zoom`, o segredo de assinatura e os quatro eventos usados.
8. Garantir que o app monitore a conta que realmente hospeda as reuniões. Definir `ZOOM_ACCOUNT_ID` permite restringir a origem da conta.
9. Confirmar as autorizações/distribuição do SDK para as contas envolvidas; um app de desenvolvimento pode ter restrições impostas pelo Zoom.
10. Compilar com `npm run build` e iniciar com `npm start`.

O desenvolvimento local precisa de um endereço HTTPS acessível pelo Zoom para receber eventos. Não basta o browser abrir `localhost`. Se o evento de início não chegar, a sala não aparece como ao vivo.

## 10. Homologação antes de liberar clientes

- Fazer login com uma conta nova e verificar 30 dias, questionário e redirecionamento ao painel.
- Repetir login na mesma conta e confirmar que o início do trial não muda.
- Usar dados sintéticos de uma conta expirada; verificar bloqueio na página e na API de assinatura.
- Tentar endpoints administrativos sem login e como lead: acesso negado.
- Criar uma reunião real pelo sistema, iniciar como trader e confirmar o status ao vivo.
- Sincronizar o PMI do owner, entrar em espera como lead, iniciar/encerrar duas chamadas e confirmar que o histórico separa ambas.
- Confirmar que tentativa de criar segundo owner falha e que admin não altera nem remove o owner.
- Entrar como lead pelo SDK por aproximadamente 1 minuto, sair, reentrar e sair novamente.
- Conferir no banco o UUID, o vínculo do usuário, os intervalos e os minutos.
- Confirmar que o trader tem presença armazenada e não aparece em nenhum indicador comercial.
- Reenviar um evento assinado e confirmar que não duplica a presença.
- Confirmar que um participante sem identidade permanece na auditoria, sem associação por nome.
- Encerrar a sala, verificar o status e testar novamente o acesso.
- Conferir erros visíveis de credenciais ausentes e comunicação com o Zoom.

Testes automatizados cobrem as regras e cenários sintéticos, mas não substituem essa homologação da conta Zoom, do domínio público e do banco de implantação.

## 11. Entrega futura: notificações

Implementar como módulo separado, sem bloquear a gravação de presença. Ao confirmar o início da ocorrência, criar uma tarefa única por lead ativo e canal. Entregar aviso interno/navegador, WhatsApp e e-mail, respeitando as preferências e as permissões de cada canal.

A documentação do backend detalha fila, tentativas, deduplicação e confirmação de entrega. Ainda serão necessários os provedores, credenciais, domínio de e-mail e configuração do WhatsApp. Não há envio automático ativo no código desta etapa.
