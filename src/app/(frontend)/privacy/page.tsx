import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-zinc-700 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Política de Privacidade &bull; AcroGroup Connect</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Tratamento de Dados Pessoais e Integração com o Zoom</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              LGPD & Zoom Compliance
            </span>
          </div>

          {/* Regional Disclaimer Note (Required by Zoom Marketplace) */}
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
            <strong>NOTE FOR REVIEWERS & USERS:</strong> This Privacy Policy applies to the AcroGroup Connect service primarily offered for Portuguese-speaking clients in Brazil. English declarations regarding Zoom data protection, retention, and non-disclosure to third parties are explicitly outlined below.
          </div>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Última atualização:</strong> Outubro de 2026
          </p>

          <p>
            A <strong>ACRO GROUP LTDA</strong> está firmemente comprometida com a privacidade, transparência e proteção dos dados pessoais de seus usuários. Esta Política de Privacidade descreve de forma clara como tratamos, armazenamos e protegemos as informações coletadas através do <strong>AcroGroup Connect</strong> e na utilização dos recursos integrados ao <strong>Zoom Video Communications, Inc.</strong>
          </p>

          {/* 1. Informações que Coletamos */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Informações que Coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados Cadastrais:</strong> Nome completo, endereço de e-mail e dados de perfil fornecidos voluntariamente durante a criação de conta no AcroGroup Connect.</li>
              <li><strong>Dados de Autenticação do Zoom (OAuth):</strong> Ao autorizar a integração, recebemos seu identificador de usuário Zoom (Zoom User ID) e o endereço de e-mail associado para validar sua sessão. Para anfitriões (instrutores), solicitamos o Personal Meeting ID (PMI) e tokens temporários ZAK para iniciar salas.</li>
              <li><strong>Telemetria e Presença em Reuniões (Webhooks):</strong> Registramos dados operacionais fornecidos pelos webhooks do Zoom: horários de início e encerramento da sala, e horários de entrada e saída dos participantes, permitindo calcular o tempo de participação.</li>
            </ul>
          </section>

          {/* 2. Como Usamos as Informações */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Finalidade do Tratamento de Dados</h2>
            <p>Os dados coletados são tratados estritamente para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Permitir o login único (SSO) seguro e a criação de conta na plataforma;</li>
              <li>Viabilizar a transmissão de salas de aula e análises ao vivo pelo Zoom Meeting SDK;</li>
              <li>Calcular a frequência e participação do aluno nos módulos educacionais;</li>
              <li>Prestar suporte técnico e operacional através de nossa equipe.</li>
            </ul>
          </section>

          {/* 3. Declaração Estrita de Não Comercialização e Não Perfilamento (Zoom Compliance) */}
          <section className="p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-300 mb-2">3. Não Comercialização e Não Compartilhamento para Publicidade</h2>
            <p className="text-sm mb-2">
              Em total conformidade com as diretrizes do <em>Zoom App Marketplace</em> e a Lei Geral de Proteção de Dados (LGPD):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800 dark:text-gray-200">
              <li><strong>Não vendemos e não alugamos dados:</strong> A ACRO GROUP jamais vende, transfere ou licencia dados pessoais ou dados obtidos do Zoom para corretores de dados (data brokers) ou terceiros.</li>
              <li><strong>Proibição de Publicidade e Perfilamento Comercial:</strong> Dados obtidos da API ou de reuniões do Zoom não são utilizados para publicidade comportamental, direcionamento de anúncios, perfilamento comercial ou treinamento de modelos de inteligência artificial de terceiros.</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/60 text-xs italic text-blue-900 dark:text-blue-300">
              <strong>English Privacy & Compliance Statement:</strong> AcroGroup does not sell, rent, or monetize Zoom user data or meeting telemetry. Zoom participant data is never utilized for targeted advertising, marketing funnels, sales profiling, or third-party AI training.
            </div>
          </section>

          {/* 4. Segurança e Armazenamento dos Dados */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Segurança e Criptografia</h2>
            <p>
              Adotamos práticas robustas de segurança da informação:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tokens de acesso OAuth e segredos de salas são armazenados criptografados em repouso no banco de dados utilizando padrão avançado AES-256-GCM.</li>
              <li>Todas as comunicações entre navegador, servidores do AcroGroup e APIs do Zoom são transmitidas exclusivamente via protocolo HTTPS seguro com TLS 1.3.</li>
              <li>A integridade dos webhooks do Zoom é verificada criptograficamente através de assinaturas HMAC SHA-256 com tokens secretos dedicados.</li>
            </ul>
          </section>

          {/* 5. Retenção e Exclusão de Dados (Deauthorization) */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Retenção, Desconexão e Exclusão de Dados (Data Deletion)</h2>
            <p>
              <strong>Desconexão do Aplicativo (Deauthorization):</strong> Caso você revogue a autorização do AcroGroup Connect através do Zoom App Marketplace (<em>Manage &gt; Added Apps &gt; Remove</em>), nossos servidores revogam e excluem imediatamente todos os tokens de acesso OAuth ativos.
            </p>
            <p>
              <strong>Solicitação de Exclusão Definitiva:</strong> Qualquer usuário tem o direito de solicitar a exclusão integral de sua conta e de todos os históricos de telemetria e presença a qualquer momento. Basta enviar um e-mail para <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a> com a solicitação. A exclusão será concluída no prazo máximo de 5 dias úteis.
            </p>
          </section>

          {/* 6. Direitos do Titular (LGPD) */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Seus Direitos (LGPD)</h2>
            <p>
              Você possui o direito de confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou inexatos, solicitar a anonimização ou eliminação de dados desnecessários e revogar consentimentos previamente concedidos, entrando em contato com nosso Encarregado de Dados.
            </p>
          </section>

          {/* 7. Contato */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Encarregado de Proteção de Dados (DPO) &bull; ACRO GROUP</h3>
              <p className="text-sm">E-mail: <a href="mailto:suporte@acrogroup.com.br" className="text-blue-600 hover:underline">suporte@acrogroup.com.br</a></p>
              <p className="text-sm text-gray-500">Website: <Link href="/" className="text-blue-600 hover:underline">acrotrader.com</Link></p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/terms" className="text-blue-600 hover:underline">Termos de Uso</Link>
              <Link href="/documentation" className="text-blue-600 hover:underline">Documentação</Link>
              <Link href="/support" className="text-blue-600 hover:underline">Central de Suporte</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
