import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-zinc-700 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Central de Suporte &bull; AcroGroup Connect</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Atendimento ao Usuário e Suporte Técnico da Integração Zoom</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              Canais Oficiais
            </span>
          </div>

          {/* Regional Disclaimer Note (Required by Zoom Marketplace) */}
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
            <strong>NOTE FOR REVIEWERS & USERS:</strong> AcroGroup Connect provides user support primarily in Portuguese for members in Brazil, with English support available for international technical and compliance inquiries.
          </div>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-10 text-gray-700 dark:text-gray-300">
          
          {/* Section 1: Contact Information & SLA */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Canais de Atendimento e Horários (Contact & SLA)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="p-5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-base mb-1">E-mail de Suporte Oficial</h3>
                <p className="text-blue-800 dark:text-blue-200 font-mono text-sm">suporte@acrogroup.com.br</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">Para dúvidas técnicas, auxílio no login, problemas com salas ou solicitações de privacidade.</p>
              </div>

              <div className="p-5 rounded-lg bg-gray-50 dark:bg-zinc-700/40 border border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Horário de Operação & SLA</h3>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Segunda a Sexta, das 09h00 às 18h00 (Horário de Brasília)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Tempo médio de primeira resposta: até 24 horas úteis (máximo de 48 horas úteis).</p>
              </div>
            </div>
          </section>

          {/* Section 2: How to open a ticket */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">2. Como Solicitar Suporte Eficiente</h2>
            <p>Ao enviar sua mensagem para o suporte, por favor inclua as seguintes informações para agilizar o atendimento:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Nome completo e e-mail</strong> cadastrado na plataforma AcroGroup Connect;</li>
              <li><strong>E-mail da sua conta Zoom</strong> associada (se relevante);</li>
              <li><strong>Descrição detalhada do problema</strong> (qual ação tentou realizar e qual foi o comportamento);</li>
              <li><strong>Dispositivo e navegador</strong> utilizados (ex: Chrome no Windows, Safari no Mac);</li>
              <li><strong>Captura de tela (screenshot)</strong> de eventuais mensagens de erro, se houver.</li>
            </ul>
          </section>

          {/* Section 3: Frequently Asked Questions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Perguntas Frequentes sobre a Integração Zoom (FAQ)</h2>
            <div className="space-y-4 not-prose">
              
              <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                  Como autorizo ou conecto minha conta Zoom?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ao acessar a plataforma, clique em &quot;Entrar com Zoom&quot; ou acesse as configurações de perfil e clique em &quot;Conectar Zoom&quot;. Você será direcionado para a página oficial do Zoom para aceitar as permissões da integração.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                  Por que o sistema solicita permissões do Zoom?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Pedimos apenas os escopos mínimos necessários para identificar seu e-mail de login, permitir que o instrutor crie ou inicie a sala ao vivo e validar sua presença durante as transmissões. Não temos acesso aos seus arquivos pessoais, gravações privadas ou outros dados de reuniões fora do AcroGroup.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                  A sala de reunião não carrega ou fica em tela preta. O que fazer?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  1. Verifique se o seu navegador autorizou o uso de áudio e microfone.<br/>
                  2. Desative temporariamente extensões de bloqueio de anúncios (ad-blockers) que possam interferir na inicialização do Meeting SDK do Zoom.<br/>
                  3. Limpe o cache do navegador e recarregue a página.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                  Como desconectar ou revogar o acesso do AcroGroup no Zoom?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Você pode remover a integração a qualquer momento acessando o <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Zoom App Marketplace</a> &gt; <strong>Manage</strong> &gt; <strong>Added Apps</strong> &gt; localizar <em>AcroGroup Connect</em> e clicar em <strong>Remove</strong>.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                  Como solicitar a exclusão definitiva dos meus dados (Data Deletion)?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Para solicitar a exclusão de sua conta e de todos os registros de telemetria/presença armazenados, basta enviar um e-mail para <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a> com o assunto &quot;Exclusão de Dados Pessoais - LGPD/Zoom&quot;. Processaremos a remoção completa em até 5 dias úteis.
                </p>
              </div>

            </div>
          </section>

          {/* Section 4: Security Policy Notice */}
          <section className="p-5 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aviso de Segurança (Security Notice)</h2>
            <p className="text-sm">
              A equipe de suporte do AcroGroup <strong>nunca solicitará a sua senha</strong> da plataforma ou as credenciais da sua conta Zoom por e-mail, telefone ou WhatsApp. Jamais compartilhe suas senhas com terceiros.
            </p>
          </section>

          {/* Section 5: Footer & Links */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">AcroGroup Connect</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plataforma de Salas Virtuais e Análise de Mercado</p>
              <p className="text-sm text-gray-500">Website: <Link href="/" className="text-blue-600 hover:underline">acrotrader.com</Link></p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/documentation" className="text-blue-600 hover:underline">Documentação</Link>
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacidade</Link>
              <Link href="/terms" className="text-blue-600 hover:underline">Termos de Uso</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
