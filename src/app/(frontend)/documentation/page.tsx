import React from 'react';
import Link from 'next/link';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-zinc-700 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentação da Integração Zoom</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">AcroGroup Connect &bull; Guia de Uso, Permissões e Suporte</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              Versão 1.2
            </span>
          </div>
          
          {/* Regional Disclaimer Note (Required by Zoom Marketplace) */}
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
            <strong>NOTE FOR REVIEWERS & USERS:</strong> This application is specifically designed and offered for Portuguese-speaking clients and members of AcroGroup in Brazil. The application interface, documentation, and live trading room sessions are primarily conducted in Portuguese. English summaries are provided below for international review compliance.
          </div>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-10 text-gray-700 dark:text-gray-300">
          
          {/* Section 1: Overview */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">1. Visão Geral da Integração (Overview)</h2>
            <p>
              O <strong>AcroGroup Connect</strong> integra-se à plataforma <strong>Zoom</strong> para fornecer uma experiência fluida e segura em salas de operações ao vivo e sessões de análise de mercado financeiro.
            </p>
            <p>
              A integração permite que instrutores autorizados agendem e iniciem sessões diretamente pelo painel administrativo e que os participantes inscritos acessem a transmissão ao vivo pelo navegador, utilizando o Zoom Meeting SDK integrado, além de registrar a presença e duração de participação de forma automatizada por meio de Webhooks oficiais.
            </p>
          </section>

          {/* Section 2: Prerequisites */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">2. Pré-requisitos (Prerequisites)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Conta no AcroGroup:</strong> Cadastro ativo e validado na plataforma AcroGroup Connect.</li>
              <li><strong>Conta Zoom:</strong> Uma conta Zoom válida para anfitriões (instrutores) que irão conduzir salas.</li>
              <li><strong>Navegador Compatível:</strong> Versões recentes do Google Chrome, Microsoft Edge, Mozilla Firefox ou Apple Safari com permissões de áudio e microfone habilitadas.</li>
            </ul>
          </section>

          {/* Section 3: Installation & Authorization */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">3. Instalação e Autorização OAuth (Installation & Authorization)</h2>
            <p>A autorização é iniciada diretamente pelo nosso site (<em>From your Site</em>):</p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>Acesse <Link href="/" className="text-blue-600 hover:underline font-medium">acrotrader.com</Link> e faça login em sua conta.</li>
              <li>No painel principal ou no menu lateral, clique em <strong>&quot;Entrar com Zoom&quot;</strong> ou <strong>&quot;Conectar Zoom&quot;</strong>.</li>
              <li>Você será redirecionado para a tela oficial de consentimento OAuth do Zoom.</li>
              <li>Analise as permissões solicitadas e clique em <strong>&quot;Autorizar&quot;</strong>.</li>
              <li>Após a confirmação, você será redirecionado automaticamente de volta para o painel do AcroGroup Connect.</li>
            </ol>
          </section>

          {/* Section 4: Scopes & Permissions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">4. Permissões Solicitadas e Justificativas (Scopes & Justifications)</h2>
            <p>
              Seguindo o princípio do menor privilégio (<em>Least Privilege</em>), o AcroGroup Connect solicita exclusivamente os escopos necessários para a operação das salas:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/80">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Escopo (Scope)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Finalidade no Sistema (Purpose)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">user:read:email</td>
                    <td className="px-4 py-3">Identificação do e-mail do usuário para autenticação e vinculação de conta.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">user:read:user</td>
                    <td className="px-4 py-3">Consulta ao perfil do anfitrião e ao Personal Meeting ID (PMI) para vincular à sala permanente.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">user:read:zak</td>
                    <td className="px-4 py-3">Geração segura do token ZAK (Zoom Access Key) para permitir que o instrutor inicie a sessão como anfitrião no Meeting SDK.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">meeting:read:meeting</td>
                    <td className="px-4 py-3">Consulta aos parâmetros e status da reunião para exibição no painel dos participantes.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">meeting:write:meeting</td>
                    <td className="px-4 py-3">Criação de novas reuniões agendadas pelo painel do instrutor e cancelamento de sessões canceladas.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Usage Guide */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">5. Guia de Uso da Plataforma (Usage Guide)</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-700/40 border border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">Para Instrutores e Administradores (Hosts):</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Acesse o painel em <Link href="/admin/dashboard" className="text-blue-600 hover:underline">/admin/dashboard</Link>.</li>
                  <li>Clique em <strong>&quot;Criar reunião&quot;</strong> para agendar uma nova sessão (o sistema criará a reunião via API Zoom com sala de espera ativa).</li>
                  <li>Inicie a sessão pela própria plataforma: o sistema gerará a assinatura segura e o token ZAK para atribuir a função de anfitrião automaticamente.</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-700/40 border border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">Para Participantes e Alunos:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Acesse o painel em <Link href="/dashboard" className="text-blue-600 hover:underline">/dashboard</Link>.</li>
                  <li>Localize a reunião ao vivo e clique em <strong>&quot;Entrar&quot;</strong>.</li>
                  <li>A sala será carregada diretamente no navegador via Zoom Meeting SDK, sem necessidade de instalar aplicativos externos.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6: Webhooks & Telemetry */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">6. Eventos de Webhook e Frequência (Webhooks & Attendance)</h2>
            <p>O AcroGroup Connect consome exclusivamente 4 eventos oficiais do Zoom para gerenciar o ciclo de vida das salas:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><code className="text-xs bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">meeting.started</code>: Identifica quando o instrutor abre a sala e libera a entrada dos alunos.</li>
              <li><code className="text-xs bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">meeting.ended</code>: Encerra a transmissão e arquiva a ocorrência da sessão.</li>
              <li><code className="text-xs bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">meeting.participant_joined</code>: Registra o horário de entrada do participante para fins de presença.</li>
              <li><code className="text-xs bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">meeting.participant_left</code>: Registra a saída e calcula a duração de participação na sessão.</li>
            </ul>
            <p className="mt-3 text-sm italic">
              <strong>Garantia de Privacidade:</strong> Os dados de telemetria são restritos ao controle de presença e duração nas sessões educacionais. Nenhum dado é comercializado ou utilizado para perfilamento de publicidade.
            </p>
          </section>

          {/* Section 7: Uninstallation & Deauthorization */}
          <section className="p-5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">7. Como Desconectar ou Desinstalar a Integração (Uninstallation & Deauthorization)</h2>
            <p className="mb-3">
              Você pode desconectar ou desinstalar o AcroGroup Connect a qualquer momento diretamente pelo <strong>Zoom App Marketplace</strong>:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Faça login na sua conta do Zoom e acesse o <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Zoom App Marketplace</a>.</li>
              <li>No canto superior direito, clique em <strong>Manage</strong> &gt; <strong>Added Apps</strong> (ou pesquise por <em>AcroGroup Connect</em>).</li>
              <li>Localize o aplicativo <strong>AcroGroup Connect</strong> na lista e clique em <strong>&quot;Remove&quot;</strong>.</li>
              <li>Confirme a remoção na caixa de diálogo que será exibida.</li>
            </ol>
            <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/60 text-sm">
              <strong>Política de Retenção e Exclusão de Dados pós-desinstalação:</strong>
              <p className="mt-1">
                Ao desinstalar o aplicativo, todos os tokens de autorização OAuth (access tokens e refresh tokens) são imediatamente revogados e apagados dos nossos servidores. Dados históricos de presença em reuniões anteriores permanecem armazenados conforme nossa Política de Privacidade para fins de registro e auditoria, ou podem ser permanentemente excluídos mediante solicitação ao suporte.
              </p>
            </div>
          </section>

          {/* Section 8: Troubleshooting & Support */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">8. Solução de Problemas Comuns (Troubleshooting)</h2>
            <div className="space-y-3 text-sm">
              <div>
                <strong>A reunião exibe &quot;Aguardando o administrador iniciar&quot;:</strong>
                <p className="text-gray-600 dark:text-gray-400">Por segurança, a entrada de participantes só é liberada assim que o instrutor inicia a transmissão oficial.</p>
              </div>
              <div>
                <strong>Erro de microfone ou câmera no navegador:</strong>
                <p className="text-gray-600 dark:text-gray-400">Verifique o ícone de cadeado na barra de endereços do navegador e confirme se as permissões de Microfone e Câmera estão marcadas como &quot;Permitir&quot;.</p>
              </div>
              <div>
                <strong>Falha na autorização OAuth:</strong>
                <p className="text-gray-600 dark:text-gray-400">Tente limpar os cookies do navegador ou abrir em uma aba anônima. Caso persista, entre em contato com nossa equipe de suporte.</p>
              </div>
            </div>
          </section>

          {/* Section 9: Contact and Legal Links */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Central de Suporte AcroGroup</h3>
              <p className="text-sm">E-mail: <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a></p>
              <p className="text-sm text-gray-500">Horário de atendimento: Segunda a Sexta, das 09h às 18h (BRT). Resposta em até 24-48 horas úteis.</p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidade</Link>
              <Link href="/terms" className="text-blue-600 hover:underline">Termos de Uso</Link>
              <Link href="/support" className="text-blue-600 hover:underline">Central de Suporte</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
