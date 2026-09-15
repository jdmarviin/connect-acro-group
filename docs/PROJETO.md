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
| Administrador/trader | Cadastrar reuniões, iniciar pela própria conta Zoom e consultar indicadores e relatórios de leads |
| Administrador técnico | Consultar registros brutos e participantes não identificados no Payload |

Administradores também têm entradas, saídas e duração armazenadas. Seus registros ficam disponíveis para auditoria técnica, mas não entram nos painéis comerciais, ranking, contagem de participantes ou relatórios de leads. Um acesso direto ao relatório individual de um administrador retorna página não encontrada.

## 3. Jornada do lead

1. Acessa `/` ou `/auth` e escolhe entrar com Zoom.
2. O servidor cria um estado aleatório de autenticação e redireciona ao OAuth do Zoom.
3. O callback valida esse estado, troca o código pelo token e consulta o perfil do Zoom.
4. Se o e-mail ainda não existe, cria um usuário com papel `user`. A data de criação é definida pelo servidor.
5. Se já existe, reutiliza a conta e atualiza o vínculo Zoom, sem reiniciar os 30 dias. Um vínculo Zoom divergente é rejeitado.
6. Uma sessão autenticada em cookie HttpOnly permite usar a aplicação e a autenticação do Payload.
7. O lead preenche WhatsApp e o questionário sobre sua experiência, profissão, disponibilidade, objetivos e expectativas.
8. O painel apresenta reuniões agendadas e as que receberam o evento `meeting.started`.
9. Ao entrar em uma sala, o servidor verifica novamente sessão, cadastro completo, prazo e reunião cadastrada ao vivo.
10. O servidor emite uma assinatura de participante do Meeting SDK e um identificador aleatório para associar a presença ao usuário.
11. Os eventos do Zoom registram entrada e saída. O histórico passa a mostrar os dados confirmados no banco.

## 4. Regra dos 30 dias

- Início: `users.createdAt`, gravado no servidor no primeiro cadastro.
- Fim: início + 30 × 24 horas, independentemente do fuso do navegador.
- Condição: acesso permitido enquanto `agora < fim`.
- No instante do vencimento, novas autorizações são bloqueadas.
- Alterar o perfil, sair, entrar novamente ou refazer o cadastro complementar não renova o prazo.
- Administradores não têm limite de trial.
- O histórico continua acessível ao lead depois do vencimento.
- Não foi implementada cobrança, renovação paga ou extensão manual de acesso.

O bloqueio protege as autorizações emitidas pelo Connect. Uma assinatura já emitida possui janela de validade do SDK (30 minutos), e o vencimento não expulsa automaticamente alguém que já está na reunião. Links Zoom compartilhados fora da plataforma também precisam das restrições do próprio Zoom, como autenticação e sala de espera. Expulsão automática e controle de inscrições externas são evoluções separadas.

## 5. Jornada do trader

1. Um operador cria a primeira conta administrativa pelo comando `npm run admin:create`, configurando as variáveis de administração.
2. Usa o mesmo e-mail da conta Zoom do trader para permitir o vínculo no login OAuth.
3. Acessa `/admin/dashboard` e abre o formulário de agendamento.
4. Cria a reunião real na conta do Zoom e copia o link completo, incluindo `pwd` quando existir.
5. Preenche título, data e hora. O formulário converte o horário local do navegador para UTC.
6. O sistema valida o domínio e extrai o número da reunião. Não gera números de reunião fictícios.
7. No horário desejado, abre a reunião no Zoom autenticado como anfitrião.
8. O webhook `meeting.started` marca a ocorrência como ao vivo. O lead pode então entrar pelo painel.
9. Ao encerrar, `meeting.ended` marca a ocorrência como encerrada.
10. Consulta tempo assistido, ranking, relatório por reunião e evolução individual.
11. Escolhe manualmente se deseja contatar o lead pelos atalhos WhatsApp/e-mail.

O trader inicia a sala no aplicativo/site do Zoom. O player incorporado recebe papel de participante; não promete iniciar como host apenas com uma assinatura. O início como host pelo SDK exigiria também ZAK, conforme a [documentação de autorização do Zoom](https://developers.zoom.us/docs/meeting-sdk/auth/).

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
4. Criar a conta administrativa com `npm run admin:create`.
5. Configurar a URL de callback OAuth exatamente como `<APP_URL>/api/auth/zoom/callback`.
6. Habilitar a leitura do próprio perfil e as credenciais do Meeting SDK no aplicativo Zoom adequado.
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
- Cadastrar uma reunião real, iniciar como trader e confirmar o status ao vivo.
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
