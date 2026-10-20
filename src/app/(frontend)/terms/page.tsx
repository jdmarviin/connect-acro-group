import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-zinc-700 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Termos de Uso &bull; AcroGroup Connect</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Condições Gerais de Uso da Plataforma e da Integração Zoom</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              Vigência: 2026
            </span>
          </div>

          {/* Regional Disclaimer Note (Required by Zoom Marketplace) */}
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
            <strong>NOTE FOR REVIEWERS & USERS:</strong> These Terms of Use govern the AcroGroup Connect service primarily offered for Portuguese-speaking clients and members in Brazil. English clauses regarding Zoom developer terms and data protection compliance are explicitly stated below.
          </div>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Última atualização:</strong> Outubro de 2026
          </p>

          <p>
            Bem-vindo ao <strong>AcroGroup Connect</strong>. Estes Termos de Uso regulam o acesso e a utilização dos serviços disponibilizados pela <strong>ACRO GROUP LTDA</strong>, incluindo nosso portal web, salas virtuais de análise de mercado financeiro e a integração com os serviços da plataforma <strong>Zoom Video Communications, Inc.</strong>
          </p>
          <p>
            Ao criar uma conta, conectar sua conta Zoom ou acessar qualquer uma de nossas salas de transmissão, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a nossa <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
          </p>

          {/* 1. Objeto */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Descrição dos Serviços</h2>
            <p>
              O AcroGroup Connect é um ambiente digital desenvolvido para fornecer sessões de análise ao vivo de mercado, workshops educacionais e salas de operação para fins de estudo e treinamento financeiro.
            </p>
          </section>

          {/* 2. Integração Zoom */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Condições da Integração com o Zoom</h2>
            <p>
              Para acessar transmissões e salas de aula ao vivo, a plataforma utiliza as APIs e o Meeting SDK oficiais do Zoom:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Autorização Voluntária:</strong> O usuário autoriza a conexão através do fluxo OAuth oficial do Zoom diretamente a partir de nossa plataforma.</li>
              <li><strong>Subordinação aos Termos do Zoom:</strong> O uso dos recursos de videoconferência também está sujeito aos <a href="https://explore.zoom.us/pt-br/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Termos de Serviço do Zoom</a> e à sua Política de Privacidade.</li>
              <li><strong>Desconexão a Qualquer Momento:</strong> O usuário tem total liberdade para revogar a autorização da integração a qualquer momento pelo Zoom App Marketplace.</li>
            </ul>
          </section>

          {/* 3. Proibição Expressa de Uso Comercial / Marketing de Dados de Reunião (Compliance Zoom) */}
          <section className="p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-300 mb-2">3. Proteção e Não Comercialização de Dados de Reunião</h2>
            <p className="text-sm mb-3">
              Em estrito cumprimento às diretrizes de conformidade do <em>Zoom Marketplace Developer Agreement</em> e às legislações de proteção de dados (LGPD):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800 dark:text-gray-200">
              <li><strong>Finalidade Estrita:</strong> Dados técnicos e telemétricos obtidos a partir da API do Zoom (como horários de entrada, saída e minutos de presença) são utilizados <strong>exclusivamente</strong> para controle de acesso às salas, cálculo de frequência e verificação de participação em módulos educacionais.</li>
              <li><strong>Proibição de Vendas e Perfilamento Comercial:</strong> A ACRO GROUP não comercializa, não aluga e não transfere dados de participantes do Zoom para terceiros ou redes de publicidade. É estritamente proibido o uso de telemetria de reuniões para perfilamento comportamental com fins de vendas, publicidade direcionada ou scoring comercial de participantes.</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/60 text-xs italic text-blue-900 dark:text-blue-300">
              <strong>English Compliance Notice:</strong> Meeting telemetry and participant data obtained via Zoom APIs or webhooks are used solely for session operation and educational attendance verification. AcroGroup strictly prohibits the sale or use of Zoom participant data for marketing, advertising, sales profiling, or targeted promotions.
            </div>
          </section>

          {/* 4. Propriedade Intelectual e Conduta do Usuário */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Propriedade Intelectual e Normas de Conduta</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Todo o conteúdo visual, transmissões ao vivo, marcas e materiais analíticos disponibilizados nas salas são de propriedade exclusiva da ACRO GROUP ou de seus instrutores licenciados.</li>
              <li>É expressamente proibida a gravação, retransmissão, captura de tela, engenharia reversa ou distribuição não autorizada do sinal de áudio e vídeo das salas de operações.</li>
              <li>O usuário concorda em manter uma conduta respeitosa no chat e interações, sob pena de suspensão imediata de seu acesso.</li>
            </ul>
          </section>

          {/* 5. Isenção de Responsabilidade Financeira */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Isenção de Responsabilidade sobre Resultados Financeiros</h2>
            <p>
              As análises e comentários realizados durante as sessões ao vivo possuem <strong>finalidade estritamente educacional e informativa</strong>. A ACRO GROUP não faz recomendações diretas de compra ou venda de ativos financeiros nem garante lucros ou rentabilidade em operações de mercado. Cada usuário é inteiramente responsável por suas decisões financeiras e gestão de risco.
            </p>
          </section>

          {/* 6. Desconexão, Rescisão e Exclusão de Dados */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Rescisão, Desconexão e Exclusão de Dados</h2>
            <p>
              O usuário pode encerrar o uso da plataforma e revogar a integração com o Zoom a qualquer momento:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Para desconectar o Zoom: acesse o Zoom App Marketplace &gt; Manage &gt; Added Apps &gt; AcroGroup Connect &gt; Remove.</li>
              <li>Para solicitar a exclusão total da conta e dos dados pessoais: envie um e-mail para <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a>.</li>
            </ul>
          </section>

          {/* 7. Alterações destes Termos */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Atualizações dos Termos</h2>
            <p>
              A ACRO GROUP poderá atualizar estes Termos periodicamente para refletir alterações regulatórias, novas funcionalidades ou atualizações nas políticas do Zoom. Alterações relevantes serão comunicadas através da plataforma.
            </p>
          </section>

          {/* 8. Contato e Foro */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">ACRO GROUP LTDA</h3>
              <p className="text-sm">E-mail: <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a></p>
              <p className="text-sm text-gray-500">Website: <Link href="/" className="text-blue-600 hover:underline">acrotrader.com</Link></p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidade</Link>
              <Link href="/documentation" className="text-blue-600 hover:underline">Documentação</Link>
              <Link href="/support" className="text-blue-600 hover:underline">Central de Suporte</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
